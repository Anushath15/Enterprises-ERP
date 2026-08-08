import puppeteer from 'puppeteer';
import http from 'http';

async function checkURL(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => {
      resolve(false);
    });
  });
}

(async () => {
  const isServerRunning = await checkURL('http://localhost:3000');
  if (!isServerRunning) {
    console.error('ERROR: Local server not running on port 3000');
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('pageerror', err => console.log('RUNTIME ERROR:', err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });

  const delay = ms => new Promise(r => setTimeout(r, ms));
  
  console.log('Navigating to local server...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

  // 1. Bypass login if needed
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('Login') || bodyText.includes('Sign In')) {
    await page.type('#username', 'admin');
    await page.type('#password', 'admin123');
    await page.click('button[type="submit"]');
    await delay(1000);
  }

  console.log('Injecting 20,000 products, 10,000 customers, 5,000 dealers into localStorage...');
  await page.evaluate(() => {
    if (!localStorage.getItem('erp_products') || JSON.parse(localStorage.getItem('erp_products')).length < 20000) {
      const products = [];
      for(let i=1; i<=20000; i++) {
        products.push({
          id: 'PRD-' + String(i).padStart(5, '0'),
          name: 'Test Hardware Product ' + i,
          category: 'Tools',
          buyingPrice: 100,
          price: 150,
          stock: 10,
          isActive: true,
          barcode: '890' + String(i).padStart(10, '0')
        });
      }
      localStorage.setItem('erp_products', JSON.stringify(products));

      const customers = [];
      for(let i=1; i<=10000; i++) {
        customers.push({
          id: 'CST-' + String(i).padStart(5, '0'),
          name: 'Customer ' + i,
          phone: '98' + String(i).padStart(8, '0'),
          credit: 1000
        });
      }
      localStorage.setItem('erp_customers', JSON.stringify(customers));

      const dealers = [];
      for(let i=1; i<=5000; i++) {
        dealers.push({
          id: 'DLR-' + String(i).padStart(5, '0'),
          name: 'Dealer ' + i,
          companyName: 'Supplier Co ' + i,
          phone: '97' + String(i).padStart(8, '0')
        });
      }
      localStorage.setItem('erp_dealers', JSON.stringify(dealers));
    }
  });
  console.log('Reloading to apply massive data...');
  await page.reload({ waitUntil: 'networkidle0' });

  // Helper to test route
  const testRoute = async (route, name) => {
    console.log(`\nTesting ${name} (${route})...`);
    await page.evaluate((r) => { window.location.hash = r; }, route);
    await delay(1000);
    const content = await page.evaluate(() => document.body.innerText);
    if (content.includes('Failed to load page') || content.includes('Page Not Found')) {
      console.log(`[FAILED] Route ${route} returned a 404/Error UI.`);
    } else {
      console.log(`[PASS] Route ${route} loaded.`);
    }
  };

  await testRoute('#/products', 'Products');
  await testRoute('#/customers', 'Customers');
  await testRoute('#/inventory', 'Inventory');
  await testRoute('#/dealers', 'Dealers');
  await testRoute('#/categories', 'Categories');
  await testRoute('#/pos', 'POS');

  // Test Categories CRUD specifically
  console.log('\n--- TESTING CATEGORIES CRUD ---');
  await page.evaluate(() => { window.location.hash = '#/categories'; });
  await delay(1000);
  console.log('Clicking Add Category...');
  await page.evaluate(() => {
    const btn = document.querySelector('#btn-add-cat');
    if (btn) btn.click();
  });
  await delay(500);
  
  // Try to save
  await page.evaluate(() => {
    const nameInput = document.querySelector('#cat-name');
    const saveBtn = document.querySelector('#btn-save-cat');
    if (nameInput) nameInput.value = 'Test Category';
    if (saveBtn) saveBtn.click();
  });
  await delay(500);

  console.log('\n--- TESTING DEALERS DRAWER ---');
  await page.evaluate(() => { window.location.hash = '#/dealers'; });
  await delay(1000);
  console.log('Clicking a dealer row to test drawer...');
  await page.evaluate(() => {
    const row = document.querySelector('[data-dealer-row]');
    if (row) row.click();
  });
  await delay(500);
  
  console.log('Attempting to close drawer...');
  await page.evaluate(() => {
    const cancelBtn = document.querySelector('.close-dealer-drawer');
    if (cancelBtn) cancelBtn.click();
  });
  await delay(500);
  
  await browser.close();
  console.log('\nAudit complete.');
})();
