import puppeteer from 'puppeteer';

(async () => {
  console.log('Starting RC3.5 Acceptance Test...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/#/pos', { waitUntil: 'networkidle0' });
  console.log('Navigated to POS');

  // We can evaluate scripts in the context of the page to check localStorage and state
  const testResults = await page.evaluate(async () => {
    const results = [];
    
    // 1. Transaction Schema Test
    const invoices = JSON.parse(localStorage.getItem('erp_sales_invoices') || '[]');
    const purchases = JSON.parse(localStorage.getItem('erp_purchase_invoices') || '[]');
    
    let engineSalesPass = true;
    for (const inv of invoices) {
      if (inv.id && inv.id.startsWith('SAL-')) {
        if (inv.totalAmount === undefined || inv.paymentStatus === undefined || inv.taxTotal === undefined) {
           engineSalesPass = false;
        }
      }
    }
    results.push({ test: 'Engine Sales Schema Normalized', pass: engineSalesPass });

    let enginePurchasesPass = true;
    for (const inv of purchases) {
      if (inv.id && inv.id.startsWith('PUR-')) {
        if (inv.totalAmount === undefined || inv.dealerId === undefined || inv.dealerName === undefined) {
           enginePurchasesPass = false;
        }
      }
    }
    results.push({ test: 'Engine Purchase Schema Normalized', pass: enginePurchasesPass });

    // Verify DraftManager Debounce
    const draftBefore = localStorage.getItem('erp_drafts');
    window.DraftManager.saveDraft('test', { foo: 'bar' });
    const draftImmediate = localStorage.getItem('erp_drafts');
    
    await new Promise(r => setTimeout(r, 600));
    const draftAfter = localStorage.getItem('erp_drafts');
    
    results.push({ 
      test: 'DraftManager Debounce', 
      pass: draftBefore === draftImmediate && draftAfter !== draftImmediate
    });
    
    return results;
  });

  console.log('Test Results:');
  console.dir(testResults, { depth: null });
  await browser.close();
  
  console.log('Done.');
})();
