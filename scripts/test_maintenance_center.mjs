/**
 * Senthil Enterprises ERP - Database Maintenance Center verification harness.
 * Run: node scripts/test_maintenance_center.mjs  (dev server up on :5173)
 *
 * Validates every requirement of Phase 4:
 *  1. Statistics (counts, inventory value, db size, last backup/restore)
 *  2. Health check on clean data (0 errors) and on deliberately dirty data
 *     (detects duplicate ids, missing fields, invalid numbers, negative
 *      stock, broken references, invalid dates)
 *  3. Database Repair (dedupe, recalc totals, normalize numbers, fix refs)
 *     + repair confirmation gate (refuses without `confirmed`)
 *  4. Storage usage (bytes, quota %, largest collections)
 *  5. Cleanup (temp cache / expired backups / orphan records) + gate
 *  6. Database Reset (multi-barrier gate refused when not fully confirmed;
 *     full erase wipes ERP namespace only, preserves auth, triggers reload)
 *  7. Stress: 8,000+ products with injected corruption, full health+repair
 *
 * window.location.reload is mocked in-page so the session survives the
 * reset test; atomic localStorage writes are reverted by re-seeding per test.
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PORT = 5173;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT = path.join(process.cwd(), 'qa_maintenance');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const ADMIN = { id: 'USR-01', username: 'admin', name: 'Admin', role: 'Administrator' };
const EXPIRES = Date.now() + 7 * 24 * 3600 * 1000;
const TOKEN = Date.now().toString();

const AUTH = JSON.stringify({ auth_token: 't-' + TOKEN, auth_user: ADMIN, auth_expires_at: EXPIRES });

function seedScript(store) {
  // `store` is a serialized { erp_*: value } map.
  return `
    (function(){
      window.__CAPTURED__ = [];
      window.__RELOAD = false;
      // Intercept setTimeout callbacks that call reload (the Location.prototype
      // reload is non-configurable, so we neutralise it here). Keeps the test
      // page from being torn down during the reset test.
      const _to = window.setTimeout.bind(window);
      window.setTimeout = function (fn, ms, ...rest) {
        try { if (String(fn).indexOf('reload') !== -1) { window.__RELOAD = true; return 0; } } catch (e) {}
        return _to(fn, ms, ...rest);
      };
      const _orig = window.location.reload.bind(window.location);
      window.location.reload = () => { window.__RELOAD = true; };
      const auth = ${AUTH};
      Object.entries(auth).forEach(([k,v]) => localStorage.setItem(k, JSON.stringify(v)));
      const store = ${JSON.stringify(store)};
      Object.entries(store).forEach(([k,v]) => localStorage.setItem(k, JSON.stringify(v)));
      localStorage.setItem('erp_last_backup', new Date().toISOString());
      // Pre-set today's auto-backup tag so BackupService.checkAutoBackup (on app
      // boot) skips its daily backup side-effect during tests.
      localStorage.setItem('erp_last_auto_backup', '${new Date().toISOString().split('T')[0]}');
    })();
  `;
}

const RESULTS = []; let passed = 0, failed = 0;
const P = (name, ok, detail) => { if (ok) passed++; else failed++; RESULTS.push({name,ok,detail}); console.log(`${ok?'PASS':'FAIL'}  ${name}${detail?' — '+detail:''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  let up = false; try { up = await fetch(BASE + '/').then(r => r.ok); } catch { up = false; }
  if (!up) { console.error('live-server not running on ' + PORT); process.exit(1); }

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-web-security'] });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGE: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') { const t = m.text(); const u = (m.location && m.location().url) || ''; if (!t.includes('favicon') && !u.includes('favicon')) errs.push('CONSOLE: ' + t); } });

  // Dispatch a command in-page with MaintenanceService injected. (String
  // dispatch avoids puppeteer's inability to serialize function arguments.)
  const ms = (code, ...args) => page.evaluate(async (code, args) => {
    const { MaintenanceService } = await import('/services/maintenanceService.js');
    const { LocalStorageService } = await import('/services/storage/localStorageService.js');
    const { DataProvider } = await import('/services/dataProvider.js');
    switch (code) {
      case 'stats': return MaintenanceService.getStatistics();
      case 'health': return MaintenanceService.healthCheck();
      case 'repair': return MaintenanceService.repair(args[0], args[1]);
      case 'storage': return MaintenanceService.storageUsage();
      case 'cleanupPreview': return MaintenanceService.cleanupPreview();
      case 'cleanup': return MaintenanceService.cleanup(args[0], args[1]);
      case 'reset': return MaintenanceService.resetDatabase(args[0]);
      case 'lsKeys': return Object.keys(localStorage).filter(k => String(k).startsWith('erp_'));
      case 'lsGet': return { k: args[0], v: localStorage.getItem(args[0]) };
      case 'reloadFlag': return window.__RELOAD === true;
      case 'dataProviderCount': {
        const m = 'get' + args[0]; return DataProvider[m] ? (DataProvider[m]().length) : null;
      }
    }
  }, code, args);

  // Seed localStorage + install reload/capture mocks immediately (in-page,
  // no navigation needed). Used to reset state between tests.
  const reseed = async (store) => { await page.evaluate(seedScript(store)); };

  // First navigation: evaluateOnNewDocument runs the seed before page JS so
  // auth is valid and the route renders. Subsequent tests call reseed() only,
  // because the SPA is already at #/database-maintenance and the service reads
  // localStorage fresh on every call.
  const loadRoute = async (store) => {
    await page.evaluateOnNewDocument(seedScript(store));
    await page.goto(BASE + '/#/database-maintenance', { waitUntil: 'networkidle2' });
    await sleep(700);
  };

  try {
    // ---- T1 route renders ----
    await loadRoute({ erp_system_state: { initialized: true, lastInvoiceNumber: 1, lastPurchaseNumber: 1 }, erp_products: [], erp_customers: [], erp_dealers: [], erp_sales_invoices: [], erp_purchases: [], erp_expenses: [] });
    const title = await page.$eval('body', e => e.innerText).then(t => t.includes('Production Database Maintenance Center'));
    P('T1 route renders', title);

    // ---- build a clean deterministic dataset ----
    function cleanStore(nProducts = 5) {
      const products = [];
      for (let i = 1; i <= nProducts; i++) products.push({
        id: 'PRD-' + String(i).padStart(4, '0'), sku: 'SKU' + i, name: 'Product ' + i,
        category: i % 2 ? 'Plumbing' : 'Electrical', price: 100 + i * 10, buyingPrice: 40 + i,
        stock: i * 5, minStock: 5, unit: 'pcs', gst: 18, status: 'Active',
        createdAt: '2024-07-30T10:00:00.000Z', updatedAt: '2024-07-30T10:00:00.000Z', version: 1
      });
      const customers = [{ id: 'CUST-001', name: 'Raj', phone: '999', email: 'r@e.com', creditLimit: 50000, outstanding: 1000, address: 'addr' }];
      const dealers = [{ id: 'DEAL-001', name: 'Dealer', companyName: 'D Ltd', phone: '888', outstanding: 0, totalPurchased: 0 }];
      const sales = [{ id: 'INV-001', date: '2024-07-30', customerId: 'CUST-001',
        items: [{ productId: 'PRD-0001', qty: 2, price: 120 }], totalAmount: 240, amountPaid: 240, balance: 0, paymentMode: 'Cash', status: 'Completed' }];
      const purchases = [{ id: 'PO-001', date: '2024-07-30', supplierId: 'DEAL-001', items: [{ productId: 'PRD-0001', qty: 5, price: 45 }], totalAmount: 225, amountPaid: 0, status: 'Pending' }];
      const expenses = [{ id: 'EXP-001', date: '2024-07-30', amount: 500, category: 'Transport', paymentMode: 'Cash' }];
      return {
        erp_system_state: { initialized: true, lastInvoiceNumber: 1, lastPurchaseNumber: 1 },
        erp_products: products, erp_customers: customers, erp_dealers: dealers,
        erp_sales_invoices: sales, erp_purchases: purchases, erp_expenses: expenses,
        erp_daily_closings: []
      };
    }

    // ---- T2 statistics ----
    const clean = cleanStore(7);
    await reseed(clean);
    const stats = await ms('stats');
    P('T2 stats counts', stats.products === 7 && stats.customers === 1 && stats.dealers === 1 && stats.sales === 1 && stats.purchases === 1 && stats.expenses === 1,
      `products=${stats.products} cust=${stats.customers} inv=${stats.sales} invVal=${stats.inventoryValue}`);
    P('T2 inventory value numeric & positive', stats.inventoryValue > 0, `value=${stats.inventoryValue}`);

    // ---- T3 health clean ----
    const hc = await ms('health');
    P('T3 health clean: 0 errors', hc.summary.errors === 0 && hc.findings.filter(f=>f.severity==='error').length === 0,
      `errors=${hc.summary.errors} warnings=${hc.summary.warnings} total=${hc.summary.total}`);

    // ---- T4 health dirty ----
    const dirty = cleanStore(5);
    dirty.erp_products = [
      { id: 'DUP', name: 'A', price: 10, buyingPrice: 5, stock: 3, status: 'Active', createdAt: '2024-07-30T10:00:00.000Z' },
      { id: 'DUP', name: 'A dup', price: 10, buyingPrice: 5, stock: 3, status: 'Active', createdAt: '2024-07-30T10:00:00.000Z' },
      { id: 'NEG', name: 'Negstock', price: 20, buyingPrice: 5, stock: -4, status: 'Active', createdAt: '2024-07-30T10:00:00.000Z' },
      { id: 'BADNUM', name: '', price: 'free', buyingPrice: 5, stock: 2, status: 'Active', createdAt: 'bad-date' }
    ];
    dirty.erp_sales_invoices = [{ id: 'INV-001', date: '2024-07-30', customerId: 'CUST-NOPE', items: [{ qty: 2, price: 120 }], totalAmount: 240, amountPaid: 240 }];
    dirty.erp_daily_closings = [];
    await reseed(dirty);
    const hd = await ms('health');
    const codes = new Set(hd.findings.map(f => f.code));
    const has = c => codes.has(c);
    P('T4 health dirty detects DUPLICATE_ID', has('DUPLICATE_ID'));
    P('T4 health dirty detects NEGATIVE_STOCK', has('NEGATIVE_STOCK'));
    P('T4 health dirty detects MISSING_FIELD', has('MISSING_FIELD'));
    P('T4 health dirty detects INVALID_NUMBER', has('INVALID_NUMBER'));
    P('T4 health dirty detects INVALID_DATE', has('INVALID_DATE'));
    P('T4 health dirty detects BROKEN_REFERENCE', has('BROKEN_REFERENCE'));
    P('T4 health dirty: errors>0', hd.summary.errors > 0, `errors=${hd.summary.errors}`);

    // ---- T5 repair ----
    const r5 = await ms('repair', { dedupe: true, recalcTotals: true, normalizeNumbers: true, fixReferences: true }, true);
    P('T5 repair ok', r5.ok === true, `actions=${r5.actions ? r5.actions.length : 0}`);
    const after = await ms('health');
    const acodes = new Set(after.findings.map(f => f.code));
    P('T5 repair removed duplicates', !acodes.has('DUPLICATE_ID'));
    P('T5 repair fixed broken refs', !acodes.has('BROKEN_REFERENCE'));
    P('T5 repair clamped negatives', !acodes.has('NEGATIVE_STOCK') && !acodes.has('NEGATIVE_VALUE'));
    P('T5 repair fixed invalid numbers', !acodes.has('INVALID_NUMBER'));
    P('T5 repair reduced errors', after.summary.errors < hd.summary.errors, `before=${hd.summary.errors} after=${after.summary.errors}`);

    // ---- T6 repair gate (no confirmation) ----
    const r6 = await ms('repair', { dedupe: true }, false);
    P('T6 repair refused without confirmation', r6.ok === false && r6.reason === 'not confirmed', r6.reason);

    // ---- T7 storage usage ----
    const st = await ms('storage');
    P('T7 storage used>0 & percent valid', st.usedBytes > 0 && st.percent >= 0 && st.percent <= 100,
      `used=${(st.usedBytes/1024).toFixed(1)}KB pct=${st.percent}% largest=${st.largestCollections.length}`);

    // ---- T8 cleanup (temp cache) ----
    const withTemp = cleanStore(3);
    withTemp.erp_drafts = { formA: 1 };
    withTemp.erp_temp_x = 'tmp';
    withTemp.erp_cache_y = { x: 1 };
    withTemp.erp_backup_old = [{ id: 1 }];
    await reseed(withTemp);
    const preview = await ms('cleanupPreview');
    P('T8 cleanup preview lists temp keys', preview.safeToRemove.length >= 3, `safeToRemove=${preview.safeToRemove.length}`);
    const r8 = await ms('cleanup', {}, true);
    P('T8 cleanup removes temp keys', r8.ok && r8.removed >= 3, `removed=${r8.removed}`);
    const dAfter = await ms('lsGet', 'erp_drafts');
    const tAfter = await ms('lsGet', 'erp_temp_x');
    const cAfter = await ms('lsGet', 'erp_cache_y');
    P('T8 temp keys actually gone', dAfter.v === null && tAfter.v === null && cAfter.v === null);

    // ---- T9 cleanup orphans ----
    const withOrphan = cleanStore(3);
    withOrphan.erp_stock_adjustments = [{ id: 'ADJ-1', date: '2024-07-30', productId: 'PRD-0001', quantity: 2 }, { id: 'ADJ-2', date: '2024-07-30', productId: 'PRD-MISSING', quantity: 1 }];
    await reseed(withOrphan);
    const prev = await ms('cleanupPreview');
    P('T9 orphan preview finds orphan', prev.orphans.length === 1, `orphans=${prev.orphans.length}`);
    const r9 = await ms('cleanup', { removeOrphans: true }, true);
    P('T9 cleanup removes orphan record', r9.ok, `removed=${r9.removed}`);
    const adjCount = await ms('dataProviderCount', 'StockAdjustments');
    P('T9 orphan count reduced to 1', adjCount === 1, `count=${adjCount}`);

    // ---- T9b cleanup gate ----
    await reseed(cleanStore(3));
    const r9b = await ms('cleanup', {}, false);
    P('T9b cleanup refused without confirmation', r9b.ok === false && r9b.reason === 'not confirmed', r9b.reason);

    // ---- T10 reset gating ----
    await reseed(cleanStore(3));
    const rg1 = await ms('reset', { confirmed: false });
    P('T10 reset refused (not confirmed)', rg1.ok === false, rg1.reason || '');
    const rg2 = await ms('reset', { confirmed: true });
    P('T10 reset refused (no ERASE token)', rg2.ok === false, rg2.reason || '');
    const rg3 = await ms('reset', { confirmed: true, confirmationText: 'ERASE' });
    if (rg3.ok) await sleep(1400);
    const products = await ms('lsGet', 'erp_products');
    const settings = await ms('lsGet', 'erp_settings');
    const daily = await ms('lsGet', 'erp_daily_closings');
    const auth = await ms('lsGet', 'auth_token');
    const restoreTag = await ms('lsGet', 'erp_last_restore');
    const remaining = await ms('lsKeys');
    const didReload = await ms('reloadFlag');
    P('T10 reset wiped business collections', products.v === null && settings.v === null && daily.v === null,
      `products=${products.v===null} settings=${settings.v===null} daily=${daily.v===null}`);
    P('T10 reset preserved auth + wrote restore marker', auth.v !== null && restoreTag.v !== null,
      `auth=${auth.v!==null} restoreTag=${restoreTag.v!==null}`);
    P('T10 reset only left erp_last_restore (no other ERP data)', remaining.length === 1 && remaining[0] === 'erp_last_restore',
      `remaining=${JSON.stringify(remaining)}`);
    P('T10 reset triggered reload (mocked)', didReload === true);

    // ---- T11 stress ----
    const big = [];
    for (let i = 1; i <= 8000; i++) big.push({ id: 'PRD-' + String(i).padStart(5, '0'), name: 'P' + i, price: i, buyingPrice: i / 2, stock: i % 10, status: 'Active', createdAt: '2024-07-30T10:00:00.000Z' });
    const dirtyBig = cleanStore(8000);
    dirtyBig.erp_products = big.slice(0, 7800).concat(big.slice(0, 200));
    for (let i = 0; i < 300; i++) dirtyBig.erp_products[i].stock = -1;
    await reseed(dirtyBig);
    const t0 = Date.now();
    const hb = await ms('health');
    const tHealth = Date.now() - t0;
    P('T11 stress health scan completes', hb.summary.errors > 0, `errors=${hb.summary.errors} ms=${tHealth}`);
    const t1 = Date.now();
    const rb = await ms('repair', { dedupe: true, recalcTotals: true, normalizeNumbers: true, fixReferences: true }, true);
    const tRepair = Date.now() - t1;
    P('T11 stress repair completes', rb.ok, `actions=${rb.actions.length} ms=${tRepair}`);
    const ab = await ms('health');
    const aCodes = new Set(ab.findings.map(f=>f.code));
    P('T11 stress: dupes/negatives fixed after repair', !aCodes.has('DUPLICATE_ID') && !aCodes.has('NEGATIVE_STOCK'), `errors before=${hb.summary.errors} after=${ab.summary.errors}`);

  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(OUT, 'maintenance_results.json'), JSON.stringify(RESULTS, null, 2));
  console.log(`\nTotals: ${passed} passed, ${failed} failed.` + (errs.length ? `\nPage errors: ${errs.slice(0,8).join(' | ')}` : ''));
  if (failed > 0 || errs.length > 0) process.exit(1);
  console.log('Database Maintenance verification PASSED.');
})().catch(e => { console.error('Harness error:', e); process.exit(1); });




