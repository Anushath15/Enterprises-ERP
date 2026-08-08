const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--unlimited-storage']
  });
  const page = await browser.newPage();

  console.log("Navigating to ERP...");
  await page.goto('file:///' + process.cwd().replace(/\\/g, '/') + '/index.html');

  // Wait for the app to initialize
  await new Promise(r => setTimeout(r, 1000));

  console.log("Injecting massive dataset...");
  await page.evaluate(() => {
    console.log("Generating 20,000 Products...");
    const products = [];
    for (let i = 1; i <= 20000; i++) {
      products.push({
        id: "PROD-" + String(i).padStart(6, '0'),
        name: "Hardware Item " + i,
        barcode: "890" + String(i).padStart(9, '0'),
        sku: "SKU" + i,
        category: i % 2 === 0 ? "Tools" : "Plumbing",
        brand: i % 3 === 0 ? "Stanley" : "Bosch",
        dealer: "DLR-0001",
        mrp: 1500 + (i % 100),
        price: 1200 + (i % 100),
        stock: 50,
        unit: "Nos",
        gst: 18,
        hsn: "8471"
      });
    }
    localStorage.setItem('erp_products', JSON.stringify(products));

    console.log("Generating 10,000 Customers...");
    const customers = [];
    for (let i = 1; i <= 10000; i++) {
      customers.push({
        id: "CUST-" + String(i).padStart(6, '0'),
        name: "Customer " + i,
        phone: "98" + String(i).padStart(8, '0'),
        address: "Address " + i,
        type: i % 5 === 0 ? "Wholesale" : "Retail",
        balance: 0,
        loyaltyPoints: 0
      });
    }
    localStorage.setItem('erp_customers', JSON.stringify(customers));

    console.log("Generating 5,000 Dealers...");
    const dealers = [];
    for (let i = 1; i <= 5000; i++) {
      dealers.push({
        id: "DLR-" + String(i).padStart(6, '0'),
        name: "Dealer " + i,
        phone: "99" + String(i).padStart(8, '0'),
        gstin: "33AABCU" + String(i).padStart(4, '0') + "A1Z" + (i % 9),
        address: "Dealer Address " + i,
        balance: 0
      });
    }
    localStorage.setItem('erp_dealers', JSON.stringify(dealers));

    console.log("Generating 10,000 Sales Invoices...");
    const invoices = [];
    const baseDate = new Date();
    for (let i = 1; i <= 10000; i++) {
      baseDate.setMinutes(baseDate.getMinutes() - 15);
      invoices.push({
        id: "INV-" + String(i).padStart(6, '0'),
        date: baseDate.toISOString(),
        customerId: "CUST-" + String((i % 10000) + 1).padStart(6, '0'),
        items: [
          { id: "PROD-000001", name: "Hardware Item 1", qty: 2, price: 1200, discountPercent: 5, taxRate: 18 },
          { id: "PROD-000002", name: "Hardware Item 2", qty: 1, price: 1201, discountPercent: 0, taxRate: 18 }
        ],
        subTotal: 3601,
        taxTotal: 648.18,
        discountTotal: 120,
        totalAmount: 4129.18,
        paymentMethod: i % 3 === 0 ? "UPI" : "Cash"
      });
    }
    localStorage.setItem('erp_sales_invoices', JSON.stringify(invoices));
  });

  console.log("Reloading with massive dataset...");
  await page.reload({ waitUntil: 'networkidle0' });

  // Measure load time
  const metrics = await page.evaluate(() => {
    const t = performance.timing;
    return t.loadEventEnd - t.navigationStart;
  });
  console.log(`Page Load Time (Network Idle): ${metrics}ms`);

  console.log("Testing POS search performance...");
  await page.goto('file:///' + process.cwd().replace(/\\/g, '/') + '/index.html#/pos', { waitUntil: 'networkidle0' });
  
  await page.waitForSelector('#product-search');
  
  const startTime = Date.now();
  await page.type('#product-search', 'Hardware');
  await new Promise(r => setTimeout(r, 500)); // Wait for debounce and search to complete
  
  const searchResultsCount = await page.evaluate(() => {
    return document.querySelectorAll('#product-suggestions li').length;
  });
  const endTime = Date.now();
  
  console.log(`Search for "Hardware" completed in ${endTime - startTime - 500}ms, returned ${searchResultsCount} suggestions.`);

  if (searchResultsCount === 0) {
    console.error("Search failed or no results shown.");
  } else {
    console.log("Search is functional and fast!");
  }

  await browser.close();
})();
