// End-to-end verification of the print-preview fixes:
//   pos.js        getReceiptHtml: cgstTotal/sgstTotal were undefined (ReferenceError at pos.js:1003)
//   quotations.js printReceipt:  referenced undefined `estimation` instead of `invoice`
// Requires: scripts/_static_server.cjs running on :5173
import puppeteer from 'puppeteer';

const BASE = 'http://127.0.0.1:5173';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1280, height: 800 }
});

const page = await browser.newPage();
page.setDefaultTimeout(20000);

const allErrors = [];
page.on('pageerror', e => allErrors.push(String(e)));

const seed = async (route) => {
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle0' });
  await page.evaluate((r) => {
    localStorage.clear();
    localStorage.setItem('auth_token', JSON.stringify('offline-verify-session'));
    localStorage.setItem('auth_user', JSON.stringify({ id: 'USR-000001', username: 'admin', name: 'Administrator', role: 'admin' }));
    localStorage.setItem('auth_expires_at', JSON.stringify(Date.now() + 86400000));
    localStorage.setItem('erp_settings', JSON.stringify({
      shopName: 'Senthil Enterprises', address: 'Main Road, Salem', phone: '0427-000000',
      gstin: '33ABCDE1234F1Z5', showGstinOnInvoice: true, showHsnCodeOnInvoice: true,
      showCustomerPhoneOnInvoice: true, showPaymentModeOnInvoice: true, showDiscountOnInvoice: true
    }));
    localStorage.setItem('erp_products', JSON.stringify([{
      id: 'PRD-VERIFY-1', name: 'Verify Steel Pipe', price: 118, stock: 50, taxRate: 18,
      pricingMode: 'inclusive', hsnCode: '7306', unit: 'nos', category: 'Test', isActive: true
    }]));
    localStorage.setItem('erp_system_state', JSON.stringify({ lastINVNumber: 0 }));
    window.location.hash = r;
  }, route);
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(500);
  await page.waitForSelector('#btn-print-preview', { timeout: 15000 });
  await page.evaluate(() => {
    window.__captured = '';
    window.open = () => ({
      document: { write: (h) => { window.__captured = h; }, close() {} },
      focus() {}, print() {}
    });
  });
};

const preview = async () => {
  await page.click('.pos-product[data-id="PRD-VERIFY-1"]');
  await sleep(300);
  await page.evaluate(() => document.querySelector('#btn-print-preview').click());
  await sleep(500);
  return page.evaluate(() => window.__captured);
};

const report = (label, html, checks) => {
  const ok = Object.values(checks).every(Boolean);
  console.log(`\n=== ${label}: ${ok ? 'PASS' : 'FAIL'} ===`);
  for (const [k, v] of Object.entries(checks)) console.log(`  ${v ? '[ok]' : '[X]'} ${k}`);
  return ok;
};

const posChecks = (html) => ({
  'Total GST line rendered (+ ₹18.00)': html.includes('+ ₹18.00'),
  'CGST/SGST not NaN': !html.includes('NaN'),
  'Round Off line rendered (₹0.00)': html.includes('₹0.00'),
  'Grand Total ₹118.00': html.includes('₹118.00'),
  'Product row present': html.includes('Verify Steel Pipe'),
  'Receipt non-empty': html.length > 500
});

const quoChecks = (html) => ({
  'ESTIMATION (NOT A TAX INVOICE) title': html.includes('ESTIMATION') && html.includes('NOT A TAX INVOICE'),
  'No NaN': !html.includes('NaN'),
  'Grand Total ₹118.00': html.includes('₹118.00'),
  'Product row present': html.includes('Verify Steel Pipe'),
  'Receipt non-empty': html.length > 500
});

try {
  let allPass = true;

  allErrors.length = 0;
  await seed('#/pos');
  const posHtml = await preview();
  allPass = report('POS print preview (erp://app/pages/pos.js:1003 fix)', posHtml, posChecks(posHtml)) && allPass;

  allErrors.length = 0;
  await seed('#/quotations');
  const quoHtml = await preview();
  allPass = report('QUOTATIONS print preview (estimation.items fix)', quoHtml, quoChecks(quoHtml)) && allPass;

  console.log('\nRuntime JS errors captured during run:');
  console.log(allErrors.length ? allErrors.join('\n') : '  (none)');
  if (allErrors.length > 0) allPass = false;

  console.log(allPass ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
} finally {
  await browser.close();
}