const puppeteer = require('puppeteer');

async function runBusinessFlowTest() {
  console.log('Starting Business Flow Verification (Phase 3)...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Go to the app to initialize local storage and DataProvider
  await page.goto('http://localhost:5500/#/', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => typeof window.DataProvider !== 'undefined' || typeof window.app !== 'undefined', { timeout: 2000 }).catch(() => {});
  
  const results = await page.evaluate(async () => {
    const logs = [];
    const log = (msg) => logs.push(msg);
    let pass = true;

    function assertEq(name, actual, expected) {
      if (actual !== expected) {
        log(`❌ FAIL: ${name} (Expected: ${expected}, Got: ${actual})`);
        pass = false;
      } else {
        log(`✅ PASS: ${name} (${actual})`);
      }
    }
    
    // We need to access DataProvider
    // In modules, it's imported. Let's dynamically import it if not on window.
    let DP;
    if (window.DataProvider) {
      DP = window.DataProvider;
    } else {
      const module = await import('./services/dataProvider.js');
      DP = module.DataProvider;
    }
    
    // Clear everything for a clean test
    localStorage.clear();
    localStorage.setItem('erp_system_state', JSON.stringify({}));
    
    try {
      log('--- 1. INVENTORY & CUSTOMER CREDIT FLOW ---');
      // Setup Dummy Product
      let p = DP.saveProduct({ name: 'Test Product', stock: 10, minStock: 5, category: 'Test', price: 100, buyingPrice: 80 });
      let pId = p.id;
      assertEq('Initial stock', p.stock, 10);
      
      // Setup Dummy Customer
      let c = DP.saveCustomer({ name: 'Test Customer', phone: '1234567890', creditLimit: 5000, outstanding: 0 });
      let cId = c.id;
      assertEq('Initial outstanding', c.outstanding, 0);

      // Setup Dummy Dealer
      let d = DP.saveDealer({ companyName: 'Test Dealer', outstanding: 0 });
      let dId = d.id;
      assertEq('Initial dealer outstanding', d.outstanding, 0);

      log('Stock before purchase: ' + DP.getProductById(pId).stock);

      // 1. Purchase (Dealer Flow)
      let po = DP.savePurchaseInvoice({
        date: new Date().toISOString(), dealerId: dId, status: 'Received',
        items: [{ productId: pId, qty: 20, price: 80 }],
        subtotal: 1600, totalAmount: 1600, paymentStatus: 'Credit'
      });
      let poId = po.id;
      
      p = DP.getProductById(pId);
      log('Stock after purchase: ' + p.stock);
      assertEq('Stock after PO received (10 + 20)', p.stock, 30);
      
      d = DP.getDealerById(dId);
      assertEq('Dealer outstanding after credit purchase', d.outstanding, 1600);
      
      // Dealer Payment
      d.outstanding -= 600;
      DP.saveDealer(d); // Simulation of payment
      d = DP.getDealerById(dId);
      assertEq('Dealer outstanding after payment (1600 - 600)', d.outstanding, 1000);

      // 2. Sale (Customer Credit Flow)
      let inv = DP.saveSalesInvoice({
        date: new Date().toISOString(), customerId: cId,
        items: [{ productId: pId, qty: 5, price: 100, total: 500 }],
        subtotal: 500, taxTotal: 50, totalAmount: 550, paymentMethod: 'Credit', paymentStatus: 'Pending'
      });
      let invId = inv.id;
      
      p = DP.getProductById(pId);
      log('Stock after sale: ' + p.stock);
      assertEq('Stock after sale (30 - 5)', p.stock, 25);
      
      c = DP.getCustomerById(cId);
      assertEq('Customer outstanding after credit sale', c.outstanding, 550);
      
      // 3. Customer Payment (Credit Management)
      c.outstanding -= 250;
      DP.saveCustomer(c);
      c = DP.getCustomerById(cId);
      assertEq('Customer outstanding after payment (550 - 250)', c.outstanding, 300);

      // 4. Sales Return
      let sr = DP.saveSalesReturn({
        date: new Date().toISOString(), invoiceId: invId, customerId: cId,
        items: [{ productId: pId, qty: 2 }], amount: 220, restock: true
      });
      
      p = DP.getProductById(pId);
      log('Stock after sales return: ' + p.stock);
      assertEq('Stock after sales return (25 + 2)', p.stock, 27);
      
      // 5. Purchase Return
      let pr = DP.savePurchaseReturn({
        date: new Date().toISOString(), purchaseOrderId: poId, dealerId: dId,
        items: [{ productId: pId, qty: 4 }], amount: 320, deductFromPayable: true
      });
      
      p = DP.getProductById(pId);
      log('Stock after purchase return: ' + p.stock);
      assertEq('Stock after purchase return (27 - 4)', p.stock, 23);
      
      log('--- 2. REPORTS & GST FLOW ---');
      
      // Let's create a cash sale for today to check daily closing
      DP.saveSalesInvoice({
        date: new Date().toISOString(), customerId: cId,
        items: [{ productId: pId, qty: 3, price: 100, total: 300 }],
        subtotal: 300, taxTotal: 30, totalAmount: 330, paymentMethod: 'Cash', paymentStatus: 'Paid Full'
      });
      
      p = DP.getProductById(pId);
      log('Stock after cash sale: ' + p.stock);
      
      // Reports validation
      const sales = DP.getSalesInvoices();
      const totalSalesRev = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      assertEq('Total Sales Revenue (550 + 330)', totalSalesRev, 880);
    } catch (e) {
      log('ERROR THROWN: ' + e.message);
      pass = false;
    }
    
    return { pass, logs };
  });

  console.log(results.logs.join('\n'));
  
  if (results.pass) {
    console.log('\n✅ ALL BUSINESS FLOWS VERIFIED SUCCESSFULLY!');
  } else {
    console.log('\n❌ BUSINESS FLOW VERIFICATION FAILED. Review errors above.');
  }

  await browser.close();
}

runBusinessFlowTest().catch(console.error);
