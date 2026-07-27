/**
 * Senthil Enterprises ERP - Reports Management
 */
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const renderRow = (title, val1, val2) => `
    <tr class="row-hover">
      <td class="px-4 py-3 text-sm font-medium text-text">${title}</td>
      <td class="px-4 py-3 text-right text-sm text-gray-600">${val1}</td>
      <td class="px-4 py-3 text-right text-sm font-semibold text-text">${val2}</td>
    </tr>
  \`;

  const invoices = DataProvider.getSalesInvoices() || [];
  const purchases = DataProvider.getPurchases() || [];
  const expenses = DataProvider.getExpenses() || [];
  
  const totalRevenue = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalPurchases = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const grossProfit = totalRevenue - totalPurchases - totalExpenses;

  return \`
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-text">Business Reports</h1>
          <p class="text-sm text-gray-400 mt-1">Comprehensive overview of sales, purchases, profits, and outstanding balances.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative">
             <input type="date" value="2026-07-01" class="px-3 py-2 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
             <span class="mx-1 text-gray-400">to</span>
             <input type="date" value="2026-07-27" class="px-3 py-2 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
          </div>
          <button class="flex items-center gap-1.5 px-4 py-2 bg-white border border-border text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            Export PDF
          </button>
          <button class="flex items-center gap-1.5 px-4 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/90 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M3.375 12h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125m-9.75 0c-.621 0-1.125.504-1.125 1.125m19.5-3.75c0-.621-.504-1.125-1.125-1.125m1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-18.375 0c-.621 0-1.125.504-1.125 1.125"/></svg>
            Export Excel
          </button>
        </div>
      </div>

      <div class="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto">
        <button class="px-4 py-3 text-sm font-medium text-primary border-b-2 border-primary whitespace-nowrap">Dashboard Summary</button>
        <button class="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-text whitespace-nowrap">Sales & Profit</button>
        <button class="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-text whitespace-nowrap">Purchases</button>
        <button class="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-text whitespace-nowrap">Outstanding (Customers)</button>
        <button class="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-text whitespace-nowrap">Outstanding (Dealers)</button>
        <button class="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-text whitespace-nowrap">Products & Categories</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        \${KPICard({ title: 'Total Revenue', value: '₹' + totalRevenue.toLocaleString('en-IN'), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'success' })}
        \${KPICard({ title: 'Gross Profit', value: '₹' + grossProfit.toLocaleString('en-IN'), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/>', color: 'primary' })}
        \${KPICard({ title: 'Total Purchases', value: '₹' + totalPurchases.toLocaleString('en-IN'), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>', color: 'warning' })}
        \${KPICard({ title: 'Total Expenses', value: '₹' + totalExpenses.toLocaleString('en-IN'), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>', color: 'danger' })}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Sales vs Purchase Chart Placeholder -->
        <div class="bg-white rounded-xl border border-border p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-text">Revenue & Profit (Jul 2026)</h3>
            <button class="text-xs font-medium text-primary hover:underline">View Details</button>
          </div>
          <div class="h-64 flex items-end gap-2 pt-8 relative border-b border-l border-border px-2">
            <!-- Mock Chart -->
            <div class="absolute left-0 bottom-1/4 w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
            <div class="absolute left-0 bottom-2/4 w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
            <div class="absolute left-0 bottom-3/4 w-full h-px bg-gray-100 border-t border-dashed border-gray-200"></div>
            
            <div class="flex-1 bg-success/20 hover:bg-success/30 transition-colors rounded-t-sm h-[40%] relative group"><div class="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded">Week 1: ₹2.4L</div></div>
            <div class="flex-1 bg-success/80 hover:bg-success transition-colors rounded-t-sm h-[65%] relative group"><div class="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded">Week 2: ₹3.8L</div></div>
            <div class="flex-1 bg-success/50 hover:bg-success/60 transition-colors rounded-t-sm h-[50%] relative group"><div class="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded">Week 3: ₹3.1L</div></div>
            <div class="flex-1 bg-success/60 hover:bg-success/70 transition-colors rounded-t-sm h-[55%] relative group"><div class="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded">Week 4: ₹3.2L</div></div>
          </div>
          <div class="flex justify-between text-[10px] text-gray-400 mt-2 px-2">
            <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
          </div>
        </div>

        <!-- Top Selling Categories -->
        <div class="bg-white rounded-xl border border-border p-0 overflow-hidden flex flex-col">
          <div class="p-5 border-b border-border">
            <h3 class="font-semibold text-text">Top Selling Categories</h3>
          </div>
          <div class="flex-1 p-0 overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 text-[10px] font-medium text-gray-500 uppercase tracking-wide text-left border-b border-border">
                <tr>
                  <th class="px-4 py-2">Category</th>
                  <th class="px-4 py-2 text-right">Items Sold</th>
                  <th class="px-4 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                \${renderRow('Electricals (Wires & Switches)', '4,520', '₹4,85,000')}
                \${renderRow('Plumbing & CPVC', '3,115', '₹3,20,500')}
                \${renderRow('Sanitaryware', '1,205', '₹2,50,000')}
                \${renderRow('Hardware & Tools', '850', '₹1,25,000')}
                \${renderRow('Paints & Chemicals', '420', '₹64,500')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  // Logic for generating actual charts can be implemented in Phase 6/8
}
