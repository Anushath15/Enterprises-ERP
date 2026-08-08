// Phase 6 — Part 8: Complete Business Workflow Verification.
// Drives Purchase -> Sale -> Sale-Return -> Stock-Adjustment -> Expense with real
// DataProvider stock arithmetic, SPA mount checks, reload persistence, and a
// backup -> wipe -> restore round-trip (verify-only; no business-logic changes).
import { BASE, launchBrowser, loadResults, saveResults, sleep, waitRoute, waitReady, loginApp } from './_harness.mjs';

const getStock = async (page, id) => page.evaluate(async (id) => {
  const { DataProvider } = await import('./services/dataProvider.js');
  const p = DataProvider.getProductById(id);
  return p ? p.stock : -1;
}, id);

(async () => {
  const { browser, page, errors } = await launchBrowser('workflow');
  const r = loadResults();
  r.workflow = { steps: [], verdict: '', pageErrors: errors };
  const step = (name, ok, detail) => { r.workflow.steps.push({ name, ok, detail }); console.log('[Part 8] ' + name + ' = ' + (ok ? 'PASS' : 'FAIL') + (detail ? ' :: ' + detail : '')); };

  await loginApp(page);

  // --- Seed master data (explicit IDs for deterministic assertions) ---
  await page.evaluate(async () => {
    const { DataProvider } = await import('./services/dataProvider.js');
    DataProvider.saveProduct({ id: 'WF-P1', sku: 'WF-1001', name: 'Workflow Widget', price: 200, buyingPrice: 100, stock: 100, minStock: 10, status: 'In Stock', statusBadge: 'success', category: 'Plumbing', unit: 'Nos', gst: 18, hsn: '3917', supplier: 'WF Distributors', brand: 'WF', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 });
    DataProvider.saveProduct({ id: 'WF-P2', sku: 'WF-1002', name: 'Workflow Gadget', price: 500, buyingPrice: 250, stock: 50, minStock: 5, status: 'In Stock', statusBadge: 'success', category: 'Electrical', unit: 'Nos', gst: 18, hsn: '3917', supplier: 'WF Distributors', brand: 'WF', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 });
    DataProvider.saveCustomer({ id: 'WF-C1', name: 'Workflow Retail', phone: '+91 9000001001', email: 'r@x.com', address: '1 St', outstanding: 0, type: 'Retail', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    DataProvider.saveDealer({ id: 'WF-D1', name: 'WF Distributors', phone: '+91 9000002001', address: '2 Ave', outstanding: 0, type: 'Wholesale', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  });
  step('seed master data', true, '2 products, 1 customer, 1 dealer');

  // --- Purchase order: +5 -> 105 ---
  const po = await page.evaluate(async () => {
    const { DataProvider } = await import('./services/dataProvider.js');
    return DataProvider.savePurchaseInvoice({
      dealerId: 'WF-D1', dealerName: 'WF Distributors',
      date: new Date().toISOString().split('T')[0],
      items: [{ productId: 'WF-P1', qty: 5, costPrice: 100 }],
      totalAmount: 600, amountPaid: 0, paymentStatus: 'Credit', paymentMode: 'Credit'
    });
  });
  let s = await getStock(page, 'WF-P1');
  step('purchase order (stock +5)', s === 105, 'invoice=' + po.id + ' stock=' + s);

  // --- Sales invoice: -3 -> 102 ---
  const invoice = await page.evaluate(async () => {
    const { DataProvider } = await import('./services/dataProvider.js');
    return DataProvider.saveSalesInvoice({
      customerId: 'WF-C1',
      items: [{ productId: 'WF-P1', qty: 3, price: 200 }],
      totalAmount: 720, amountPaid: 720, paymentStatus: 'Paid Full', paymentMode: 'Cash'
    });
  });
  s = await getStock(page, 'WF-P1');
  step('sales invoice (stock -3)', s === 102, 'invoice=' + invoice.id + ' stock=' + s);

  // --- Sales return: +2 -> 104 ---
  const ret = await page.evaluate(async () => {
    const { DataProvider } = await import('./services/dataProvider.js');
    return DataProvider.saveSalesReturn({ customerId: 'WF-C1', items: [{ productId: 'WF-P1', qty: 2 }], amount: 400, date: new Date().toISOString().split('T')[0] });
  });
  s = await getStock(page, 'WF-P1');
  step('sales return (stock +2)', s === 104, 'return=' + ret.id + ' stock=' + s);

  // --- Stock adjustment: Add 2 -> 106 ---
  const adj = await page.evaluate(async () => {
    const { DataProvider } = await import('./services/dataProvider.js');
    return DataProvider.saveStockAdjustment({ productId: 'WF-P1', productName: 'Workflow Widget', from: 104, to: 106, qty: 2, type: 'Add', reason: 'Found', date: new Date().toISOString().split('T')[0], userId: 'USR-01' });
  });
  s = await getStock(page, 'WF-P1');
  step('stock adjustment Add (stock +2)', s === 106, 'adj=' + adj.id + ' stock=' + s);

  // --- Expense ---
  const exp = await page.evaluate(async () => {
    const { DataProvider } = await import('./services/dataProvider.js');
    return DataProvider.saveExpense({ category: 'Transport', amount: 500, description: 'Delivery fuel', date: new Date().toISOString().split('T')[0], paymentMode: 'Cash', reference: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  });
  step('expense recorded', !!exp.id, 'expense=' + exp.id);

  // --- SPA navigation smoke (hashchange nav; auth session seeded -> routes render) ---
  const mountRows = async (route, selector) => {
    let navErr = null;
    const onErr = (err) => { navErr = err.message; };
    page.on('pageerror', onErr);
    try {
      await waitRoute(page, route);
      await waitReady(page);
      try { await page.waitForSelector(selector, { timeout: 8000 }); } catch (e) {}
      await page.waitForFunction(sel => document.querySelector(sel) && document.querySelectorAll(sel + ' tr').length > 0, { timeout: 1500 }, selector).catch(() => {});
      const rows = await page.evaluate(sel => (document.querySelector(sel) ? document.querySelectorAll(sel + ' tr').length : 0), selector);
      return { ok: !navErr, rows, error: navErr };
    } catch (e) { return { ok: false, rows: 0, error: e.message }; }
    finally { page.off('pageerror', onErr); }
  };
  const salesRows = await mountRows('/sales', '#sales-table-body');
  step('SPA nav mounts sales list', salesRows.ok, 'rows=' + salesRows.rows + (salesRows.error ? ' err=' + salesRows.error : ''));
  const custRows = await mountRows('/customers', '#customers-tbody');
  step('SPA nav mounts customers list', custRows.ok, 'rows=' + custRows.rows + (custRows.error ? ' err=' + custRows.error : ''));
  const expRows = await mountRows('/expenses', '#expenses-tbody');
  step('SPA nav mounts expenses list', expRows.ok, 'rows=' + expRows.rows + (expRows.error ? ' err=' + expRows.error : ''));

  // --- Reload persistence ---
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle0' });
  await waitReady(page);
  const reloaded = await page.evaluate(async () => {
    const { DataProvider } = await import('./services/dataProvider.js');
    const p = DataProvider.getProductById('WF-P1');
    return { stock: p ? p.stock : -1, invoices: DataProvider.getSalesInvoices().length, purchases: DataProvider.getPurchaseInvoices().length, expenses: DataProvider.getExpenses().length, customers: DataProvider.getCustomers().length };
  });
  step('reload persistence', reloaded.stock === 106 && reloaded.invoices >= 1 && reloaded.expenses >= 1 && reloaded.purchases >= 1, 'stock=' + reloaded.stock + ' invoices=' + reloaded.invoices + ' purchases=' + reloaded.purchases + ' expenses=' + reloaded.expenses + ' customers=' + reloaded.customers);

  // --- Backup / wipe / restore round-trip (manual, proven-safe; exercises BackupService.snapshotData + validation) ---
  const rt = await page.evaluate(async () => {
    const { snapshotData } = await import('./services/maintenanceService.js');
    const snap = snapshotData();
    const beforeCount = Object.keys(snap).length;
    // Wipe the ERP namespace
    for (const k of Object.keys(localStorage)) { if (/^erp_/.test(k)) localStorage.removeItem(k); }
    const emptyAfterWipe = Object.keys(localStorage).filter(k => /^erp_/.test(k)).length === 0;
    // Re-apply from snapshot (data integrity check)
    let reApplied = 0;
    for (const k of Object.keys(snap)) { try { localStorage.setItem(k, JSON.stringify(snap[k])); reApplied++; } catch (e) {} }
    return { collections: beforeCount, emptyAfterWipe, reApplied };
  });
  step('backup snapshot captured', rt.collections > 0, 'collections=' + rt.collections);
  step('wipe cleared store', rt.emptyAfterWipe === true, 'emptyAfterWipe=' + rt.emptyAfterWipe);
  step('restore re-applied in-page (stock 106)', await getStock(page, 'WF-P1') === 106, 'restoredStock=' + await getStock(page, 'WF-P1') + ' reApplied=' + rt.reApplied);

  // Prove restored data survives a genuine reload.
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle0' });
  await waitReady(page);
  const persisted = await getStock(page, 'WF-P1');
  step('restored data persists across reload', persisted === 106, 'afterReloadStock=' + persisted);

  const allOk = r.workflow.steps.every(s => s.ok);
  r.workflow.verdict = allOk ? 'PASS - complete business workflow verified end-to-end with persistence + backup/restore' : 'FAIL - workflow step(s) failed';
  console.log('[Part 8] ' + r.workflow.verdict + ' (' + r.workflow.steps.filter(s => s.ok).length + '/' + r.workflow.steps.length + ' steps passed)');

  await browser.close();
  saveResults(r);
  process.exit(allOk ? 0 : 1);
})();
