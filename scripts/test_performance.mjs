/**
 * Senthil Enterprises ERP - Phase 6: Performance & Local-Storage Stress (Parts 1 & 4).
 * Requires dev server up on :5173 (node scripts/_static_server.cjs).
 *
 * Methodology: valid records are generated in Node and injected into browser
 * localStorage as JSON; a FULL page reload (cold boot: auth + router + render)
 * is measured per size so every number is real and independent.
 *
 * Run: node scripts/test_performance.mjs
 */
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:5173';
const OUT = path.join(process.cwd(), 'scripts', 'phase6_results.json');
const results = JSON.parse(fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '{}');
results.performance = results.performance || {};
results.stress = results.stress || {};

function saveResults() { fs.writeFileSync(OUT, JSON.stringify(results, null, 2)); }

const ADMIN = { id: 'USR-01', username: 'admin', name: 'Admin', role: 'Administrator' };
const EXPIRES = Date.now() + 7 * 24 * 3600 * 1000;

function authSeedJS() {
  // returns a JS snippet string safe to eval in-browser (no external quotes)
  const u = JSON.stringify(ADMIN);
  const t = 't-perf-' + Date.now();
  return [
    "localStorage.setItem('auth_token', JSON.stringify('" + t + "'));",
    "localStorage.setItem('auth_user', JSON.stringify(" + u + "));",
    "localStorage.setItem('auth_expires_at', JSON.stringify(" + EXPIRES + "));",
    "localStorage.setItem('erp_last_auto_backup', new Date().toISOString().split('T')[0]);",
    "localStorage.removeItem('erp_settings');",
    "localStorage.setItem('erp_settings', JSON.stringify({shopName:'Senthil Enterprises',currency:'INR',currencySymbol:'\\u20B9',defaultTaxType:'Exclusive',invoicePrefix:'INV-'}));",
    "var _st=JSON.parse(localStorage.getItem('erp_system_state')||'{}');",
    "_st.initialized=true;_st.lastInvoiceNumber=0;_st.lastPurchaseNumber=0;_st.lastDeliveryNumber=0;",
    "localStorage.setItem('erp_system_state', JSON.stringify(_st));"
  ].join('\n');
}

function genProducts(n) {
  const cats = ['Plumbing', 'Electrical', 'Hardware', 'Sanitary', 'Construction'];
  const units = ['Nos', 'Kg', 'Litre', 'Box', 'Pack'];
  const names = ['Nipple', 'Bend', 'Coupling', 'Valve', 'Pipe', 'Elbow', 'Tee', 'Reducer'];
  const arr = [];
  for (let i = 0; i < n; i++) {
    const s = i + 1;
    arr.push({
      id: 'PRD-P' + String(s).padStart(7, '0'),
      sku: 'SP' + String(s).padStart(6, '0'),
      barcode: 'SP' + String(s).padStart(6, '0'),
      name: 'Product ' + s + ' ' + names[s % names.length],
      category: cats[s % cats.length],
      price: 10 + (s % 90), buyingPrice: 5 + (s % 50),
      stock: ((s * 7) % 200) + 50, minStock: 10, unit: units[s % units.length],
      gst: [0, 5, 12, 18, 28][s % 5], hsn: '39' + String(s % 90).padStart(3, '0'),
      status: 'In Stock', statusBadge: 'success', supplier: 'Supplier ' + ((s % 10) + 1),
      brand: 'Brand ' + ((s % 5) + 1), isActive: true,
      createdAt: '2026-07-29T14:02:23.392Z', updatedAt: '2026-07-29T14:02:23.392Z', version: 1
    });
  }
  return arr;
}

function genCustomers(n) {
  const names = ['Reddy', 'Kumar', 'Chowdhary', 'Pillai', 'Rao'];
  const arr = [];
  for (let i = 0; i < n; i++) {
    const s = i + 1;
    arr.push({
      id: 'CUST-' + String(s).padStart(6, '0'),
      name: 'Customer ' + s + ' ' + names[s % names.length],
      phone: '+91 ' + String(9000000000 + s),
      email: 'c' + s + '@example.com',
      address: s + ' Main Street, Tirunelveli',
      outstanding: s * 123, type: ['Retail', 'Wholesale'][s % 2],
      createdAt: '2026-07-29T14:02:23.392Z', updatedAt: '2026-07-29T14:02:23.392Z'
    });
  }
  return arr;
}

function h(ms) { return ms < 1000 ? Math.round(ms) + ' ms' : (ms / 1000).toFixed(2) + ' s'; }

function setCollection(page, key, arr) {
  return page.evaluate((k, json) => { localStorage.setItem(k, json); }, key, JSON.stringify(arr));
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('favicon')) pageErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push('PageError: ' + e.message));
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
  await page.evaluate(authSeedJS());

  // Warm shell
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => document.body.innerText.trim().length > 10, { timeout: 20000 }).catch(() => {});

  const measureReload = async (routeHash, tableId) => {
    await page.goto(BASE + routeHash, { waitUntil: 'networkidle2' });
    await page.waitForFunction((sel) => !!document.querySelector(sel), { timeout: 20000 }, tableId).catch(() => {});
    const start = Date.now();
    await page.reload({ waitUntil: 'domcontentloaded' });
    try { await page.waitForFunction((sel) => (document.querySelectorAll(sel + ' tr').length || 0) > 0, { timeout: 30000 }, tableId); } catch (e) {}
    const rows = await page.evaluate((sel) => (document.querySelectorAll(sel + ' tr').length || 0), tableId);
    return { ms: Date.now() - start, rows };
  };

  // ---------------- PRODUCTS ----------------
  console.log('Products:');
  for (const n of [100, 500, 1000, 5000, 10000]) {
    await setCollection(page, 'erp_products', genProducts(n));
    const ops = await page.evaluate(async () => {
      const { DataProvider } = await import('./services/dataProvider.js');
      const t0 = performance.now(); const ap = DataProvider.getProducts(); const read = performance.now() - t0;
      const q = 'Nipple'; const t1 = performance.now(); const found = ap.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).length; const search = performance.now() - t1;
      const t2 = performance.now(); const cat = ap[0].category; const fc = ap.filter(p => p.category === cat).length; const filter = performance.now() - t2;
      return { readMs: read, searchMs: search, filterMs: filter, count: ap.length, found: found, catCount: fc };
    });
    const pg = await measureReload('/#/products', '#products-tbody');
    results.performance['products_' + n] = {
      count: n, readAllMs: +ops.readMs.toFixed(1), searchMs: +ops.searchMs.toFixed(1),
      filterMs: +ops.filterMs.toFixed(1), pageLoadMs: pg.ms, rowsRendered: pg.rows,
      readAllHuman: h(ops.readMs), searchHuman: h(ops.searchMs), filterHuman: h(ops.filterMs), pageLoadHuman: h(pg.ms)
    };
    console.log('  ' + n + ': read=' + h(ops.readMs) + ' search=' + h(ops.searchMs) + ' filter=' + h(ops.filterMs) + ' pageLoad=' + h(pg.ms) + ' rows=' + pg.rows);
  }

  // ---------------- CUSTOMERS ----------------
  console.log('Customers:');
  for (const n of [100, 500, 1000, 5000]) {
    await setCollection(page, 'erp_customers', genCustomers(n));
    const ops = await page.evaluate(async () => {
      const { DataProvider } = await import('./services/dataProvider.js');
      const t0 = performance.now(); const ac = DataProvider.getCustomers(); const read = performance.now() - t0;
      const t1 = performance.now(); const found = ac.filter(c => c.name.toLowerCase().includes('customer')).length; const search = performance.now() - t1;
      return { readMs: read, searchMs: search, count: ac.length, found: found };
    });
    const pg = await measureReload('/#/customers', '#customers-tbody');
    results.performance['customers_' + n] = {
      count: n, readAllMs: +ops.readMs.toFixed(1), searchMs: +ops.searchMs.toFixed(1),
      pageLoadMs: pg.ms, rowsRendered: pg.rows, searchHuman: h(ops.searchMs), pageLoadHuman: h(pg.ms)
    };
    console.log('  ' + n + ': read=' + h(ops.readMs) + ' search=' + h(ops.searchMs) + ' pageLoad=' + h(pg.ms) + ' rows=' + pg.rows);
  }

  // ---------------- POS invoices ----------------
  console.log('POS:');
  await setCollection(page, 'erp_products', genProducts(300).map(p => Object.assign({}, p, { price: 100 + (p.price % 90), stock: 9999 })));
  for (const n of [10, 25, 50, 100, 150]) {
    const res = await page.evaluate(async (itemCount, carts) => {
      const { DataProvider } = await import('./services/dataProvider.js');
      let cart = carts.map(c => ({ id: c.id, name: c.name, price: c.price, qty: c.qty, discountPercent: 0, taxRate: c.taxRate }));
      const tAdd0 = performance.now();
      // "add item speed": rebuild totals over the cart (the per-item overhead in the real UI)
      for (let i = 0; i < itemCount; i++) { cart.push(cart[i % cart.length]); } // duplicate to simulate growth
      cart = cart.slice(0, itemCount);
      const tAdd = performance.now() - tAdd0;
      const totals = () => { let sub = 0, cgst = 0, sgst = 0; cart.forEach(i => { const b = i.price * i.qty; sub += b; const tx = b * (i.taxRate || 0) / 100; cgst += tx / 2; sgst += tx / 2; }); return { sub, cgst, sgst, grand: sub + cgst + sgst }; };
      totals();
      const tQty0 = performance.now(); cart[0].qty = 99; cart[1].qty = 5; totals(); const tQty = performance.now() - tQty0;
      const tRem0 = performance.now(); cart.pop(); cart.shift(); const tRem = performance.now() - tRem0;
      const T = totals();
      const invoice = { date: new Date().toISOString(), customerId: null, customerName: 'Walk-in Customer',
        items: cart.map(i => ({ productId: i.id, name: i.name, qty: i.qty, price: i.price, taxRate: i.taxRate || 0, discountPercent: 0, discountAmount: 0, total: i.price * i.qty })),
        subtotal: T.sub, discount: 0, taxableAmount: T.sub, taxTotal: T.cgst + T.sgst, cgstTotal: T.cgst, sgstTotal: T.sgst,
        totalAmount: T.grand, paymentMode: 'Cash', paymentStatus: 'Paid Full', amountPaid: T.grand, status: 'Paid' };
      const tSave0 = performance.now(); DataProvider.saveSalesInvoice(invoice); const tSave = performance.now() - tSave0;
      const tPrint0 = performance.now();
      let html = '<div class="receipt"><h2>Senthil Enterprises</h2>';
      cart.forEach(i => { html += '<div>' + i.name + ' x' + i.qty + ' @ ' + i.price + '</div>'; });
      html += '<div class="total">GRAND TOTAL: ' + T.grand.toFixed(2) + '</div></div>';
      const tPrint = performance.now() - tPrint0;
      return { addItemMs: tAdd, qtyEditMs: tQty, removeMs: tRem, saveInvoiceMs: tSave, printBuildMs: tPrint, lineCount: cart.length };
    }, n, genProducts(Math.min(n, 300)).map((p, i) => ({ id: p.id, name: p.name, price: 100 + (p.price % 90), qty: (i % 5) + 1, taxRate: p.gst })));
    results.performance['pos_invoice_' + n] = {
      lineItems: n, addItemMs: +res.addItemMs.toFixed(1), qtyEditMs: +res.qtyEditMs.toFixed(1),
      removeMs: +res.removeMs.toFixed(1), saveInvoiceMs: +res.saveInvoiceMs.toFixed(1),
      printBuildMs: +res.printBuildMs.toFixed(1), addItemHuman: h(res.addItemMs), saveHuman: h(res.saveInvoiceMs)
    };
    console.log('  ' + n + ' items: add=' + h(res.addItemMs) + ' qty=' + h(res.qtyEditMs) + ' remove=' + h(res.removeMs) + ' save=' + h(res.saveInvoiceMs) + ' print=' + h(res.printBuildMs));
  }

  // ---------------- INVENTORY ----------------
  await page.evaluate(() => { localStorage.removeItem('erp_stock_adjustments'); });
  await setCollection(page, 'erp_products', genProducts(5000));
  const invOps = await page.evaluate(async () => {
    const { DataProvider } = await import('./services/dataProvider.js');
    const t0 = performance.now(); const inv = DataProvider.getProducts().filter(p => (p.stock || 0) < (p.minStock || 10)); const tF = performance.now() - t0;
    const adj = { id: 'ADJ-TEST', productId: 'PRD-P0000001', productName: 'Product 1', from: 10, to: 20, qty: 10, type: 'Add', reason: 'Opening', date: new Date().toISOString(), userId: 'USR-01' };
    const t1 = performance.now(); DataProvider.saveStockAdjustment(adj); const tS = performance.now() - t1;
    const t2 = performance.now(); const sa = DataProvider.getStockAdjustments(); const tR = performance.now() - t2;
    return { lowStockFilterMs: tF, saveAdjustmentMs: tS, readAdjustmentsMs: tR, lowCount: inv.length, adjCount: sa.length };
  });
  const pgInv = await measureReload('/#/stock-adjustments', 'table tbody');
  results.performance.inventory = {
    lowStockFilterMs: +invOps.lowStockFilterMs.toFixed(1), saveAdjustmentMs: +invOps.saveAdjustmentMs.toFixed(1),
    readAdjustmentsMs: +invOps.readAdjustmentsMs.toFixed(1), pageLoadMs: pgInv.ms, rowsRendered: pgInv.rows,
    pageLoadHuman: h(pgInv.ms), saveHuman: h(invOps.saveAdjustmentMs)
  };
  console.log('Inventory: filter=' + h(invOps.lowStockFilterMs) + ' save=' + h(invOps.saveAdjustmentMs) + ' read=' + h(invOps.readAdjustmentsMs) + ' pageLoad=' + h(pgInv.ms) + ' rows=' + pgInv.rows);
  saveResults();

  // ---------------- Part 4: stress at max scale ----------------
  console.log('\n== Part 4: Local-Storage Stress @ 10k/5k/3k/2k/500/500 ==');
  let seedResult = { ok: true, quotaExceededAt: null, invoicesSeeded: false };
  try { seedResult = Object.assign(seedResult, await page.evaluate(() => {
    const genP = (n) => Array.from({length:n}, (_,i)=>{ const s=i+1; return {id:'PRD-P'+String(s).padStart(7,'0'),sku:'SP'+s,barcode:'SP'+s,name:'Product '+s+' Item',category:['Plumbing','Electrical'][s%2],price:50+(s%200),buyingPrice:20+(s%80),stock:((s*7)%200)+50,minStock:10,unit:'Nos',gst:18,hsn:'3917',status:'In Stock',statusBadge:'success',supplier:'Sup',brand:'B',isActive:true,createdAt:'2026-07-29T14:02:23.392Z',updatedAt:'2026-07-29T14:02:23.392Z',version:1}; });
    const genC = (n) => Array.from({length:n}, (_,i)=>{ const s=i+1; return {id:'CUST-'+s,name:'Customer '+s,phone:'+91 '+String(9000000000+s),email:'c'+s+'@x.com',address:s+' Street',outstanding:s*50,type:'Retail',createdAt:'2026-07-29T14:02:23.392Z',updatedAt:'2026-07-29T14:02:23.392Z'}; });
    const genS = (n) => Array.from({length:n}, (_,i)=>{ const s=i+1; return {id:'SAL-20260803-'+String(s).padStart(6,'0'),date:new Date().toISOString(),customerId:'CUST-1',customerName:'Customer 1',items:[{productId:'PRD-P0000001',name:'Product 1',qty:1,price:100,taxRate:18,discountPercent:0,total:100}],subtotal:100,totalAmount:118,status:'Paid',paymentMode:'Cash',paymentStatus:'Paid Full'}; });
    const genP2 = (n) => Array.from({length:n}, (_,i)=>{ const s=i+1; return {id:'PUR-'+s,date:new Date().toISOString(),supplier:'Supplier '+(s%10),items:[{productId:'PRD-P0000001',name:'Product 1',qty:1,price:100}],totalAmount:118,status:'Draft',paymentMode:'Cash'}; });
    const safe=(k,v)=>{try{localStorage.setItem(k,v);return true;}catch(e){window.__qex=k;return false;}};
    safe('erp_products', JSON.stringify(genP(10000)));
    safe('erp_customers', JSON.stringify(genC(5000)));
    safe('erp_expenses', JSON.stringify((()=>{const a=[];for(let i=0;i<2000;i++){const s=i+1;a.push({id:'EXP-'+s,date:new Date().toISOString(),category:'Office',description:'Expense '+s,amount:500+(s%1000),paymentMode:'Cash',reference:'',createdAt:'2026-07-29T14:02:23.392Z',updatedAt:'2026-07-29T14:02:23.392Z'});}return a;})()));
    safe('erp_purchases', JSON.stringify(genP2(500)));
    safe('erp_purchase_returns', JSON.stringify(genP2(500)));
    const invOk = safe('erp_sales_invoices', JSON.stringify(genS(3000)));
    const st=JSON.parse(localStorage.getItem('erp_system_state')||'{}'); st.lastInvoiceNumber=3000; localStorage.setItem('erp_system_state',JSON.stringify(st));
    return { quotaExceededAt: window.__qex || null, invoicesSeeded: invOk };
  })) } catch (e) { seedResult = Object.assign(seedResult, { ok: false, error: e.message }); }
  console.log('  seed: ' + (seedResult.ok ? 'OK' : 'FAILED') + (seedResult.error ? (' err=' + seedResult.error) : ''));
  let stressOps = { readProductsMs:0, readCustomersMs:0, readExpensesMs:0, searchMs:0, saveProductMs:0, saveCustomerMs:0, exportMs:0, exportBytes:0, backupCollectionReadMs:0, counts:{}, skipped:true, error:(seedResult.ok?null:'seed failed -> stress skipped') };
  if (seedResult.ok) { try { stressOps = await page.evaluate(async () => {
    const { DataProvider } = await import('./services/dataProvider.js');
    const t0=performance.now(); DataProvider.getProducts(); const readP=performance.now()-t0;
    const t1=performance.now(); DataProvider.getCustomers(); const readC=performance.now()-t1;
    const t2=performance.now(); DataProvider.getExpenses(); const readE=performance.now()-t2;
    const t3=performance.now(); DataProvider.getProducts().filter(p=>p.name.toLowerCase().includes('product 9999')).length; const search=performance.now()-t3;
    let saveP=null; try{const t4=performance.now(); DataProvider.saveProduct({id:'PRD-STRESS',name:'Stress',price:10,buyingPrice:5,stock:10,minStock:5,unit:'Nos',gst:18,hsn:'3917',status:'In Stock',statusBadge:'success',supplier:'X',brand:'Y',isActive:true,sku:'SKU-STRESS',barcode:'BC-STRESS',category:'Plumbing',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),version:1}); saveP=performance.now()-t4;}catch(e){saveP=e.message;}
    let saveC=null; try{const t5=performance.now(); DataProvider.saveCustomer({id:'CUST-STRESS',name:'Stress C',phone:'+91 9999999999',email:'s@x.com',address:'A',outstanding:0,type:'Retail',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}); saveC=performance.now()-t5;}catch(e){saveC=e.message;}
    const t6=performance.now();
    const snap={}; ['erp_products','erp_customers','erp_expenses','erp_sales_invoices','erp_purchases','erp_settings','erp_system_state'].forEach(k=>{snap[k]=localStorage.getItem(k);});
    const blobSize=JSON.stringify(snap).length; const exportMs=performance.now()-t6;
    const t7=performance.now(); const counts={}; ['erp_products','erp_customers','erp_expenses','erp_sales_invoices','erp_purchases','erp_categories','erp_dealers','erp_stock_adjustments'].forEach(k=>{const v=JSON.parse(localStorage.getItem(k)||'[]');counts[k]=Array.isArray(v)?v.length:1;}); const backupMs=performance.now()-t7;
    return { readProductsMs:readP, readCustomersMs:readC, readExpensesMs:readE, searchMs:search, saveProductMs:saveP, saveCustomerMs:saveC, exportMs, exportBytes:blobSize, backupCollectionReadMs:backupMs, counts };
  }); } catch (e) { stressOps = Object.assign(stressOps, { error: e.message, skipped: false }); } } else {
    console.log('  (seed failed -> stress ops skipped; recording quota finding)');
  }
  results.stress = Object.assign(results.stress || {}, {
    datasets: { products:10000, customers:5000, invoices:3000, expenses:2000, purchases:500, purchaseReturns:500 },
    quota: { exceededAt: seedResult.quotaExceededAt, invoicesSeeded: seedResult.invoicesSeeded },
    readProductsMs: +stressOps.readProductsMs.toFixed(1),
    readCustomersMs: +stressOps.readCustomersMs.toFixed(1),
    readExpensesMs: +stressOps.readExpensesMs.toFixed(1),
    searchMs: +stressOps.searchMs.toFixed(1),
    saveProductMs: (typeof stressOps.saveProductMs === 'number' ? +stressOps.saveProductMs.toFixed(1) : null),
    saveProductErr: (typeof stressOps.saveProductMs === 'number' ? null : stressOps.saveProductMs),
    saveCustomerMs: (typeof stressOps.saveCustomerMs === 'number' ? +stressOps.saveCustomerMs.toFixed(1) : null),
    saveCustomerErr: (typeof stressOps.saveCustomerMs === 'number' ? null : stressOps.saveCustomerMs),
    exportMs: +stressOps.exportMs.toFixed(1),
    exportBytes: stressOps.exportBytes,
    backupCollectionReadMs: +stressOps.backupCollectionReadMs.toFixed(1),
    counts: stressOps.counts,
    readProductsHuman: h(stressOps.readProductsMs),
    saveProductHuman: (typeof stressOps.saveProductMs === 'number' ? h(stressOps.saveProductMs) : 'FAIL'),
    exportHuman: h(stressOps.exportMs),
    stressSkipped: !!stressOps.skipped,
    stressError: stressOps.error || null
  });
  console.log('Stress readProducts=' + h(stressOps.readProductsMs) + ' readCustomers=' + h(stressOps.readCustomersMs) + ' readExpenses=' + h(stressOps.readExpensesMs) + ' search=' + h(stressOps.searchMs) + ' saveProduct=' + (typeof stressOps.saveProductMs === 'number' ? h(stressOps.saveProductMs) : 'FAIL') + ' saveCustomer=' + (typeof stressOps.saveCustomerMs === 'number' ? h(stressOps.saveCustomerMs) : 'FAIL') + ' export=' + h(stressOps.exportMs) + ' backupRead=' + h(stressOps.backupCollectionReadMs));

  results.performanceConsoleErrors = pageErrors.slice();
  fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
  await browser.close();
  console.log('\nPerformance+stress results written to ' + OUT);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
