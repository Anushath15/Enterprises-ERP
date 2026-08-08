/**
 * Senthil Enterprises ERP - Export Center verification harness.
 * Run with: node scripts/test_export_center.mjs  (dev server must be up on :5173)
 *
 * Strategy: the app exports via Blob -> URL.createObjectURL + <a download>.
 * We override URL.createObjectURL *before* page load so every export lands in
 * window.__CAPTURED__. We drive the real UI buttons, then validate the captured
 * blob IN the page (CSV row count, Excel via window.XLSX, PDF %PDF header).
 * Covers all datasets x {CSV,Excel,PDF}, 10,001-row stress, empty-dataset path.
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const PORT = 5173;
const BASE = `http://127.0.0.1:${PORT}`;
const DOWNLOADS = path.join(process.cwd(), 'qa_exports');
if (!fs.existsSync(DOWNLOADS)) fs.mkdirSync(DOWNLOADS, { recursive: true });

const ADMIN_USER = { id: 'USR-01', username: 'admin', name: 'Senthil Kumar', role: 'Administrator' };
const EXPIRES = Date.now() + 7 * 24 * 3600 * 1000;
const SEED_STAMP = Date.now().toString();

function buildSeed(productCount = 3) {
  const products = [];
  for (let i = 1; i <= productCount; i++) {
    products.push({
      id: 'PRD-' + String(i).padStart(5, '0'), sku: 'SKU-' + i, barcode: 'BAR' + i,
      name: 'Test Product ' + i, category: 'Category-' + (i % 5), price: 110 + i,
      buyingPrice: 50 + (i % 10), stock: i % 50, minStock: 5, unit: 'pcs',
      gst: 18, hsn: '8517', status: 'Active', supplier: 'SUP-1', brand: 'BrandX',
      isActive: true, createdAt: '2024-01-01', updatedAt: '2024-01-02', version: 1
    });
  }
  return {
    erp_system_state: { initialized: true, lastInvoiceNumber: 1, lastPurchaseNumber: 1 },
    erp_products: products,
    erp_customers: [{ id: 'CUST-001', name: 'Rajesh Kumar', phone: '9876543210', email: 'raj@ex.com',
      gst: '33AAAAB1BBB2C3Z4', type: 'Regular', creditLimit: 50000, outstanding: 12000.5,
      address: '123 Main St, Kanniakumari' }],
    erp_dealers: [{ id: 'DEAL-001', name: 'Dealer One', companyName: 'One Traders', phone: '9112223344',
      email: 'one@ex.com', gst: '33CCAAD1111D2Z3', contactPerson: 'Ramesh', outstanding: 8000,
      totalPurchased: 150000 }],
    erp_sales_invoices: [{ id: 'INV-00001', date: '2024-07-30', customerId: 'CUST-001',
      items: [{ productId: 'PRD-00001', qty: 3, price: 110 }],
      totalAmount: 330, amountPaid: 330, balance: 0, paymentMode: 'Cash', status: 'Completed' }],
    erp_purchases: [{ id: 'PO-00001', invoiceNumber: 'PINV-001', date: '2024-07-01', supplierId: 'DEAL-001',
      items: [{ productId: 'PRD-00001', qty: 10, price: 55 }], totalAmount: 550, amountPaid: 0, status: 'Pending' }],
    erp_expenses: [{ id: 'EXP-00001', date: '2024-07-02', amount: 2500, category: 'Transport',
      description: 'Delivery to site', paymentMode: 'Cash' }],
    erp_daily_closings: [{ id: 'CLS-00001', date: '2024-07-30', openingCash: 15000, cashSales: 12000,
      upiSales: 5000, cardSales: 3000, creditSales: 2000, totalExpenses: 2500,
      expectedCash: 28500, actualCash: 28498.5, difference: -1.5, remarks: 'Float' }]
  };
}

const authSeed = () => JSON.stringify({ auth_token: 'test-token-' + SEED_STAMP, auth_user: ADMIN_USER, auth_expires_at: EXPIRES });

function seedScript(productCount = 3) {
  const seed = JSON.stringify(buildSeed(productCount));
  return `
    (function(){
      window.__CAPTURED__ = [];
      window.__ERRORS__ = [];
      const _o = window.URL.createObjectURL.bind(window.URL);
      window.URL.createObjectURL = (b)=>{ window.__CAPTURED__.push(b); return _o(b); };
      window.URL.revokeObjectURL = ()=>{};
      const auth = ${authSeed()};
      Object.entries(auth).forEach(([k,v]) => localStorage.setItem(k, JSON.stringify(v)));
      const seed = ${seed};
      Object.entries(seed).forEach(([k,v]) => localStorage.setItem(k, JSON.stringify(v)));
    })();
  `;
}

function emptyScript() {
  return `
    (function(){
      window.__CAPTURED__ = []; window.__ERRORS__ = [];
      const _o = window.URL.createObjectURL.bind(window.URL);
      window.URL.createObjectURL = (b)=>{ window.__CAPTURED__.push(b); return _o(b); };
      window.URL.revokeObjectURL = ()=>{};
      const auth = ${authSeed()};
      Object.entries(auth).forEach(([k,v]) => localStorage.setItem(k, JSON.stringify(v)));
      localStorage.setItem('erp_products', '[]');
      localStorage.setItem('erp_customers', '[]');
      localStorage.setItem('erp_daily_closings', '[]');
      localStorage.setItem('erp_system_state', JSON.stringify({initialized:true}));
    })();
  `;
}

const RESULTS = [];
let passed = 0, failed = 0;
const P = (name, ok, detail) => {
  if (ok) passed++; else failed++;
  RESULTS.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function capturedCount(page) {
  return await page.evaluate(() => window.__CAPTURED__.length);
}

(async () => {
  // health check
  let up = false;
  try { up = await fetch(BASE + '/').then(r => r.ok); } catch { up = false; }
  if (!up) { console.error('live-server not running on ' + PORT + '. Run: npm run dev'); process.exit(1); }

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] });
  const page = await browser.newPage();
  const pageErrs = [];
  page.on('pageerror', e => pageErrs.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error') {
      const text = m.text();
      const mUrl = (m.location && m.location().url) || '';
      if (!text.includes('favicon') && !mUrl.includes('favicon') && !text.includes('chrome-extension')) {
        pageErrs.push(text);
      }
    }
  });
  page.on('requestfailed', r => {
    const u = r.url();
    if (!u.includes('favicon') && !u.includes('chrome-extension')) pageErrs.push('net:' + u);
  });

  try {
    // 1. Route renders
    await page.evaluateOnNewDocument(seedScript(3));
    await page.goto(BASE + '/#/export-center', { waitUntil: 'networkidle2' });
    await sleep(600);
    const rendered = await page.$eval('body', e => e.innerText).then(t => t.includes('Export Center'));
    P('route: export-center loads & renders', rendered);

    // 2. dataset x format — click the REAL UI button, then poll IN the page
    //    (PDF lazy-loads jsPDF from CDN, so the blob can arrive >4s late). The
    //    in-page poll awaits the full async export before we read the blob.
    const datasets = ['products', 'customers', 'dealers', 'sales', 'purchases', 'expenses', 'daily_closing'];
    const formats = [
      { btnSel: '#export-csv',  key: 'csv',  ext: 'csv' },
      { btnSel: '#export-excel', key: 'excel', ext: 'xlsx' },
      { btnSel: '#export-pdf',  key: 'pdf',  ext: 'pdf' }
    ];

    for (const ds of datasets) {
      for (const f of formats) {
        // re-seed + reset capture, set dropdown, click the real button, poll.
        const info = await page.evaluate(async (ds, btnSel, ext) => {
          window.__CAPTURED__ = [];
          const sel = document.getElementById('export-dataset');
          sel.value = ds;
          sel.dispatchEvent(new Event('change'));
          const btn = document.querySelector(btnSel);
          btn.click();
          // Poll up to 6s for the export to produce a blob.
          const end = Date.now() + 6000;
          while (Date.now() < end) {
            if (window.__CAPTURED__.length >= 1) break;
            await new Promise(r => setTimeout(r, 30));
          }
          const b = window.__CAPTURED__[0];
          if (!b) return { captured: 0 };
          const out = { captured: 1, type: b.type, size: b.size };
          try {
            if (ext === 'csv') {
              const txt = (await b.text()).replace(/\uFEFF/g, '');
              const rows = txt.split(/\r?\n/).filter(Boolean);
              out.rows = rows.length; out.headerOk = rows[0] && rows[0].includes(',');
            } else if (ext === 'xlsx') {
              const ab = await b.arrayBuffer();
              let wb; try { wb = window.XLSX.read(ab, { type: 'array' }); } catch (e) { out.xlsxE = e.message; return out; }
              const ws = wb.Sheets[wb.SheetNames[0]];
              out.rows = window.XLSX.utils.sheet_to_json(ws, { header: 1 }).length;
            } else if (ext === 'pdf') {
              out.isPdf = (await b.slice(0, 5).text()).includes('%PDF');
            }
          } catch (e) { out.analyzeError = e.message; }
          return out;
        }, ds, f.btnSel, f.ext);

        const ok = info.captured === 1 && info.size > 0 && (
          f.ext === 'csv' ? (info.rows >= 2 && info.headerOk) :
          f.ext === 'xlsx' ? (info.rows >= 2) :
          f.ext === 'pdf' ? (info.isPdf === true) : false
        );
        let detail = `${f.key} captured=${info.captured} size=${info.size}`;
        if (info.captured === 1) {
          if (f.ext === 'csv') detail += ` rows=${info.rows}`;
          else if (f.ext === 'xlsx') detail += ` rows=${info.rows}${info.xlsxE ? ' ERR=' + info.xlsxE : ''}`;
          else if (f.ext === 'pdf') detail += ` pdf=${info.isPdf}`;
          if (info.analyzeError) detail += ` analyzeErr=${info.analyzeError}`;
        }
        P(`export ${ds} -> ${f.key}`, ok, detail);
      }
    }

    // 3. Stress: 10,001 products CSV row count (validate in-page)
    await page.evaluate(seedScript(10001));
    await page.select('#export-dataset', 'products');
    await page.click('#export-csv');
    await sleep(800);
    const stressRows = await page.evaluate(async () => {
      if (!window.__CAPTURED__.length) return { count: 0 };
      const txt = (await window.__CAPTURED__[0].text()).replace(/\uFEFF/g, '');
      return { count: txt.split(/\r?\n/).filter(Boolean).length };
    });
    P('stress: 10,001 products CSV row count', stressRows.count >= 10002, `rows=${stressRows.count}`);

    // 4. Empty dataset path -> no blob captured, no runtime crash
    const errBefore = pageErrs.length;
    await page.evaluate(emptyScript());
    await page.select('#export-dataset', 'products');
    await page.click('#export-csv');
    await sleep(500);
    const emptyCount = await capturedCount(page);
    const errAfter = pageErrs.length;
    P('empty dataset: no download, no crash', emptyCount === 0 && errAfter === errBefore,
      `captured=${emptyCount} pageErrorsDelta=${errAfter - errBefore}`);

  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(DOWNLOADS, 'export_harness_results.json'), JSON.stringify(RESULTS, null, 2));
  console.log(`\nTotals: ${passed} passed, ${failed} failed.`);
  if (pageErrs.length) console.log('Page errors: ' + pageErrs.slice(0, 8).join(' | '));
  if (failed > 0 || pageErrs.length) process.exit(1);
  console.log('Export Center verification PASSED.');
})().catch(e => { console.error('Harness error:', e); process.exit(1); });
