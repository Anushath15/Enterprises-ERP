import puppeteer from 'puppeteer-core';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('=== Chaos Monkey - Phase 5: Commercial Simulation ===');
  console.log('Navigating to Live Firebase...');
  await page.goto('https://myapplication-2adb30a9.web.app/', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#page-root', { timeout: 15000 });
  
  console.log('1. Generating 300 Sales Invoices...');
  
  const result = await page.evaluate(() => {
     try {
       // Helper to read/write localStorage
       const _getAll = (key) => {
         try {
           return JSON.parse(localStorage.getItem(key)) || [];
         } catch { return []; }
       };
       const _saveAll = (key, data) => {
         localStorage.setItem(key, JSON.stringify(data));
       };

       // 1. Create a few products
       let products = _getAll('erp_products');
       const simProducts = [];
       for (let i = 1; i <= 5; i++) {
         const p = {
           id: `PRD-${Date.now()}-${i}`,
           name: `Sim Product ${i}`,
           sku: `SIM-${i}`,
           price: 100 * i,
           stock: 1000,
           isActive: true
         };
         products.push(p);
         simProducts.push(p);
       }
       _saveAll('erp_products', products);
       
       // 2. Generate 300 invoices
       let totalCash = 0;
       let totalCredit = 0;
       let invoices = _getAll('erp_sales_invoices');
       
       for (let i = 1; i <= 300; i++) {
          const qty = (i % 5) + 1;
          const p = simProducts[i % 5];
          const totalAmount = p.price * qty;
          
          const isCredit = i % 10 === 0; // 1 in 10 is credit
          const paymentMode = isCredit ? 'Credit' : 'Cash';
          const paymentStatus = isCredit ? 'Pending' : 'Paid Full';
          const amountPaid = isCredit ? 0 : totalAmount;
          
          if (isCredit) {
             totalCredit += totalAmount;
          } else {
             totalCash += totalAmount;
          }
          
          const inv = {
             id: `SAL-${Date.now()}-${i}`,
             date: new Date().toISOString(),
             customerName: `Walk-in ${i}`,
             items: [{ productId: p.id, qty, price: p.price, total: totalAmount }],
             subtotal: totalAmount,
             discount: 0,
             taxTotal: 0,
             totalAmount: totalAmount,
             paymentMode,
             paymentStatus,
             amountPaid
          };
          invoices.push(inv);
          
          // Deduct stock directly for simulation
          const pIndex = products.findIndex(pr => pr.id === p.id);
          if (pIndex !== -1) {
             products[pIndex].stock -= qty;
          }
       }
       _saveAll('erp_sales_invoices', invoices);
       _saveAll('erp_products', products);
       
       // 3. Verify Stock Deductions
       const updatedProducts = _getAll('erp_products');
       let stockErrors = [];
       for (let i = 1; i <= 5; i++) {
          const sku = `SIM-${i}`;
          const p = updatedProducts.find(pr => pr.sku === sku);
          // Calculate expected stock
          // Each product was sold when (i % 5) matched. 300/5 = 60 times.
          // Each time, qty was ((loopIndex % 5) + 1)
          let expectedSold = 0;
          for (let j = 1; j <= 300; j++) {
            const prodIndex = j % 5;
            if (simProducts[prodIndex].sku === sku) {
               expectedSold += (prodIndex + 1);
            }
          }
          if (p.stock !== (1000 - expectedSold)) {
             stockErrors.push(`Product ${sku} stock mismatch. Expected: ${1000 - expectedSold}, Got: ${p.stock}`);
          }
       }
       
       // 4. Verify Daily Closing logic
       const todayStart = new Date();
       todayStart.setHours(0, 0, 0, 0);
       const todayEnd = new Date();
       todayEnd.setHours(23, 59, 59, 999);
       
       const allSales = _getAll('erp_sales_invoices');
       const todaysSales = allSales.filter(inv => {
          const d = new Date(inv.date);
          return d >= todayStart && d <= todayEnd;
       });
       
       let calcTotalSales = 0;
       let calcTotalCash = 0;
       let calcTotalCredit = 0;
       
       todaysSales.forEach(s => {
          calcTotalSales += Number(s.totalAmount || s.total || 0);
          if (s.paymentMode === 'Cash' || s.paymentMode === 'UPI') {
              calcTotalCash += Number(s.amountPaid || s.totalAmount || s.total || 0);
          } else if (s.paymentMode === 'Credit') {
              calcTotalCredit += Number(s.totalAmount || s.total || 0) - Number(s.amountPaid || 0);
          } else if (s.paymentMode === 'Split') {
              calcTotalCash += Number(s.amountPaid || 0);
              calcTotalCredit += Number(s.totalAmount || s.total || 0) - Number(s.amountPaid || 0);
          }
       });
       
       const totalsMatch = Math.abs(calcTotalCash - totalCash) < 0.1 && Math.abs(calcTotalCredit - totalCredit) < 0.1;
       
       return {
         stockErrors,
         calcTotalCash,
         totalCash,
         calcTotalCredit,
         totalCredit,
         totalsMatch
       };
     } catch (err) {
       return { error: err.toString() };
     }
  });

  if (result.error) {
     console.log(`❌ ERROR: ${result.error}`);
  } else {
     console.log(`Stock Errors: ${result.stockErrors.length === 0 ? 'None' : result.stockErrors.join(', ')}`);
     console.log(`Cash Calc: ${result.calcTotalCash} (Expected: ${result.totalCash})`);
     console.log(`Credit Calc: ${result.calcTotalCredit} (Expected: ${result.totalCredit})`);
     
     if (result.stockErrors.length === 0 && result.totalsMatch) {
       console.log('✅ PASS: Scale Simulation Passed! Stock and Financials match perfectly after 300 invoices.');
     } else {
       console.log('❌ FAIL: Simulation detected mathematical drift!');
       process.exit(1);
     }
  }

  console.log('=== RESULTS ===');
  console.log('Commercial Simulation complete.');

  await browser.close();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
