const puppeteer = require('puppeteer');

async function runStressTest() {
  console.log('Starting Performance & Stress Test (Phase 4)...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Go to the app
  await page.goto('http://localhost:5500/#/', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => typeof window.DataProvider !== 'undefined' || typeof window.app !== 'undefined', { timeout: 2000 }).catch(() => {});
  
  console.log('Generating dummy dataset...');
  
  const results = await page.evaluate(async () => {
    let DP = window.DataProvider;
    if (!DP) {
      const module = await import('./services/dataProvider.js');
      DP = module.DataProvider;
    }
    
    // Clear and init
    localStorage.clear();
    localStorage.setItem('erp_system_state', JSON.stringify({}));
    
    const TARGETS = {
      products: 1000,
      customers: 600,
      dealers: 200,
      sales: 2000,
      purchases: 2000,
      returns: 1000, // Split 500 sales returns, 500 purchase returns
      projects: 200
    };
    
    let productIds = [];
    let customerIds = [];
    let dealerIds = [];
    
    const d = new Date().toISOString();
    
    try {
      // Products
      let products = [];
      for(let i=1; i<=TARGETS.products; i++) {
        let pId = `PRD-${String(i).padStart(6, '0')}`;
        products.push({ id: pId, name: `Product ${i}`, sku: `SKU-${i}`, category: 'Test', price: 100, buyingPrice: 50, stock: 100, minStock: 10 });
        productIds.push(pId);
      }
      localStorage.setItem('erp_products', JSON.stringify(products));

      // Customers
      let customers = [];
      for(let i=1; i<=TARGETS.customers; i++) {
        let cId = `CUST-${String(i).padStart(6, '0')}`;
        customers.push({ id: cId, name: `Customer ${i}`, phone: `99999${String(i).padStart(5, '0')}`, outstanding: 0 });
        customerIds.push(cId);
      }
      localStorage.setItem('erp_customers', JSON.stringify(customers));
      
      // Dealers
      let dealers = [];
      for(let i=1; i<=TARGETS.dealers; i++) {
        let dId = `DLR-${String(i).padStart(6, '0')}`;
        dealers.push({ id: dId, companyName: `Dealer ${i}`, outstanding: 0 });
        dealerIds.push(dId);
      }
      localStorage.setItem('erp_dealers', JSON.stringify(dealers));
      
      // Projects
      let projects = [];
      for(let i=1; i<=TARGETS.projects; i++) {
        projects.push({ id: `PRJ-${String(i).padStart(6, '0')}`, name: `Project ${i}`, customerId: customerIds[i % customerIds.length], status: 'Active', budget: 100000, outstanding: 0, invoices: [] });
      }
      localStorage.setItem('erp_house_projects', JSON.stringify(projects));

      // Sales
      let sales = [];
      for(let i=1; i<=TARGETS.sales; i++) {
        let invId = `SAL-${d.split('T')[0].replace(/-/g, '')}-${String(i).padStart(6, '0')}`;
        sales.push({
          id: invId,
          date: d,
          customerId: customerIds[i % customerIds.length],
          items: [{ productId: productIds[i % productIds.length], qty: 1, price: 100, total: 100 }],
          subtotal: 100, taxTotal: 10, totalAmount: 110,
          paymentMethod: 'Cash', paymentStatus: 'Paid Full'
        });
      }
      localStorage.setItem('erp_sales_invoices', JSON.stringify(sales));

      // Purchases
      let purchases = [];
      for(let i=1; i<=TARGETS.purchases; i++) {
        let poId = `PUR-${d.split('T')[0].replace(/-/g, '')}-${String(i).padStart(6, '0')}`;
        purchases.push({
          id: poId,
          date: d,
          dealerId: dealerIds[i % dealerIds.length],
          items: [{ productId: productIds[i % productIds.length], qty: 10, price: 50, total: 500 }],
          subtotal: 500, totalAmount: 500, status: 'Received', paymentStatus: 'Paid Full'
        });
      }
      localStorage.setItem('erp_purchases', JSON.stringify(purchases));
      
      // Sales Returns
      let srt = [];
      for(let i=1; i<=TARGETS.returns/2; i++) {
        srt.push({
          id: `SRT-${d.split('T')[0].replace(/-/g, '')}-${String(i).padStart(6, '0')}`,
          date: d, invoiceId: sales[i % sales.length].id, customerId: customerIds[i % customerIds.length],
          items: [{ productId: productIds[i % productIds.length], qty: 1 }], amount: 110, restock: true
        });
      }
      localStorage.setItem('erp_sales_returns', JSON.stringify(srt));

      // Purchase Returns
      let prt = [];
      for(let i=1; i<=TARGETS.returns/2; i++) {
        prt.push({
          id: `PRT-${d.split('T')[0].replace(/-/g, '')}-${String(i).padStart(6, '0')}`,
          date: d, purchaseOrderId: purchases[i % purchases.length].id, dealerId: dealerIds[i % dealerIds.length],
          items: [{ productId: productIds[i % productIds.length], qty: 1 }], amount: 50, deductFromPayable: true
        });
      }
      localStorage.setItem('erp_purchase_returns', JSON.stringify(prt));

      // Compute total size of localStorage
      let _lsTotal = 0;
      for(let key in localStorage) {
        if(localStorage.hasOwnProperty(key)) {
          _lsTotal += ((localStorage[key].length + key.length) * 2); // 2 bytes per char
        }
      }

      return { success: true, sizeMB: (_lsTotal / (1024 * 1024)).toFixed(2) };
    } catch(err) {
      if(err.name === 'QuotaExceededError') {
         return { success: false, error: 'QuotaExceededError: LocalStorage capacity maxed out.' };
      }
      return { success: false, error: err.message };
    }
  });

  if (!results.success) {
    console.log('Dataset generation failed:', results.error);
    await browser.close();
    return;
  }
  
  console.log(`✅ Dataset generated in LocalStorage. Size: ~${results.sizeMB} MB`);

  // Measure Dashboard Load Time
  console.log('\nMeasuring Dashboard Load Time...');
  await page.evaluate(() => performance.mark('dashStart'));
  await page.evaluate(() => window.dispatchEvent(new HashChangeEvent('hashchange', { newURL: window.location.href + '#/', oldURL: '' })));
  await new Promise(r => setTimeout(r, 500)); // give it time to render DOM
  await page.evaluate(() => performance.mark('dashEnd'));
  const dashTime = await page.evaluate(() => performance.measure('dashLoad', 'dashStart', 'dashEnd').duration);
  console.log(`⏱️ Dashboard Load: ${dashTime.toFixed(2)} ms`);

  // Measure POS Search Time
  console.log('\nMeasuring POS Load Time...');
  await page.goto('http://localhost:5500/#/pos', { waitUntil: 'networkidle2' });
  await page.evaluate(() => performance.mark('posStart'));
  await page.evaluate(() => {
    // POS is already loaded, measure search filter latency
    const input = document.getElementById('search-product');
    if (input) {
      input.value = 'Product 4999';
      input.dispatchEvent(new Event('input'));
    }
  });
  await page.evaluate(() => performance.mark('posEnd'));
  const posSearchTime = await page.evaluate(() => performance.measure('posSearch', 'posStart', 'posEnd').duration);
  console.log(`⏱️ POS Search Latency: ${posSearchTime.toFixed(2)} ms`);

  await browser.close();
  console.log('\nPerformance testing completed.');
}

runStressTest().catch(console.error);
