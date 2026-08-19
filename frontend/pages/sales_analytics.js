/**
 * Senthil Enterprises ERP - Sales Analytics
 * 
 * Real-time analytics calculated from actual invoice, expense, and product data.
 * No mock data. No internet required. All calculations are local.
 * 
 * Profit calculation:
 *   COGS = sum(item.qty * item.costPrice) — costPrice snapshotted at sale time (pos.js RC4+)
 *         Falls back to product's current avgCost/buyingPrice for historical invoices.
 *   Gross Profit = Net Sales - COGS
 *   Net Profit   = Gross Profit - Operating Expenses
 */
import { DataProvider } from '../services/dataProvider.js';
import { escapeHtml } from '../utils/escapeHtml.js';

// ─── Date Utilities ────────────────────────────────────────────────────────────

/** Returns YYYY-MM-DD for local date (avoids UTC shift) */
function localDateStr(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns a Date for start of day (midnight) in local time */
function startOfDay(dateStr) {
  return new Date(`${dateStr}T00:00:00`);
}

/** Returns a Date for end of day (23:59:59.999) in local time */
function endOfDay(dateStr) {
  return new Date(`${dateStr}T23:59:59.999`);
}

/** Monday of the week containing date */
function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return localDateStr(d);
}

/** Sunday of the week containing date */
function endOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  return localDateStr(d);
}

/** Compute date range from a period key */
function getDateRange(period, customFrom, customTo) {
  const today = new Date();
  const todayStr = localDateStr(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = localDateStr(yesterday);

  switch (period) {
    case 'today':
      return { from: todayStr, to: todayStr };
    case 'yesterday':
      return { from: yesterdayStr, to: yesterdayStr };
    case 'this_week':
      return { from: startOfWeek(today), to: endOfWeek(today) };
    case 'last_week': {
      const lwEnd = new Date(today);
      lwEnd.setDate(today.getDate() - today.getDay() - (today.getDay() === 0 ? 7 : 0));
      const lwStart = new Date(lwEnd);
      lwStart.setDate(lwEnd.getDate() - 6);
      return { from: localDateStr(lwStart), to: localDateStr(lwEnd) };
    }
    case 'this_month':
      return { from: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`, to: todayStr };
    case 'last_month': {
      const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lmEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: localDateStr(lm), to: localDateStr(lmEnd) };
    }
    case 'this_year':
      return { from: `${today.getFullYear()}-01-01`, to: todayStr };
    case 'last_year':
      return { from: `${today.getFullYear() - 1}-01-01`, to: `${today.getFullYear() - 1}-12-31` };
    case 'custom':
      return { from: customFrom || todayStr, to: customTo || todayStr };
    default:
      return { from: todayStr, to: todayStr };
  }
}

/** Check if an invoice date falls within [fromStr, toStr] (inclusive) */
function inRange(invoice, fromStr, toStr) {
  if (!invoice.date) return false;
  // invoice.date is ISO string e.g. "2025-08-19T10:30:00.000Z"
  // We compare YYYY-MM-DD prefixes parsed in local time
  const invoiceLocalDate = localDateStr(new Date(invoice.date));
  return invoiceLocalDate >= fromStr && invoiceLocalDate <= toStr;
}

/** Same for expense.date which is stored as "YYYY-MM-DD" */
function expenseInRange(expense, fromStr, toStr) {
  const d = (expense.date || '').substring(0, 10);
  return d >= fromStr && d <= toStr;
}

// ─── Analytics Engine ──────────────────────────────────────────────────────────

/**
 * Compute all analytics metrics for a date range.
 * Returns an object with all calculated values.
 */
function computeAnalytics(fromStr, toStr) {
  const allInvoices = DataProvider.getSalesInvoices() || [];
  const allReturns = DataProvider.getSalesReturns ? (DataProvider.getSalesReturns() || []) : [];
  const allExpenses = DataProvider.getExpenses() || [];
  const allProducts = DataProvider.getProducts() || [];

  // Build product map for cost lookup fallback
  const productMap = new Map(allProducts.map(p => [p.id, p]));

  // Filter to date range
  const invoices = allInvoices.filter(inv => inRange(inv, fromStr, toStr));
  const returns = allReturns.filter(r => {
    const d = (r.date || r.createdAt || '');
    const localD = d ? localDateStr(new Date(d)) : '';
    return localD >= fromStr && localD <= toStr;
  });
  const expenses = allExpenses.filter(e => expenseInRange(e, fromStr, toStr));

  // ── Sales Summary ──
  const totalSalesCount = invoices.length;
  const totalSalesAmount = invoices.reduce((s, inv) => s + Number(inv.totalAmount || inv.total || 0), 0);
  const totalItemsSold = invoices.reduce((s, inv) =>
    s + (inv.items || []).reduce((qs, item) => qs + Number(item.qty || 0), 0), 0);
  const avgSaleValue = totalSalesCount > 0 ? totalSalesAmount / totalSalesCount : 0;

  // ── Returns ──
  const totalReturnsAmount = returns.reduce((s, r) => s + Number(r.amount || r.totalAmount || 0), 0);
  const netSales = Math.max(0, totalSalesAmount - totalReturnsAmount);

  // ── COGS & Profit ──
  let cogs = 0;
  let cogsDataMissing = false;

  invoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const qty = Number(item.qty || 0);
      let costPerUnit = Number(item.costPrice || 0);
      if (costPerUnit === 0 && item.productId) {
        const prod = productMap.get(item.productId);
        if (prod) {
          costPerUnit = Number(prod.avgCost || prod.buyingPrice || 0);
        }
      }
      if (costPerUnit === 0) {
        cogsDataMissing = true;
      }
      cogs += qty * costPerUnit;
    });
  });

  // Deduct COGS for returned items (P0 fix: ensure returns correctly restore profit margin)
  returns.forEach(ret => {
    (ret.items || []).forEach(item => {
      const qty = Number(item.qty || 0);
      let costPerUnit = Number(item.costPrice || 0);
      if (costPerUnit === 0 && item.productId) {
        const prod = productMap.get(item.productId);
        if (prod) {
          costPerUnit = Number(prod.avgCost || prod.buyingPrice || 0);
        }
      }
      cogs -= qty * costPerUnit;
    });
  });

  const grossProfit = netSales - cogs;

  // ── Expenses ──
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  // Expense breakdown by category
  const expenseByCategory = {};
  expenses.forEach(e => {
    const cat = e.category || 'Uncategorized';
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount || 0);
  });

  const netProfit = grossProfit - totalExpenses;
  const profitMargin = netSales > 0 ? (netProfit / netSales) * 100 : 0;

  // ── Payment Method Breakdown ──
  const paymentBreakdown = {};
  invoices.forEach(inv => {
    const mode = inv.paymentMode || 'Cash';
    if (!paymentBreakdown[mode]) paymentBreakdown[mode] = { count: 0, amount: 0 };
    paymentBreakdown[mode].count++;
    paymentBreakdown[mode].amount += Number(inv.totalAmount || inv.total || 0);
  });

  // ── Top Selling Products ──
  const productSales = {};
  invoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const key = item.productId || item.name;
      if (!productSales[key]) {
        productSales[key] = { name: item.name || key, qty: 0, amount: 0, cogs: 0, hasCost: true };
      }
      const qty = Number(item.qty || 0);
      productSales[key].qty += qty;
      productSales[key].amount += Number(item.total || (qty * Number(item.price || 0)));

      let cost = Number(item.costPrice || 0);
      if (cost === 0 && item.productId) {
        const prod = productMap.get(item.productId);
        if (prod) cost = Number(prod.avgCost || prod.buyingPrice || 0);
      }
      if (cost === 0) productSales[key].hasCost = false;
      productSales[key].cogs += qty * cost;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10)
    .map(p => ({
      ...p,
      profit: p.hasCost ? (p.amount - p.cogs) : null
    }));

  // ── Trend Data ──
  const trendData = buildTrend(invoices, expenses, productMap, fromStr, toStr);

  return {
    totalSalesCount,
    totalSalesAmount,
    totalItemsSold,
    avgSaleValue,
    totalReturnsAmount,
    netSales,
    cogs,
    cogsDataMissing,
    grossProfit,
    totalExpenses,
    expenseByCategory,
    netProfit,
    profitMargin,
    paymentBreakdown,
    topProducts,
    trendData,
    invoices
  };
}

/** Group invoices and expenses by time bucket and return trend array */
function buildTrend(invoices, expenses, productMap, fromStr, toStr) {
  const from = new Date(`${fromStr}T00:00:00`);
  const to = new Date(`${toStr}T23:59:59`);
  const diffDays = Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1;

  let buckets = [];

  if (diffDays <= 31) {
    // Daily buckets
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const dateKey = localDateStr(d);
      buckets.push({ label, dateKey, type: 'day' });
    }
  } else if (diffDays <= 365) {
    // Monthly buckets
    const months = new Set();
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.add(key);
    }
    Array.from(months).sort().forEach(key => {
      const [y, m] = key.split('-');
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      buckets.push({ label, monthKey: key, type: 'month' });
    });
  } else {
    // Yearly buckets
    const years = new Set();
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(from);
      d.setDate(from.getDate() + i);
      years.add(String(d.getFullYear()));
    }
    Array.from(years).sort().forEach(y => {
      buckets.push({ label: y, yearKey: y, type: 'year' });
    });
  }

  // Aggregate invoices into buckets
  return buckets.map(bucket => {
    let sales = 0, cogsVal = 0, expVal = 0;

    invoices.forEach(inv => {
      const invDate = localDateStr(new Date(inv.date));
      let match = false;
      if (bucket.type === 'day') match = (invDate === bucket.dateKey);
      else if (bucket.type === 'month') match = (invDate.startsWith(bucket.monthKey));
      else if (bucket.type === 'year') match = (invDate.startsWith(bucket.yearKey));

      if (match) {
        sales += Number(inv.totalAmount || inv.total || 0);
        (inv.items || []).forEach(item => {
          const qty = Number(item.qty || 0);
          let cost = Number(item.costPrice || 0);
          if (cost === 0 && item.productId) {
            const prod = productMap.get(item.productId);
            if (prod) cost = Number(prod.avgCost || prod.buyingPrice || 0);
          }
          cogsVal += qty * cost;
        });
      }
    });

    expenses.forEach(exp => {
      const expDate = (exp.date || '').substring(0, 10);
      let match = false;
      if (bucket.type === 'day') match = (expDate === bucket.dateKey);
      else if (bucket.type === 'month') match = (expDate.startsWith(bucket.monthKey));
      else if (bucket.type === 'year') match = (expDate.startsWith(bucket.yearKey));
      if (match) expVal += Number(exp.amount || 0);
    });

    const grossP = sales - cogsVal;
    const netP = grossP - expVal;
    return { label: bucket.label, sales, cogs: cogsVal, grossProfit: grossP, expenses: expVal, netProfit: netP };
  });
}

// ─── Currency Helper ───────────────────────────────────────────────────────────

function inr(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return '₹0.00';
  return '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return '0.00%';
  return n.toFixed(2) + '%';
}

// ─── SVG Bar Chart ─────────────────────────────────────────────────────────────

function renderBarChart(trendData) {
  if (!trendData || trendData.length === 0) {
    return `<div class="flex items-center justify-center h-40 text-gray-400 text-sm">No data for this period</div>`;
  }

  const maxSales = Math.max(...trendData.map(d => d.sales), 1);
  const W = 100 / trendData.length;
  const barPad = Math.max(1, W * 0.15);

  const salesBars = trendData.map((d, i) => {
    const h = (d.sales / maxSales) * 100;
    const x = i * W + barPad;
    const bw = W - barPad * 2;
    return `<rect x="${x}%" y="${100 - h}%" width="${bw}%" height="${h}%" fill="#4F46E5" rx="2" opacity="0.85">
      <title>${escapeHtml(d.label)}: ${inr(d.sales)}</title>
    </rect>`;
  }).join('');

  const profitBars = trendData.map((d, i) => {
    if (d.netProfit <= 0 || d.cogs === 0) return '';
    const h = (d.netProfit / maxSales) * 100;
    const x = i * W + barPad;
    const bw = W - barPad * 2;
    return `<rect x="${x}%" y="${100 - h}%" width="${bw}%" height="${h}%" fill="#10B981" rx="2" opacity="0.7">
      <title>${escapeHtml(d.label)} Profit: ${inr(d.netProfit)}</title>
    </rect>`;
  }).join('');

  // Only show labels if reasonable count
  const showLabels = trendData.length <= 14;
  const labels = showLabels ? trendData.map((d, i) => {
    const cx = (i * W + W / 2);
    return `<text x="${cx}%" y="100%" text-anchor="middle" font-size="9" fill="#6B7280">${escapeHtml(d.label)}</text>`;
  }).join('') : '';

  return `
    <div style="position:relative; height: 180px; padding-bottom: 20px;">
      <svg width="100%" height="100%" viewBox="0 0 100 120" preserveAspectRatio="none" style="position:absolute;top:0;left:0;bottom:20px;height:calc(100% - 20px);">
        ${salesBars}
        ${profitBars}
      </svg>
      ${showLabels ? `<svg width="100%" height="20px" style="position:absolute;bottom:0;left:0;" viewBox="0 0 100 12" preserveAspectRatio="none">${labels}</svg>` : ''}
    </div>
    <div class="flex items-center gap-4 mt-1 text-xs text-gray-500">
      <span class="flex items-center gap-1"><span style="display:inline-block;width:12px;height:10px;background:#4F46E5;border-radius:2px;opacity:0.85;"></span> Sales</span>
      <span class="flex items-center gap-1"><span style="display:inline-block;width:12px;height:10px;background:#10B981;border-radius:2px;opacity:0.7;"></span> Net Profit</span>
    </div>`;
}

// ─── HTML Renderers ────────────────────────────────────────────────────────────

function renderKPICard(title, value, subtext, color = 'primary', icon = 'trending-up') {
  const colors = {
    primary: 'text-primary bg-primary/10',
    success: 'text-green-600 bg-green-50',
    danger: 'text-red-600 bg-red-50',
    warning: 'text-amber-600 bg-amber-50',
    purple: 'text-purple-600 bg-purple-50'
  };
  const cls = colors[color] || colors.primary;
  return `
    <div class="bg-white rounded-xl border border-border p-4 shadow-sm">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide truncate">${escapeHtml(title)}</p>
          <p class="text-xl font-bold text-text mt-1 truncate">${value}</p>
          ${subtext ? `<p class="text-xs text-gray-400 mt-0.5">${escapeHtml(subtext)}</p>` : ''}
        </div>
        <div class="w-9 h-9 rounded-lg ${cls} flex items-center justify-center shrink-0">
          <i data-lucide="${icon}" class="w-4 h-4"></i>
        </div>
      </div>
    </div>`;
}

function renderProfitSection(data) {
  const { netSales, cogs, cogsDataMissing, grossProfit, totalExpenses, netProfit, profitMargin } = data;

  if (cogsDataMissing && cogs === 0) {
    return `
      <div class="col-span-full bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>⚠ Profit calculation unavailable for this period due to incomplete cost data.</strong>
        <p class="mt-1 text-amber-700">Product purchase/cost price is not recorded for some items. 
        Add purchase cost to your products, or record purchases to enable profit calculations.</p>
      </div>`;
  }

  const gpColor = grossProfit >= 0 ? 'success' : 'danger';
  const npColor = netProfit >= 0 ? 'success' : 'danger';
  const gpIcon = grossProfit >= 0 ? 'trending-up' : 'trending-down';
  const npIcon = netProfit >= 0 ? 'trending-up' : 'trending-down';

  const cogsWarning = cogsDataMissing ? `<div class="col-span-full text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">⚠ Some items had no cost data — COGS may be understated for this period.</div>` : '';

  return `
    ${cogsWarning}
    ${renderKPICard('Net Sales', inr(netSales), 'After returns', 'primary', 'shopping-bag')}
    ${renderKPICard('Cost of Goods Sold', inr(cogs), 'Product cost basis', 'warning', 'package')}
    ${renderKPICard('Gross Profit', (grossProfit < 0 ? '-' : '') + inr(grossProfit), 'Net Sales - COGS', gpColor, gpIcon)}
    ${renderKPICard('Operating Expenses', inr(totalExpenses), 'All recorded expenses', 'danger', 'receipt')}
    ${renderKPICard('Net Profit / Loss', (netProfit < 0 ? '-' : '') + inr(netProfit), 'Gross Profit - Expenses', npColor, npIcon)}
    ${renderKPICard('Profit Margin', pct(profitMargin), 'Net Profit / Net Sales', netProfit >= 0 ? 'success' : 'danger', 'percent')}`;
}

function renderPaymentBreakdown(paymentBreakdown, totalSalesAmount) {
  const entries = Object.entries(paymentBreakdown).sort((a, b) => b[1].amount - a[1].amount);
  if (entries.length === 0) return `<p class="text-sm text-gray-400 text-center py-4">No payment data</p>`;

  return entries.map(([mode, data]) => {
    const pctVal = totalSalesAmount > 0 ? (data.amount / totalSalesAmount * 100) : 0;
    const barColor = mode === 'Cash' ? '#10B981' : mode === 'UPI' ? '#4F46E5' : mode === 'Credit' ? '#F59E0B' : '#6B7280';
    return `
      <div class="mb-3">
        <div class="flex justify-between text-sm mb-1">
          <span class="font-medium text-text">${escapeHtml(mode)}</span>
          <span class="text-gray-500">${data.count} txns · ${inr(data.amount)} · ${pct(pctVal)}</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-2">
          <div class="h-2 rounded-full" style="width:${Math.min(100, pctVal).toFixed(1)}%; background:${barColor};"></div>
        </div>
      </div>`;
  }).join('');
}

function renderExpenseBreakdown(expenseByCategory, totalExpenses) {
  const entries = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return `<p class="text-sm text-gray-400 text-center py-4">No expenses recorded for this period</p>`;

  return entries.map(([cat, amount]) => {
    const pctVal = totalExpenses > 0 ? (amount / totalExpenses * 100) : 0;
    return `
      <div class="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0 text-sm">
        <span class="text-text font-medium">${escapeHtml(cat)}</span>
        <div class="text-right">
          <span class="text-danger font-semibold">${inr(amount)}</span>
          <span class="text-xs text-gray-400 ml-2">${pct(pctVal)}</span>
        </div>
      </div>`;
  }).join('');
}

function renderTopProducts(topProducts) {
  if (topProducts.length === 0) {
    return `<tr><td colspan="4" class="px-4 py-8 text-center text-gray-400 text-sm">No product data for this period</td></tr>`;
  }
  return topProducts.map((p, i) => {
    const profitCell = p.profit !== null
      ? `<span class="${p.profit >= 0 ? 'text-green-600' : 'text-red-600'} font-semibold">${(p.profit < 0 ? '-' : '') + inr(p.profit)}</span>`
      : `<span class="text-gray-400 text-xs">No cost data</span>`;
    return `
      <tr class="border-b border-gray-50 last:border-0">
        <td class="px-4 py-2.5 text-sm text-gray-400">${i + 1}</td>
        <td class="px-4 py-2.5 text-sm font-medium text-text">${escapeHtml(p.name)}</td>
        <td class="px-4 py-2.5 text-sm text-center text-gray-600">${Number(p.qty).toLocaleString('en-IN')}</td>
        <td class="px-4 py-2.5 text-sm text-right font-semibold text-text">${inr(p.amount)}</td>
        <td class="px-4 py-2.5 text-sm text-right">${profitCell}</td>
      </tr>`;
  }).join('');
}

// ─── Main Render ───────────────────────────────────────────────────────────────

export async function render() {
  return `
    <div class="p-4 sm:p-6 max-w-[1600px] mx-auto fade-in pb-24" id="sa-root">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <div>
          <h1 class="text-2xl font-bold text-text">Sales Analytics</h1>
          <p class="text-sm text-gray-500 mt-0.5">Real-time sales, profit, and expense insights from your ERP data</p>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="bg-white rounded-xl border border-border p-4 mb-5 shadow-sm">
        <div class="flex flex-wrap gap-2 items-center">
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Period:</span>
          ${['today','yesterday','this_week','last_week','this_month','last_month','this_year','last_year'].map(p => {
            const labels = {today:'Today',yesterday:'Yesterday',this_week:'This Week',last_week:'Last Week',this_month:'This Month',last_month:'Last Month',this_year:'This Year',last_year:'Last Year'};
            return `<button class="sa-period-btn px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${p === 'this_month' ? 'bg-primary text-white border-primary' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}" data-period="${p}">${labels[p]}</button>`;
          }).join('')}
          <button class="sa-period-btn px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100" data-period="custom">Custom</button>
        </div>
        <div id="sa-custom-range" class="hidden mt-3 flex flex-wrap gap-3 items-end">
          <div>
            <label class="block text-xs text-gray-500 mb-1">From Date</label>
            <input type="date" id="sa-from" class="px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">To Date</label>
            <input type="date" id="sa-to" class="px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
          </div>
          <button id="sa-apply-custom" class="px-4 py-1.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">Apply Filter</button>
        </div>
        <div class="mt-2 text-xs text-gray-400" id="sa-period-label"></div>
      </div>

      <!-- KPI Summary -->
      <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5" id="sa-summary-cards">
        <!-- Populated by JS -->
      </div>

      <!-- Profit Section -->
      <h2 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Profit &amp; Loss</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-5" id="sa-profit-cards">
        <!-- Populated by JS -->
      </div>

      <!-- Chart + Payment Split -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
        <!-- Trend Chart -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-border shadow-sm p-4">
          <h2 class="text-sm font-bold text-text mb-3">Sales &amp; Profit Trend</h2>
          <div id="sa-chart">
            <div class="flex items-center justify-center h-40 text-gray-400 text-sm">Loading...</div>
          </div>
        </div>
        <!-- Payment Breakdown -->
        <div class="bg-white rounded-xl border border-border shadow-sm p-4">
          <h2 class="text-sm font-bold text-text mb-3">Payment Methods</h2>
          <div id="sa-payment-breakdown">
            <div class="flex items-center justify-center h-40 text-gray-400 text-sm">Loading...</div>
          </div>
        </div>
      </div>

      <!-- Expenses + Top Products -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <!-- Expense Breakdown -->
        <div class="bg-white rounded-xl border border-border shadow-sm p-4">
          <h2 class="text-sm font-bold text-text mb-3">Expense Breakdown</h2>
          <div id="sa-expense-breakdown">Loading...</div>
        </div>
        <!-- Top Products -->
        <div class="bg-white rounded-xl border border-border shadow-sm p-4">
          <h2 class="text-sm font-bold text-text mb-3">Top Selling Products</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-border">
                  <th class="px-4 pb-2 text-[10px] font-semibold text-gray-400 uppercase">#</th>
                  <th class="px-4 pb-2 text-[10px] font-semibold text-gray-400 uppercase">Product</th>
                  <th class="px-4 pb-2 text-[10px] font-semibold text-gray-400 uppercase text-center">Qty</th>
                  <th class="px-4 pb-2 text-[10px] font-semibold text-gray-400 uppercase text-right">Sales</th>
                  <th class="px-4 pb-2 text-[10px] font-semibold text-gray-400 uppercase text-right">Profit</th>
                </tr>
              </thead>
              <tbody id="sa-top-products">
                <tr><td colspan="5" class="px-4 py-8 text-center text-gray-400 text-sm">Loading...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Recent Invoices Drill-Down -->
      <div class="bg-white rounded-xl border border-border shadow-sm p-4 mb-5">
        <h2 class="text-sm font-bold text-text mb-3">Invoices in Period <span id="sa-invoice-count" class="font-normal text-gray-400 text-xs"></span></h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-border bg-gray-50">
                <th class="px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase">Invoice #</th>
                <th class="px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase">Date</th>
                <th class="px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase">Customer</th>
                <th class="px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase text-center">Items</th>
                <th class="px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase text-center">Payment</th>
                <th class="px-4 py-2.5 text-[10px] font-semibold text-gray-400 uppercase text-right">Amount</th>
              </tr>
            </thead>
            <tbody id="sa-invoice-list">
              <tr><td colspan="6" class="px-4 py-8 text-center text-gray-400 text-sm">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ─── Mount & Interactivity ─────────────────────────────────────────────────────

export async function onMount(rootEl) {
  let currentPeriod = 'this_month';
  let customFrom = '';
  let customTo = '';

  function periodLabel(from, to) {
    if (from === to) return `Showing data for: ${from}`;
    return `Showing data from ${from} to ${to}`;
  }

  function updateUI() {
    const { from, to } = getDateRange(currentPeriod, customFrom, customTo);
    rootEl.querySelector('#sa-period-label').textContent = periodLabel(from, to);

    const data = computeAnalytics(from, to);

    // Summary Cards
    const summaryEl = rootEl.querySelector('#sa-summary-cards');
    summaryEl.innerHTML = `
      ${renderKPICard('Total Sales', inr(data.totalSalesAmount), `${data.totalSalesCount} invoices`, 'primary', 'shopping-cart')}
      ${renderKPICard('Average Sale', inr(data.avgSaleValue), 'Per invoice', 'purple', 'bar-chart-2')}
      ${renderKPICard('Items Sold', data.totalItemsSold.toLocaleString('en-IN'), 'Total units', 'success', 'package')}
      ${renderKPICard('Returns', inr(data.totalReturnsAmount), 'Sales returns', 'danger', 'corner-up-left')}
    `;

    // Profit Cards
    rootEl.querySelector('#sa-profit-cards').innerHTML = renderProfitSection(data);

    // Chart
    rootEl.querySelector('#sa-chart').innerHTML = renderBarChart(data.trendData);

    // Payment Breakdown
    rootEl.querySelector('#sa-payment-breakdown').innerHTML = renderPaymentBreakdown(data.paymentBreakdown, data.totalSalesAmount);

    // Expense Breakdown
    rootEl.querySelector('#sa-expense-breakdown').innerHTML = renderExpenseBreakdown(data.expenseByCategory, data.totalExpenses);

    // Top Products
    rootEl.querySelector('#sa-top-products').innerHTML = renderTopProducts(data.topProducts);

    // Invoice List
    const sortedInvoices = [...data.invoices].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50);
    rootEl.querySelector('#sa-invoice-count').textContent = `(${data.invoices.length} total, showing ${sortedInvoices.length})`;
    rootEl.querySelector('#sa-invoice-list').innerHTML = sortedInvoices.length === 0
      ? `<tr><td colspan="6" class="px-4 py-8 text-center text-gray-400 text-sm">No invoices in this period</td></tr>`
      : sortedInvoices.map(inv => {
          const dateStr = inv.date ? new Date(inv.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
          const amount = Number(inv.totalAmount || inv.total || 0);
          return `
            <tr class="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
              <td class="px-4 py-2.5 font-semibold text-primary text-xs">${escapeHtml(inv.id || '-')}</td>
              <td class="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">${escapeHtml(dateStr)}</td>
              <td class="px-4 py-2.5 text-sm text-text">${escapeHtml(inv.customerName || 'Walk-in')}</td>
              <td class="px-4 py-2.5 text-center text-xs text-gray-500">${(inv.items || []).length}</td>
              <td class="px-4 py-2.5 text-center"><span class="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">${escapeHtml(inv.paymentMode || 'Cash')}</span></td>
              <td class="px-4 py-2.5 text-right font-bold text-text text-sm">₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            </tr>`;
        }).join('');

    // Re-init icons
    if (window.lucide) window.lucide.createIcons();
  }

  // Period buttons
  rootEl.querySelectorAll('.sa-period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      rootEl.querySelectorAll('.sa-period-btn').forEach(b => {
        b.classList.remove('bg-primary', 'text-white', 'border-primary');
        b.classList.add('bg-gray-50', 'border-gray-200', 'text-gray-600');
      });
      btn.classList.add('bg-primary', 'text-white', 'border-primary');
      btn.classList.remove('bg-gray-50', 'border-gray-200', 'text-gray-600');

      currentPeriod = btn.dataset.period;
      const customRange = rootEl.querySelector('#sa-custom-range');
      if (currentPeriod === 'custom') {
        customRange.classList.remove('hidden');
      } else {
        customRange.classList.add('hidden');
        updateUI();
      }
    });
  });

  // Custom range apply
  rootEl.querySelector('#sa-apply-custom')?.addEventListener('click', () => {
    customFrom = rootEl.querySelector('#sa-from')?.value || '';
    customTo = rootEl.querySelector('#sa-to')?.value || '';
    if (!customFrom || !customTo) {
      alert('Please select both From and To dates.');
      return;
    }
    if (customFrom > customTo) {
      alert('From date must be before To date.');
      return;
    }
    updateUI();
  });

  // Initial render
  updateUI();

  return () => {}; // cleanup
}
