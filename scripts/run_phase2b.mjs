import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  console.log('Starting Phase 2B Validation Harness...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Listen for console logs inside the page
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://127.0.0.1:5173/index.html#/login');
  
  const result = await page.evaluate(async () => {
    const TestRunner = {
      results: [],
      bugs: [],
      async runSuite(name, fn) {
        console.log(`Running suite: ${name}`);
        try {
          await fn();
          this.results.push({ suite: name, status: 'PASS' });
        } catch (e) {
          this.results.push({ suite: name, status: 'FAIL', error: e.message });
        }
      },
      assert(condition, message, bugDetails = null) {
        if (!condition) {
          if (bugDetails) this.bugs.push({ ...bugDetails, message });
          throw new Error(`Assertion Failed: ${message}`);
        }
      },
      assertEqual(actual, expected, message, bugDetails = null) {
        if (actual !== expected) {
          const fullMessage = `${message} | Expected: ${expected}, Actual: ${actual}`;
          if (bugDetails) this.bugs.push({ ...bugDetails, message: fullMessage });
          throw new Error(`Assertion Failed: ${fullMessage}`);
        }
      }
    };
    
    try {
      const module = await import('./services/offlineDataProvider.js');
      const OfflineDataProvider = module.OfflineDataProvider;
      
      const clearData = () => {
        localStorage.clear();
        OfflineDataProvider.init();
        localStorage.setItem('erp_auth_token', JSON.stringify({username:'admin', role:'admin'}));
      };
      
      await TestRunner.runSuite('Sales Workflow', async () => {
        clearData();
        OfflineDataProvider.saveProduct({ id: 'P-1', name: 'Cement', stock: 100, price: 400, avgCost: 350, isActive: true });
        OfflineDataProvider.saveCustomer({ id: 'C-1', name: 'John', outstanding: 0, isActive: true });
        
        const invoice = {
          id: 'INV-1', customerId: 'C-1', date: new Date().toISOString(),
          items: [{ productId: 'P-1', qty: 10, price: 400, total: 4000 }],
          totalAmount: 4000, amountPaid: 1000, paymentMethod: 'Cash'
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
        clearData();
        OfflineDataProvider.saveProduct({ id: 'P-1', name: 'Cement', stock: 10, price: 400, avgCost: 350, isActive: true });
        OfflineDataProvider.saveDealer({ id: 'D-1', name: 'Supplier', outstanding: 0, isActive: true });
        
        const purchase = {
          id: 'PUR-1', dealerId: 'D-1', date: new Date().toISOString(),
          items: [{ productId: 'P-1', qty: 20, costPrice: 380, total: 7600 }],
          totalAmount: 7600, amountPaid: 0
        };
        OfflineDataProvider.savePurchaseInvoice(purchase);
        
        const pAfter = OfflineDataProvider.getProductById('P-1');
        const dAfter = OfflineDataProvider.getDealerById('D-1');
        
        TestRunner.assertEqual(pAfter.stock, 30, 'Stock should increment on purchase', {
          id: 'P2B-03', severity: 'Critical', rootCause: 'savePurchaseInvoice stock logic', files: ['offlineDataProvider.js']
        });
        TestRunner.assertEqual(pAfter.avgCost, 370, 'Average cost should recalculate', {
          id: 'P2B-04', severity: 'High', rootCause: 'savePurchaseInvoice avgCost logic', files: ['offlineDataProvider.js']
        });
        TestRunner.assertEqual(dAfter.outstanding, 7600, 'Dealer outstanding should update', {
          id: 'P2B-05', severity: 'Critical', rootCause: 'savePurchaseInvoice outstanding logic', files: ['offlineDataProvider.js']
        });
      });
      
      await TestRunner.runSuite('Sales Return Workflow', async () => {
        clearData();
        OfflineDataProvider.saveProduct({ id: 'P-1', name: 'Cement', stock: 90, isActive: true });
        OfflineDataProvider.saveCustomer({ id: 'C-1', name: 'John', outstanding: 3000, isActive: true });
        
        const sReturn = {
          id: 'SR-1', customerId: 'C-1', date: new Date().toISOString(),
          items: [{ productId: 'P-1', qty: 5, price: 400, total: 2000 }],
          amount: 2000, refundAmount: 0, paymentMethod: 'Adjustment'
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
      
      await TestRunner.runSuite('Purchase Return Workflow', async () => {
        clearData();
        OfflineDataProvider.saveProduct({ id: 'P-1', name: 'Cement', stock: 100, avgCost: 350, isActive: true });
        OfflineDataProvider.saveDealer({ id: 'D-1', name: 'Supplier', outstanding: 5000, isActive: true });
        
        const pReturn = {
          id: 'PR-1', dealerId: 'D-1', date: new Date().toISOString(),
          items: [{ productId: 'P-1', qty: 10, costPrice: 350, total: 3500 }],
          amount: 3500, refundAmount: 0, paymentMethod: 'Adjustment'
        };
        OfflineDataProvider.savePurchaseReturn(pReturn);
        
        const pAfter = OfflineDataProvider.getProductById('P-1');
        const dAfter = OfflineDataProvider.getDealerById('D-1');
        
        TestRunner.assertEqual(pAfter.stock, 90, 'Stock should decrement on purchase return', {
          id: 'P2B-08', severity: 'Critical', rootCause: 'savePurchaseReturn stock logic', files: ['offlineDataProvider.js']
        });
        TestRunner.assertEqual(dAfter.outstanding, 1500, 'Dealer outstanding should decrease on purchase return', {
          id: 'P2B-09', severity: 'Critical', rootCause: 'savePurchaseReturn outstanding logic', files: ['offlineDataProvider.js']
        });
      });

      await TestRunner.runSuite('Real Shop Simulation (100 txns)', async () => {
        clearData();
        for (let i = 1; i <= 5; i++) {
          OfflineDataProvider.saveProduct({ id: `P-${i}`, name: `Prod ${i}`, stock: 1000, price: 1000, avgCost: 800, isActive: true });
          OfflineDataProvider.saveCustomer({ id: `C-${i}`, name: `Cust ${i}`, outstanding: 0, isActive: true });
          OfflineDataProvider.saveDealer({ id: `D-${i}`, name: `Dealer ${i}`, outstanding: 0, isActive: true });
        }
        
        let expectedCash = 5000;
        let expectedCustomerOutstanding = 0;
        let expectedDealerOutstanding = 0;
        let expectedStock = 5000;
        
        const today = new Date().toISOString();

        for(let i=0; i<100; i++) {
          const type = i % 5;
          if (type === 0 || type === 1) {
            OfflineDataProvider.saveSalesInvoice({
              id: `INV-1${i}`, customerId: 'C-1', date: today,
              items: [{ productId: 'P-1', qty: 10, price: 1000, total: 10000 }],
              totalAmount: 10000, amountPaid: (type === 0 ? 10000 : 2000), paymentMethod: 'Cash'
            });
            expectedCash += (type === 0 ? 10000 : 2000);
            expectedCustomerOutstanding += (type === 0 ? 0 : 8000);
            expectedStock -= 10;
          } else if (type === 2) {
            OfflineDataProvider.savePurchaseInvoice({
              id: `PUR-1${i}`, dealerId: 'D-1', date: today,
              items: [{ productId: 'P-1', qty: 20, costPrice: 850, total: 17000 }],
              totalAmount: 17000, amountPaid: 0
            });
            expectedDealerOutstanding += 17000;
            expectedStock += 20;
          } else if (type === 3) {
            OfflineDataProvider.saveSalesReturn({
              id: `SR-1${i}`, customerId: 'C-1', date: today,
              items: [{ productId: 'P-1', qty: 5, price: 1000, total: 5000 }],
              amount: 5000, refundAmount: 0, paymentMethod: 'Adjustment'
            });
            expectedCustomerOutstanding -= 5000;
            expectedStock += 5;
          } else if (type === 4) {
            const expenses = JSON.parse(localStorage.getItem('erp_expenses') || '[]');
            expenses.push({ id: `EXP-${i}`, amount: 1000, paymentMethod: 'Cash', date: today });
            localStorage.setItem('erp_expenses', JSON.stringify(expenses));
            expectedCash -= 1000;
          }
        }
        
        const c1 = OfflineDataProvider.getCustomerById('C-1');
        const d1 = OfflineDataProvider.getDealerById('D-1');
        const allStock = OfflineDataProvider.getProducts().reduce((acc, p) => acc + p.stock, 0);
        
        TestRunner.assertEqual(allStock, expectedStock, 'Overall stock mismatch', {
          id: 'P2B-10', severity: 'Critical', rootCause: 'Stock integrity after 100 txns', files: ['offlineDataProvider.js']
        });
        
        TestRunner.assertEqual(c1.outstanding, expectedCustomerOutstanding, 'Customer outstanding mismatch', {
          id: 'P2B-11', severity: 'Critical', rootCause: 'Customer outstanding integrity', files: ['offlineDataProvider.js']
        });
        
        TestRunner.assertEqual(d1.outstanding, expectedDealerOutstanding, 'Dealer outstanding mismatch', {
          id: 'P2B-12', severity: 'Critical', rootCause: 'Dealer outstanding integrity', files: ['offlineDataProvider.js']
        });
      });
      
    } catch (e) {
      return { error: e.message, bugs: TestRunner.bugs, results: TestRunner.results };
    }
    
    return { results: TestRunner.results, bugs: TestRunner.bugs };
  });
  
  await browser.close();
  
  if (result.error) {
    console.error('Test execution failed:', result.error);
  }
  
  console.log('--- TEST RESULTS ---');
  result.results.forEach(r => console.log(`[${r.status}] ${r.suite}: ${r.error || 'OK'}`));
  console.log(`Found ${result.bugs.length} potential bugs.`);
  
  fs.writeFileSync('PHASE2B_RESULTS.json', JSON.stringify(result, null, 2));
  console.log('Results saved to PHASE2B_RESULTS.json');
})();
