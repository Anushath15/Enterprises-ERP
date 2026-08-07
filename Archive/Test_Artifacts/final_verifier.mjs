import puppeteer from 'puppeteer';

const BASE = 'https://myapplication-2adb30a9.web.app';

const ROUTES = [
  '/', '/dashboard', '/customers', '/stock-adjustments', '/house-projects', '/export-center',
  '/dealers', '/settings', '/reports', '/daily-closing', '/pos',
  '/sales', '/purchases', '/credit-management',
  '/expenses', '/delivery', '/staff', '/users', '/products', '/categories',
  '/warranty', '/notifications', '/profile', '/about', '/help'
];

async function generateStressData(page) {
  console.log('Injecting Stress Data (8k products, 4k customers, 2k dealers, 2k invoices)...');
  await page.evaluate(() => {
    // Generate 8000 Products
    const products = [];
    for(let i = 1; i <= 8000; i++) {
      products.push({
        id: `PRD-${i}`, sku: `SKU-${i}`, barcode: `BAR-${i}`, name: `Test Product ${i} (Pipe / Fitting)`,
        category: 'Plumbing', price: Math.floor(Math.random()*1000)+10, buyingPrice: 5, stock: 100, minStock: 10, unit: 'Nos', gst: 18, hsn: '3917'
      });
    }
    localStorage.setItem('erp_products', JSON.stringify(products));

    // Generate 4000 Customers
    const customers = [];
    for(let i = 1; i <= 4000; i++) {
      customers.push({ id: `CUS-${i}`, name: `Customer ${i}`, phone: `98765${i.toString().padStart(5,'0')}` });
    }
    localStorage.setItem('erp_customers', JSON.stringify(customers));

    // Generate 2000 Dealers
    const dealers = [];
    for(let i = 1; i <= 2000; i++) {
      dealers.push({ id: `DLR-${i}`, name: `Dealer ${i}`, company: `Company ${i}` });
    }
    localStorage.setItem('erp_dealers', JSON.stringify(dealers));

    // Generate 2000 Invoices
    const invoices = [];
    for(let i = 1; i <= 2000; i++) {
      invoices.push({ id: `INV-${i}`, date: new Date().toISOString(), customerId: `CUS-1`, items: [], totalAmount: 500, paidAmount: 500, status: 'Paid' });
    }
    localStorage.setItem('erp_sales_invoices', JSON.stringify(invoices));
  });
}

(async () => {
  console.log('Starting E2E Verification...');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  const metrics = { errors: [], routeTimes: {}, domNodes: {}, totalErrors: 0 };
  
  page.on('pageerror', err => { metrics.errors.push(`PageError: ${err.message}`); metrics.totalErrors++; });
  page.on('console', msg => { 
    if (msg.type() === 'error' && !msg.text().includes('favicon')) {
      metrics.errors.push(`ConsoleError: ${msg.text()}`); metrics.totalErrors++; 
    }
  });

  // 1. Initial Load & Auth check
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  const initialHash = await page.evaluate(() => window.location.hash);
  console.log(`Initial Route: ${initialHash} (Expected: #/ or #/dashboard)`);

  // 2. Data Injection
  await generateStressData(page);
  await page.reload({ waitUntil: 'networkidle0' });

  // 3. Route Traversal
  for (const route of ROUTES) {
    const hash = route === '/' ? '#/' : `#${route}`;
    const start = Date.now();
    await page.evaluate((h) => { window.location.hash = h; }, hash);
    
    // Wait a bit for render
    await new Promise(r => setTimeout(r, 300));
    const end = Date.now();
    
    const nodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
    
    metrics.routeTimes[route] = end - start;
    metrics.domNodes[route] = nodeCount;
    console.log(`Navigated to ${route} - ${end-start}ms - ${nodeCount} nodes`);
  }

  // 4. POS Simulation (Search Latency & 500 Items)
  console.log('Simulating POS Load...');
  await page.evaluate(() => { window.location.hash = '#/pos'; });
  await new Promise(r => setTimeout(r, 500));
  
  // Search test
  const searchStart = Date.now();
  await page.evaluate(() => {
    const event = new CustomEvent('app:search', { detail: { query: 'Pipe' }});
    window.dispatchEvent(event);
  });
  await new Promise(r => setTimeout(r, 100)); // allow event loop
  console.log(`POS Search dispatch time: ~${Date.now() - searchStart}ms`);

  // Keyboard shortcut test (F4 for POS)
  await page.keyboard.press('F4');
  await new Promise(r => setTimeout(r, 200));
  const newHash = await page.evaluate(() => window.location.hash);
  console.log(`F4 shortcut result: ${newHash} (Expected: #/pos)`);

  console.log(`Total Errors Discovered: ${metrics.totalErrors}`);
  if (metrics.totalErrors > 0) {
    console.log('Errors: ', metrics.errors.slice(0, 5));
  }

  await browser.close();
  
  const fs = await import('fs');
  fs.writeFileSync('e2e_results.json', JSON.stringify(metrics, null, 2));
  console.log('Verification Complete. Results saved to e2e_results.json');
})();
