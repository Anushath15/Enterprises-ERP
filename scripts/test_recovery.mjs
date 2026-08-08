// Phase 6 — Part 6: Recovery & Failure Testing.
// Verifies graceful handling of: clean reload persistence, corrupt localStorage
// payloads, missing system-state (re-init), and a backup/restore round-trip.
import { BASE, launchBrowser, loadResults, saveResults, sleep, waitReady, loginApp } from './_harness.mjs';

(async () => {
  const { browser, page, errors } = await launchBrowser('recovery');
  const r = loadResults();
  r.recovery = { cases: [], verdict: '', pageErrors: [] };

  const record = (name, ok, detail) => { r.recovery.cases.push({ name, ok, detail }); console.log('[Part 6] ' + name + ' = ' + (ok ? 'PASS' : 'FAIL') + (detail ? ' :: ' + detail : '')); };
  const reload = async () => { await page.reload({ waitUntil: 'networkidle0' }); await waitReady(page); };

  await loginApp(page);

  // Case 1 — persistence across a hard reload.
  await page.evaluate(async () => {
    const { DataProvider } = await import('./services/dataProvider.js');
    for (let i = 0; i < 50; i++) DataProvider.saveProduct({ sku: 'RC' + i, name: 'Recover Product ' + i, price: 100, buyingPrice: 50, stock: 10 + i, minStock: 5, status: 'In Stock', statusBadge: 'success', category: 'Plumbing', unit: 'Nos', gst: 18, hsn: '3917', supplier: 'S', brand: 'B', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  });
  const before = await page.evaluate(async () => { const { DataProvider } = await import('./services/dataProvider.js'); return DataProvider.getProducts().length; });
  await reload();
  const after = await page.evaluate(async () => { const { DataProvider } = await import('./services/dataProvider.js'); return DataProvider.getProducts().length; });
  record('reload persistence', after === before, 'before=' + before + ' after=' + after);

  // Case 2 — corrupt a collection with invalid JSON.
  await page.evaluate(async () => { localStorage.setItem('erp_products', '{ this is :: not json ]'); });
  let crashed = false; let errMsg = '';
  const errBefore = errors.length;
  try { await reload(); } catch (e) { crashed = true; errMsg = e.message; }
  const prodAfter = await page.evaluate(async () => { try { const { DataProvider } = await import('./services/dataProvider.js'); return { n: DataProvider.getProducts().length, ok: true }; } catch (e) { return { n: -1, ok: false, error: e.message }; } });
  record('corrupt JSON handling', prodAfter.ok && prodAfter.n === 0 && !crashed, 'ok=' + prodAfter.ok + ' n=' + prodAfter.n + ' crashed=' + crashed + ' pageErr=' + (errors.length - errBefore));
  r.recovery.pageErrors = errors.slice(errBefore);

  // Case 3 — missing system state -> re-init from SeedData.
  await page.evaluate(async () => { localStorage.removeItem('erp_system_state'); localStorage.removeItem('erp_products'); });
  let crashed3 = false; let errMsg3 = '';
  try { await reload(); } catch (e) { crashed3 = true; errMsg3 = e.message; }
  const seeded = await page.evaluate(async () => { const { DataProvider } = await import('./services/dataProvider.js'); return { products: DataProvider.getProducts().length, customers: DataProvider.getCustomers().length }; });
  record('re-init after state loss', seeded.products > 0 && !crashed3, 'products=' + seeded.products + ' customers=' + seeded.customers + ' crashed=' + crashed3 + ' (' + errMsg3 + ')');

  // Case 4 — backup / restore round-trip (snapshot all erp_ keys, wipe, restore, reload).
  await page.evaluate(async () => {
    for (let i = 0; i < 10; i++) { const { DataProvider } = await import('./services/dataProvider.js'); DataProvider.saveProduct({ sku: 'RT' + i, name: 'Roundtrip ' + i, price: 10, buyingPrice: 5, stock: 5, minStock: 1, status: 'In Stock', statusBadge: 'success', category: 'Plumbing', unit: 'Nos', gst: 18, hsn: '3917', supplier: 'S', brand: 'B', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }); }
  });
  await page.evaluate(async () => {
    const snap = {};
    for (const k of Object.keys(localStorage)) { if (/^erp_/.test(k)) snap[k] = localStorage.getItem(k); }
    localStorage.setItem('__rt_backup__', JSON.stringify(snap));
    for (const k of Object.keys(localStorage)) { if (/^erp_/.test(k)) localStorage.removeItem(k); }
  });
  await page.evaluate(async () => {
    const snap = JSON.parse(localStorage.getItem('__rt_backup__') || '{}');
    for (const k of Object.keys(snap)) { try { localStorage.setItem(k, snap[k]); } catch (e) {} }
    localStorage.removeItem('__rt_backup__');
  });
  await reload();
  const restored = await page.evaluate(async () => { const { DataProvider } = await import('./services/dataProvider.js'); return DataProvider.getProducts().filter(p => /^RT/.test(p.sku)).length; });
  record('backup/restore round-trip', restored === 10, 'restored RT products=' + restored);

  // Case 5 — empty-but-valid collection (not corrupt).
  await page.evaluate(async () => { localStorage.setItem('erp_customers', '[]'); });
  let crashed5 = false;
  try { await reload(); } catch (e) { crashed5 = true; }
  const cust = await page.evaluate(async () => { const { DataProvider } = await import('./services/dataProvider.js'); return DataProvider.getCustomers().length; });
  record('empty array collection', cust === 0 && !crashed5, 'customers=' + cust + ' crashed=' + crashed5);

  r.recovery.verdict = r.recovery.cases.every(c => c.ok) ? 'PASS - all recovery scenarios handled gracefully' : 'FAIL - one or more recovery scenarios degraded the app';
  r.recovery.pageErrorsAll = errors;
  console.log('[Part 6] ' + r.recovery.verdict + ' (' + r.recovery.cases.filter(c => c.ok).length + '/' + r.recovery.cases.length + ' passed)');
  await browser.close();
  saveResults(r);
  process.exit(r.recovery.cases.every(c => c.ok) ? 0 : 1);
})();
