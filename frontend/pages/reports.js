import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Dynamic Reports Management
 * AUDIT-C02: date filter now actually filters Revenue/Purchases/Expenses/GST/
 * COGS/Profit/Top Products with a targeted re-render (no full page reload).
 */
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { todayISO, lastLocalDays, isLocalDateIn } from '../utils/dateUtils.js';

const DATE_PRESETS = {
  all: null,
  today: () => [todayISO()],
  '7days': () => lastLocalDays(7),
  '30days': () => lastLocalDays(30)
};

const filterByRange = (records, dayList) => {
  if (!dayList) return records;
  return records.filter(r => isLocalDateIn(r.date || '', dayList));
};

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

export async function render() {
  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-text">Live Business Reports</h1>
          <p class="text-sm text-gray-400 mt-1">Real-time calculations for Sales, Purchases, GST, and Ledgers.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select id="report-date-filter" class="px-3 py-2 bg-white border border-border text-sm font-medium rounded-lg focus:outline-none focus:border-primary">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
          <button id="report-print-btn" class="flex items-center gap-1.5 px-4 py-2 bg-white border border-border text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <i data-lucide="printer" class="w-4 h-4"></i> Print Report
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="report-kpi-grid"></div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" id="report-summary-row">
        <div class="bg-white rounded-xl border border-border p-5 flex items-center justify-between shadow-sm">
          <div><p class="text-xs text-gray-500">GST Collected</p><p class="text-xl font-bold text-text mt-1" id="report-gst-total">₹0</p></div>
          <div class="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center"><i data-lucide="landmark"></i></div>
        </div>
        <div class="bg-white rounded-xl border border-border p-5 flex items-center justify-between shadow-sm">
          <div><p class="text-xs text-gray-500">Market Outstanding (To Collect)</p><p class="text-xl font-bold text-success mt-1" id="report-cust-outstanding">₹0</p></div>
          <div class="w-10 h-10 rounded-lg bg-success/10 text-success flex items-center justify-center"><i data-lucide="users"></i></div>
        </div>
        <div class="bg-white rounded-xl border border-border p-5 flex items-center justify-between shadow-sm">
          <div><p class="text-xs text-gray-500">Vendor Payable (To Pay)</p><p class="text-xl font-bold text-danger mt-1" id="report-dealer-outstanding">₹0</p></div>
          <div class="w-10 h-10 rounded-lg bg-danger/10 text-danger flex items-center justify-center"><i data-lucide="truck"></i></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-border overflow-hidden">
          <div class="p-5 border-b border-border bg-gray-50"><h3 class="font-semibold text-text">Top Selling Products</h3></div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 text-[10px] font-medium text-gray-500 uppercase tracking-wide text-left">
                <tr><th class="px-4 py-2">Product Name</th><th class="px-4 py-2 text-right">Qty Sold</th><th class="px-4 py-2 text-right">Revenue</th></tr>
              </thead>
              <tbody id="report-top-products" class="divide-y divide-border"></tbody>
            </table>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-border overflow-hidden">
          <div class="p-5 border-b border-border bg-gray-50"><h3 class="font-semibold text-text">Inventory Health</h3></div>
          <div class="p-5 grid grid-cols-2 gap-4">
            <div class="p-4 bg-danger/5 border border-danger/10 rounded-xl text-center">
               <h4 class="text-2xl font-bold text-danger" id="report-dead-stock">0</h4>
               <p class="text-xs text-danger mt-1">Dead / Out of Stock</p>
            </div>
            <div class="p-4 bg-warning/5 border border-warning/10 rounded-xl text-center">
               <h4 class="text-2xl font-bold text-warning" id="report-low-stock">0</h4>
               <p class="text-xs text-warning mt-1">Low Stock Alerts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  const __listeners = [];
  const addListener = (el, evt, handler) => {
    if (!el) return;
    el.addEventListener(evt, handler);
    __listeners.push({el, evt, handler});
  };

  const dateFilter = rootElement.querySelector('#report-date-filter');

  const computeSummary = (dayList) => {
    const invoices = filterByRange(DataProvider.getSalesInvoices(), dayList);
    const purchases = filterByRange(DataProvider.getPurchaseInvoices(), dayList);
    const expenses = filterByRange(DataProvider.getExpenses(), dayList);
    const customers = DataProvider.getCustomers();
    const dealers = DataProvider.getDealers();
    const products = DataProvider.getProducts();

    const totalRevenue = invoices.reduce((sum, i) => sum + Number(i.totalAmount || i.total || 0), 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.totalAmount || p.total || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalGST = invoices.reduce((sum, i) => sum + Number(i.taxTotal || i.taxAmount || 0), 0);

    let cogs = 0;
    const productCache = new Map(products.map(p => [p.id, p]));
    invoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const p = productCache.get(item.productId) || productCache.get(item.id);
        const cost = p ? Number(p.avgCost || p.buyingPrice || 0) : 0;
        cogs += cost * Number(item.qty || 0);
      });
    });
    const grossProfit = totalRevenue - cogs - totalExpenses;

    const custOutstanding = customers.reduce((sum, c) => sum + Number(c.outstanding || 0), 0);
    const dlrOutstanding = dealers.reduce((sum, d) => sum + Number(d.outstanding || 0), 0);

    const prodSales = {};
    invoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const key = item.productId || item.id;
        if (!prodSales[key]) prodSales[key] = { qty: 0, rev: 0, name: item.name };
        prodSales[key].qty += Number(item.qty || 0);
        prodSales[key].rev += Number(item.total || 0);
      });
    });
    const topProducts = Object.values(prodSales).sort((a, b) => b.rev - a.rev).slice(0, 5);

    const deadStock = products.filter(p => Number(p.stock || 0) <= 0).length;
    const lowStock = products.filter(p => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= Number(p.minStock || 0)).length;

    return { totalRevenue, totalPurchases, totalExpenses, totalGST, grossProfit, custOutstanding, dlrOutstanding, topProducts, deadStock, lowStock };
  };

  const renderSummary = (dayList) => {
    const s = computeSummary(dayList);

    const kpiGrid = rootElement.querySelector('#report-kpi-grid');
    if (kpiGrid) {
      kpiGrid.innerHTML = `
        ${KPICard({ title: 'Total Revenue', value: money(s.totalRevenue), iconSvg: '<i data-lucide="trending-up"></i>', color: 'success' })}
        ${KPICard({ title: 'Total Purchases', value: money(s.totalPurchases), iconSvg: '<i data-lucide="shopping-cart"></i>', color: 'warning' })}
        ${KPICard({ title: 'Total Expenses', value: money(s.totalExpenses), iconSvg: '<i data-lucide="receipt"></i>', color: 'danger' })}
        ${KPICard({ title: 'Estimated Profit', value: money(s.grossProfit), iconSvg: '<i data-lucide="pie-chart"></i>', color: 'primary' })}
      `;
    }

    const setText = (sel, text) => {
      const el = rootElement.querySelector(sel);
      if (el) el.textContent = text;
    };
    setText('#report-gst-total', money(s.totalGST));
    setText('#report-cust-outstanding', money(s.custOutstanding));
    setText('#report-dealer-outstanding', money(s.dlrOutstanding));
    setText('#report-dead-stock', String(s.deadStock));
    setText('#report-low-stock', String(s.lowStock));

    const topTbody = rootElement.querySelector('#report-top-products');
    if (topTbody) {
      topTbody.innerHTML = s.topProducts.length > 0
        ? s.topProducts.map(p => `
            <tr class="row-hover border-b border-border">
              <td class="px-4 py-3 text-sm font-medium text-text">${escapeHtml(p.name)}</td>
              <td class="px-4 py-3 text-right text-sm text-gray-600">${p.qty}</td>
              <td class="px-4 py-3 text-right text-sm font-semibold text-text">${money(p.rev)}</td>
            </tr>`).join('')
        : '<tr><td colspan="3" class="p-4 text-center text-gray-400">No sales data</td></tr>';
    }

    if (window.lucide) window.lucide.createIcons({ nodes: [rootElement] });
  };

  const applyFilter = () => {
    const value = dateFilter ? dateFilter.value : 'all';
    const preset = DATE_PRESETS[value] || DATE_PRESETS.all;
    const dayList = preset ? preset() : null;
    renderSummary(dayList);
  };

  if (dateFilter) {
    applyFilter();
    addListener(dateFilter, 'change', applyFilter);
  }

  // Print functionality
  const printBtn = rootElement.querySelector('#report-print-btn');
  if (printBtn) {
    addListener(printBtn, 'click', () => {
      window.print();
    });
  }

  return function cleanup() {
    __listeners.forEach(l => {
      if (l.el) l.el.removeEventListener(l.evt, l.handler);
    });
    __listeners.length = 0;
  };
}
