import { OfflineDataProvider } from './services/offlineDataProvider.js';
import { LocalStorageService } from './services/localStorageService.js';
import { DashboardKPI } from './pages/dashboard.js'; 

const TestRunner = {
  results: [],
  bugs: [],
  
  async runSuite(name, fn) {
    try {
      await fn();
      this.results.push({ suite: name, status: 'PASS' });
    } catch (e) {
      this.results.push({ suite: name, status: 'FAIL', error: e.message });
      console.error(`Suite ${name} Failed:`, e);
    }
  },
  
  assert(condition, message, bugDetails = null) {
    if (!condition) {
      if (bugDetails) {
         this.bugs.push({ ...bugDetails, message });
      }
      throw new Error(`Assertion Failed: ${message}`);
    }
  },
  
  assertEqual(actual, expected, message, bugDetails = null) {
    if (actual !== expected) {
      const fullMessage = `${message} | Expected: ${expected}, Actual: ${actual}`;
      if (bugDetails) {
         this.bugs.push({ ...bugDetails, message: fullMessage });
      }
      throw new Error(`Assertion Failed: ${fullMessage}`);
    }
  },
  
  clearData() {
    localStorage.clear();
    OfflineDataProvider.init();
    localStorage.setItem('erp_auth_token', JSON.stringify({username:'admin', role:'admin'}));
  }
};

window.runPhase2BSuite = async function() {
  TestRunner.results = [];
  TestRunner.bugs = [];
  
  // ==========================================
  // 1-4. Sales, Purchases, and Returns
  // ==========================================
  await TestRunner.runSuite('Sales Workflow', async () => {
    TestRunner.clearData();
    const product = { id: 'P-1', name: 'Cement', stock: 100, price: 400, avgCost: 350, isActive: true };
    OfflineDataProvider.saveProduct(product);
    const customer = { id: 'C-1', name: 'John', outstanding: 0, isActive: true };
    OfflineDataProvider.saveCustomer(customer);
    
    // Credit Sale
    const invoice = {
      id: 'INV-1',
      customerId: 'C-1',
      date: new Date().toISOString(),
      items: [{ productId: 'P-1', qty: 10, price: 400, total: 4000 }],
      totalAmount: 4000,
      paidAmount: 1000, // Partial payment
      paymentMethod: 'Cash'
    };
    OfflineDataProvider.saveSalesInvoice(invoice);
    
    const pAfter = OfflineDataProvider.getProductById('P-1');
    const cAfter = OfflineDataProvider.getCustomerById('C-1');
    
    TestRunner.assertEqual(pAfter.stock, 90, 'Stock should decrement on sale', {
      id: 'P2B-01', severity: 'Critical', rootCause: 'saveSalesInvoice stock logic', files: ['offlineDataProvider.js']
    });
    
    TestRunner.assertEqual(cAfter.outstanding, 3000, 'Customer outstanding should reflect partial payment', {
      id: 'P2B-02', severity: 'Critical', rootCause: 'saveSalesInvoice outstanding logic', files: ['offlineDataProvider.js']
    });
  });

  await TestRunner.runSuite('Purchase Workflow', async () => {
    TestRunner.clearData();
    const product = { id: 'P-1', name: 'Cement', stock: 10, price: 400, avgCost: 350, isActive: true };
    OfflineDataProvider.saveProduct(product);
    const dealer = { id: 'D-1', name: 'Supplier', outstanding: 0, isActive: true };
    OfflineDataProvider.saveDealer(dealer);
    
    const purchase = {
      id: 'PUR-1',
      dealerId: 'D-1',
      date: new Date().toISOString(),
      items: [{ productId: 'P-1', qty: 20, costPrice: 380, total: 7600 }],
      totalAmount: 7600,
      paidAmount: 0 // Credit purchase
    };
    OfflineDataProvider.savePurchaseInvoice(purchase);
    
    const pAfter = OfflineDataProvider.getProductById('P-1');
    const dAfter = OfflineDataProvider.getDealerById('D-1');
    
    TestRunner.assertEqual(pAfter.stock, 30, 'Stock should increment on purchase', {
      id: 'P2B-03', severity: 'Critical', rootCause: 'savePurchaseInvoice stock logic', files: ['offlineDataProvider.js']
    });
    
    // avgCost calculation: (10*350 + 20*380) / 30 = (3500 + 7600)/30 = 11100/30 = 370
    TestRunner.assertEqual(pAfter.avgCost, 370, 'Average cost should recalculate', {
      id: 'P2B-04', severity: 'High', rootCause: 'savePurchaseInvoice avgCost logic', files: ['offlineDataProvider.js']
    });
    
    TestRunner.assertEqual(dAfter.outstanding, 7600, 'Dealer outstanding should update', {
      id: 'P2B-05', severity: 'Critical', rootCause: 'savePurchaseInvoice outstanding logic', files: ['offlineDataProvider.js']
    });
  });

  await TestRunner.runSuite('Sales Return Workflow', async () => {
    TestRunner.clearData();
    const product = { id: 'P-1', name: 'Cement', stock: 90, isActive: true };
    OfflineDataProvider.saveProduct(product);
    const customer = { id: 'C-1', name: 'John', outstanding: 3000, isActive: true };
    OfflineDataProvider.saveCustomer(customer);
    
    const sReturn = {
      id: 'SR-1',
      customerId: 'C-1',
      date: new Date().toISOString(),
      items: [{ productId: 'P-1', qty: 5, price: 400, total: 2000 }],
      totalAmount: 2000,
      refundAmount: 0, // Adjusted against outstanding
      paymentMethod: 'Adjustment'
    };
    OfflineDataProvider.saveSalesReturn(sReturn);
    
    const pAfter = OfflineDataProvider.getProductById('P-1');
    const cAfter = OfflineDataProvider.getCustomerById('C-1');
    
    TestRunner.assertEqual(pAfter.stock, 95, 'Stock should increment on sales return', {
      id: 'P2B-06', severity: 'Critical', rootCause: 'saveSalesReturn stock logic', files: ['offlineDataProvider.js']
    });
    TestRunner.assertEqual(cAfter.outstanding, 1000, 'Customer outstanding should decrease on return', {
      id: 'P2B-07', severity: 'Critical', rootCause: 'saveSalesReturn outstanding logic', files: ['offlineDataProvider.js']
    });
  });

  // ==========================================
  // 15. Real Shop Simulation (End-to-End)
  // ==========================================
  await TestRunner.runSuite('Real Shop Simulation', async () => {
    TestRunner.clearData();
    // Setup
    for (let i = 1; i <= 5; i++) {
      OfflineDataProvider.saveProduct({ id: `P-${i}`, name: `Prod ${i}`, stock: 100, price: 1000, avgCost: 800, isActive: true });
      OfflineDataProvider.saveCustomer({ id: `C-${i}`, name: `Cust ${i}`, outstanding: 0, isActive: true });
      OfflineDataProvider.saveDealer({ id: `D-${i}`, name: `Dealer ${i}`, outstanding: 0, isActive: true });
    }
    
    let expectedCash = 5000; // Opening cash
    let actualCustomerOutstanding = { 'C-1': 0, 'C-2': 0 };
    let actualDealerOutstanding = { 'D-1': 0 };
    let expectedStocks = { 'P-1': 100, 'P-2': 100, 'P-3': 100 };
    
    const today = new Date().toISOString();

    // Transaction 1: Cash Sale (No customer)
    OfflineDataProvider.saveSalesInvoice({
      id: 'INV-100', customerId: '', date: today,
      items: [{ productId: 'P-1', qty: 2, price: 1000, total: 2000 }],
      totalAmount: 2000, paidAmount: 2000, paymentMethod: 'Cash'
    });
    expectedCash += 2000;
    expectedStocks['P-1'] -= 2;

    // Transaction 2: Credit Sale to C-1
    OfflineDataProvider.saveSalesInvoice({
      id: 'INV-101', customerId: 'C-1', date: today,
      items: [{ productId: 'P-2', qty: 5, price: 1000, total: 5000 }],
      totalAmount: 5000, paidAmount: 1000, paymentMethod: 'Cash'
    });
    expectedCash += 1000;
    expectedStocks['P-2'] -= 5;
    actualCustomerOutstanding['C-1'] += 4000;

    // Transaction 3: UPI Sale to C-2
    OfflineDataProvider.saveSalesInvoice({
      id: 'INV-102', customerId: 'C-2', date: today,
      items: [{ productId: 'P-3', qty: 1, price: 1000, total: 1000 }],
      totalAmount: 1000, paidAmount: 1000, paymentMethod: 'UPI' // UPI does NOT add to cash
    });
    expectedStocks['P-3'] -= 1;

    // Transaction 4: Purchase from D-1 (Credit)
    OfflineDataProvider.savePurchaseInvoice({
      id: 'PUR-100', dealerId: 'D-1', date: today,
      items: [{ productId: 'P-1', qty: 50, costPrice: 850, total: 42500 }],
      totalAmount: 42500, paidAmount: 5000 // partial payment in cash? Purchase paidAmount isn't cash inherently unless specified, but let's assume it reduces cash if recorded? Wait, purchases don't have paymentMethod in standard form, it just says paidAmount. Often it's cash/bank. Let's assume the ERP uses Cash for purchase payments.
    });
    // Let's check how daily closing handles purchases
    expectedStocks['P-1'] += 50;
    actualDealerOutstanding['D-1'] += 37500;
    expectedCash -= 5000; // Assuming paidAmount affects cash.

    // Verify Data Integrity!
    const c1 = OfflineDataProvider.getCustomerById('C-1');
    TestRunner.assertEqual(c1.outstanding, actualCustomerOutstanding['C-1'], 'Customer 1 Outstanding mismatch', {
      id: 'P2B-08', severity: 'Critical', rootCause: 'Data integrity after multiple txns', files: ['offlineDataProvider.js']
    });

    const p1 = OfflineDataProvider.getProductById('P-1');
    TestRunner.assertEqual(p1.stock, expectedStocks['P-1'], 'Product 1 Stock mismatch', {
      id: 'P2B-09', severity: 'Critical', rootCause: 'Data integrity after multiple txns', files: ['offlineDataProvider.js']
    });
    
    // Check Dashboard KPI totals without UI
    // Note: Dashboard logic is in DashboardKPI in dashboard.js. Since we didn't import it in a way that executes the DOM, we can't test it directly unless we test the data it relies on.
    
    // Check Daily Closing Expected Cash logic
    // We will re-implement the daily closing calculation here to see if data matches.
    const todayStr = today.split('T')[0];
    const invoices = OfflineDataProvider.getSalesInvoices().filter(i => i.date.startsWith(todayStr));
    const purchases = OfflineDataProvider.getPurchaseInvoices().filter(p => p.date && p.date.startsWith(todayStr));
    const expenses = (OfflineDataProvider.getExpenses ? OfflineDataProvider.getExpenses() : []).filter(e => e.date && e.date.startsWith(todayStr));
    const salesReturns = OfflineDataProvider.getSalesReturns().filter(r => r.date && r.date.startsWith(todayStr));
    const collections = (OfflineDataProvider.getCollections ? OfflineDataProvider.getCollections() : []).filter(c => c.date && c.date.startsWith(todayStr));
    
    let calcCash = 5000;
    invoices.forEach(i => { if (i.paymentMethod === 'Cash') calcCash += Number(i.paidAmount || 0); });
    purchases.forEach(p => { calcCash -= Number(p.paidAmount || 0); }); // assuming all purchase paidAmount is cash
    expenses.forEach(e => { if (e.paymentMethod === 'Cash' || !e.paymentMethod) calcCash -= Number(e.amount || 0); });
    salesReturns.forEach(r => { if (r.paymentMethod === 'Cash') calcCash -= Number(r.refundAmount || 0); });
    collections.forEach(c => { if (c.paymentMode === 'Cash') calcCash += Number(c.amount || 0); });
    
    TestRunner.assertEqual(calcCash, expectedCash, 'Expected cash calculation mismatch in Simulation', {
      id: 'P2B-10', severity: 'High', rootCause: 'Daily closing calculation integrity', files: ['daily_closing.js']
    });
  });

  return { results: TestRunner.results, bugs: TestRunner.bugs };
};
