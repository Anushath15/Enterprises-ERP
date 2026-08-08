import puppeteer from 'puppeteer';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('=== Chaos Monkey - Phase 2: Data Consistency ===');
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('Navigating to Live Firebase...');
  await page.goto('https://myapplication-2adb30a9.web.app/', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#page-root', { timeout: 15000 });
  await page.evaluate(() => { window.location.hash = '#/customers'; });
  await page.waitForSelector('#btn-add-new-customer', { timeout: 10000 });
  
  console.log('1. Creating Customer...');
  await page.click('#btn-add-new-customer');
  await page.waitForSelector('#c-name', { timeout: 5000 });
  await page.type('#c-name', 'Consistency Test Customer');
  await page.type('#c-phone', '9876543210');
  await page.evaluate(() => document.getElementById('save-c-btn').click());
  
  await delay(1000);
  
  console.log('2. Creating Product...');
  await page.evaluate(() => { window.location.hash = '#/products'; });
  await page.waitForSelector('#btn-add-product', { timeout: 10000 });
  await page.click('#btn-add-product');
  await page.waitForSelector('#p-name', { timeout: 5000 });
  await page.type('#p-name', 'Consistency Product');
  await page.type('#p-sku', 'CONS-123');
  await page.type('#p-price', '100');
  await page.type('#p-stock', '10');
  await page.evaluate(() => document.getElementById('save-p-btn').click());
  await delay(2000);

  console.log('3. Selling in POS...');
  await page.evaluate(() => { window.location.hash = '#/pos'; });
  await delay(2000);
  await page.waitForSelector('#pos-search-input', { timeout: 10000 });
  await delay(1000);
  
  // Select Customer
  await page.evaluate(() => { document.getElementById('btn-change-customer').click(); });
  await delay(500);
  await page.type('#customer-search', 'Consistency Test Customer');
  await delay(500);
  await page.click('.customer-select-row');
  await delay(500);
  
  // Select product
  await page.type('#pos-search-input', 'CONS-123');
  await delay(500);
  await page.waitForSelector('.pos-product', { timeout: 5000 });
  await page.click('.pos-product');
  await delay(500);
  
  // Checkout (Credit)
  await page.click('button[data-mode="Credit"]');
  await delay(500);
  await page.click('#btn-save-invoice');
  await delay(2000);

  console.log('4. Deleting Customer...');
  await page.evaluate(() => { window.location.hash = '#/customers'; });
  await delay(2000);
  await page.waitForSelector('#cust-search', { timeout: 10000 });
  await page.type('#cust-search', 'Consistency Test Customer');
  await delay(1000);
  
  const deleted = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#customers-tbody tr'));
    const row = rows.find(r => r.innerText.includes('Consistency Test Customer'));
    if (!row) return false;
    const delBtn = row.querySelector('.cust-delete-btn');
    if (delBtn) {
      delBtn.click();
      return true;
    }
    return false;
  });
  
  if (deleted) {
      await delay(500);
      await page.evaluate(() => {
          const confirmBtn = document.getElementById('confirm-delete-btn');
          if (confirmBtn) confirmBtn.click();
      });
      console.log('Customer deletion initiated.');
  } else {
      console.log('Customer not found for deletion!');
  }
  await delay(2000);
  
  console.log('5. Verifying Integrity in Dashboard...');
  await page.evaluate(() => { window.location.hash = '#/'; });
  await delay(2000);
  
  const dashboardErrors = await page.evaluate(() => {
      // Check if command center header exists
      const header = Array.from(document.querySelectorAll('h1')).find(h => h.innerText.includes('Command Center'));
      if (!header) return "Dashboard failed to load or render";
      return null;
  });
  
  if (dashboardErrors) {
      console.error('❌ Data consistency broke the Dashboard: ' + dashboardErrors);
  } else {
      console.log('Dashboard survived customer deletion.');
  }
  
  console.log('6. Verifying Integrity in Sales Ledger...');
  await page.evaluate(() => { window.location.hash = '#/sales'; });
  await delay(2000);
  
  const salesErrors = await page.evaluate(() => {
      // Check if sales table exists
      const table = document.querySelector('table');
      if (!table) return "Sales ledger failed to load or render";
      
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      if (rows.length === 0) return "No sales rows found!";
      
      const firstRowText = rows[0].innerText;
      if (firstRowText.includes('undefined') || firstRowText.includes('null')) {
        return "Sales ledger rendered null/undefined data";
      }
      return null;
  });
  
  if (salesErrors) {
      console.log(`❌ Data consistency broke the Sales Ledger: ${salesErrors}`);
  } else {
      console.log('Sales ledger survived customer deletion.');
  }

  console.log('=== RESULTS ===');
  await page.evaluate(() => {
      // return local storage for manual check if needed
      return true;
  });

  await browser.close();
  console.log('Consistency check complete.');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
