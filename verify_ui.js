const puppeteer = require('puppeteer');

const routes = [
  { name: 'Dashboard', hash: '#/' },
  { name: 'POS', hash: '#/pos' },
  { name: 'Sales', hash: '#/sales' },
  { name: 'Purchases', hash: '#/purchases' },
  { name: 'Products', hash: '#/products' },
  { name: 'Customers', hash: '#/customers' },
  { name: 'Dealers', hash: '#/dealers' },
  { name: 'Delivery', hash: '#/delivery' },
  { name: 'Sales Return', hash: '#/sales-return' },
  { name: 'Purchase Return', hash: '#/purchase-return' },
  { name: 'Expenses', hash: '#/expenses' },
  { name: 'House Projects', hash: '#/house-projects' },
  { name: 'Warranty', hash: '#/warranty' },
  { name: 'Reports', hash: '#/reports' },
  { name: 'Daily Closing', hash: '#/daily-closing' },
  { name: 'Credit Management', hash: '#/credit' },
  { name: 'Staff', hash: '#/staff' },
  { name: 'Users', hash: '#/users' },
  { name: 'Settings', hash: '#/settings' }
];

async function runTest() {
  console.log('Starting automated QA verification...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const results = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`[Browser Error]: ${msg.text()}`);
    }
  });

  for (const route of routes) {
    console.log(`Testing ${route.name}...`);
    let hasError = false;
    
    // Add error listener specifically for this page
    const errorHandler = msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        hasError = true;
      }
    };
    page.on('console', errorHandler);
    
    try {
      await page.goto(`http://localhost:5500/${route.hash}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1000)); // Let UI settle
      
      const content = await page.content();
      const hasSVGs = content.includes('<svg') && !content.includes('lucide'); // very rough check
      
      // Let's check for lucide icons count
      const lucideCount = await page.evaluate(() => document.querySelectorAll('[data-lucide], .lucide').length);
      
      results.push({
        name: route.name,
        status: hasError ? 'FAIL' : 'PASS',
        lucideCount
      });
      
    } catch (err) {
      console.error(`Error loading ${route.name}:`, err);
      results.push({ name: route.name, status: 'FAIL', lucideCount: 0 });
    }
    
    page.off('console', errorHandler);
  }

  await browser.close();
  
  console.log('\\n--- TEST RESULTS ---');
  results.forEach(r => {
    console.log(`${r.name}: ${r.status} (Icons: ${r.lucideCount})`);
  });
}

runTest().catch(console.error);
