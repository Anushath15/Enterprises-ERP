// Phase 6 — Part 2: Memory & Listener Leak Test.
// Drives 20 full SPA navigation cycles across all routes with a live
// EventTarget.prototype instrumentation + GC'd heap snapshots.
import { BASE, MAIN_ROUTES, launchBrowser, heap, saveResults, loadResults, sleep, waitRoute, loginApp } from './_harness.mjs';

const CYCLES = 20;

(async () => {
  const { browser, page, errors } = await launchBrowser('leaks');
  const r = loadResults();
  r.leaks = { cycles: CYCLES, routes: MAIN_ROUTES.length, measurements: [], verdict: '', pageErrors: [] };

  await loginApp(page);

  // Plant modest data so pages render real rows (exercises render churn).
  await page.evaluate(() => {
    const safe = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
    const p = Array.from({ length: 2000 }, (_, i) => ({
      id: 'PRD-P' + String(i + 1).padStart(7, '0'), sku: 'LP' + i, barcode: 'BC' + i,
      name: 'Leak Product ' + i, category: 'Plumbing', price: 50 + i, buyingPrice: 20 + i,
      stock: 100 + i, minStock: 10, unit: 'Nos', gst: 18, hsn: '3917',
      status: 'In Stock', statusBadge: 'success', supplier: 'S', brand: 'B', isActive: true,
      createdAt: '2026-07-29T14:02:23.392Z', updatedAt: '2026-07-29T14:02:23.392Z', version: 1
    }));
    safe('erp_products', p);
    const c = Array.from({ length: 1000 }, (_, i) => ({
      id: 'CUST-' + (i + 1), name: 'Leak Customer ' + i, phone: '+91 9' + String(i),
      email: 'l' + i + '@x.com', address: i + ' St', outstanding: 0, type: 'Retail',
      createdAt: '2026-07-29T14:02:23.392Z', updatedAt: '2026-07-29T14:02:23.392Z'
    }));
    safe('erp_customers', c);
  });

  // Instrument EventTarget prototype to count window/document listener churn.
  await page.evaluate(() => {
    window.__addCount = 0; window.__remCount = 0;
    const A = EventTarget.prototype.addEventListener;
    const R = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (t, o, opts) { window.__addCount++; return A.call(this, t, o, opts); };
    EventTarget.prototype.removeEventListener = function (t, o, opts) { window.__remCount++; return R.call(this, t, o, opts); };
  });

  const snap = async label => {
    const h = await heap(page);
    const lr = await page.evaluate(() => ({ add: window.__addCount, rem: window.__remCount }));
    const m = { label, ...h, listenersAdd: lr.add, listenersRemove: lr.rem, liveDiff: lr.add - lr.rem };
    r.leaks.measurements.push(m);
    console.log('  [' + label + '] heap=' + (m.used / 1048576).toFixed(1) + 'MB nodes=' + m.nodes + ' add=' + m.listenersAdd + ' rem=' + m.listenersRemove + ' live=' + m.liveDiff);
  };

  const nav = async (hash) => {
    await waitRoute(page, hash);
  };

  await snap('baseline(cycle0)');
  for (let c = 1; c <= CYCLES; c++) {
    const route = MAIN_ROUTES[c % MAIN_ROUTES.length];
    await nav(route);
    if (c % 5 === 0) await snap('cycle' + c);
    await sleep(20);
  }
  await sleep(500);
  await snap('final(cycle' + CYCLES + ')');

  const first = r.leaks.measurements[0];
  const last = r.leaks.measurements[r.leaks.measurements.length - 1];
  const heapGrowthMB = (last.used - first.used) / 1048576;
  const perCycleHeap = heapGrowthMB / CYCLES;
  const nodeGrowth = last.nodes - first.nodes;
  const listenerLeak = last.liveDiff - first.liveDiff;
  const leaked = (perCycleHeap > 1.0 && heapGrowthMB > 2) || (nodeGrowth > 500 && last.nodes > 2000) || (listenerLeak > 200);
  r.leaks.verdict = leaked ? 'FAIL - sustained growth detected' : 'PASS - no sustained growth';
  r.leaks.pageErrors = errors;
  r.leaks.metrics = { heapGrowthMB: +heapGrowthMB.toFixed(2), perCycleHeapMB: +perCycleHeap.toFixed(2), nodeGrowth, listenerLiveGrowth: listenerLeak };
  console.log('\n[Part 2] LEAK ' + r.leaks.verdict + ' | heap +' + heapGrowthMB.toFixed(2) + 'MB (' + perCycleHeap.toFixed(2) + '/cycle) nodes +' + nodeGrowth + ' liveListeners +' + listenerLeak);
  if (errors.length) console.log('[Part 2] pageErrors: ' + JSON.stringify(errors.slice(0, 5)));

  await browser.close();
  saveResults(r);
  process.exit(leaked ? 1 : 0);
})();
