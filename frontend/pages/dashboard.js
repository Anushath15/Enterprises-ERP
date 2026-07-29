/**
 * Senthil Enterprises ERP - Dashboard Page Controller
 * Professional Command Center
 */
import { KPICard, Card } from '../components/ui/cards.js';
import { Table, TableCell } from '../components/ui/tables.js';
import { Badge } from '../components/ui/status.js';
import { IconButton } from '../components/ui/buttons.js';
import { DataProvider } from '../services/dataProvider.js';

function getBackupStatus() {
  const lastBackupStr = localStorage.getItem('erp_last_backup');
  if (!lastBackupStr) {
    return '<span class="text-red-500 font-semibold"><i data-lucide="alert-circle" class="w-3 h-3 inline mr-1"></i>No backup has ever been created!</span>';
  }
  const lastBackup = new Date(lastBackupStr);
  const diffDays = Math.floor((new Date() - lastBackup) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return '<span class="text-green-600">Last backup: Today</span>';
  if (diffDays === 1) return '<span class="text-orange-500">Last backup: Yesterday</span>';
  if (diffDays > 3) return `<span class="text-red-500 font-semibold"><i data-lucide="alert-circle" class="w-3 h-3 inline mr-1"></i>Last backup: ${diffDays} days ago!</span>`;
  
  return `<span class="text-gray-500">Last backup: ${diffDays} days ago</span>`;
}

export async function render() {
  // 1. Fetch All Live Data
  const invoices = DataProvider.getSalesInvoices() || [];
  const products = DataProvider.getProducts() || [];
  const dealers = DataProvider.getDealers() || [];
  const customers = DataProvider.getCustomers() || [];
  const deliveries = DataProvider.getDeliveries() || [];
  const expenses = DataProvider.getExpenses() || [];
  
  // Date Helpers
  const today = new Date().toISOString().split('T')[0];
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  // 2. Calculate KPIs
  
  // Sales & Collections
  const todaysInvoices = invoices.filter(inv => (inv.date || '').startsWith(today));
  const todaysSales = todaysInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || inv.total || 0), 0);
  const todaysCollection = todaysInvoices.reduce((sum, inv) => sum + Number(inv.amountPaid || inv.totalAmount || 0), 0); // Assuming paid if not specified
  
  // Receivables & Payables
  const customerReceivables = customers.reduce((sum, c) => sum + Number(c.outstanding || 0), 0);
  const dealerPayables = dealers.reduce((sum, d) => sum + Number(d.outstanding || 0), 0);
  
  // Expenses
  const todaysExpenses = expenses.filter(e => e.date === today).reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Stock
  const lowStockProducts = products.filter(p => Number(p.stock ?? 0) <= Number(p.minStock ?? 5) && Number(p.stock ?? 0) > 0);
  const deadStockProducts = products.filter(p => Number(p.stock ?? 0) <= 0);
  
  // Profit Analysis (Today & Last 7 Days)
  const calculateProfit = (invoiceList) => {
    let revenue = 0;
    let cogs = 0;
    invoiceList.forEach(inv => {
      revenue += Number(inv.totalAmount || inv.total || 0);
      (inv.items || []).forEach(item => {
        const prod = products.find(p => p.id === item.id) || {};
        const cost = Number(prod.avgCost || prod.purchasePrice || prod.buyingPrice || 0);
        cogs += (cost * Number(item.qty || 1));
      });
    });
    return { revenue, cogs, grossProfit: revenue - cogs };
  };

  const todaysProfit = calculateProfit(todaysInvoices);
  const last7DaysInvoices = invoices.filter(inv => last7Days.includes((inv.date || '').split('T')[0]));
  const weekProfit = calculateProfit(last7DaysInvoices);
  
  const weekExpenses = expenses.filter(e => last7Days.includes((e.date || '').split('T')[0]))
                               .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netWeekProfit = weekProfit.grossProfit - weekExpenses;
  
  // Deliveries
  const pendingDeliveries = deliveries.filter(d => d.status === 'Pending').length;

  // 3. Process Chart Data (Last 7 Days Sales)
  const chartData = last7Days.map(dateStr => {
    const dailyTotal = invoices
      .filter(inv => (inv.date || '').startsWith(dateStr))
      .reduce((sum, inv) => sum + Number(inv.totalAmount || inv.total || 0), 0);
    return {
      label: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
      value: dailyTotal,
      raw: dateStr
    };
  });
  
  const maxChartVal = Math.max(...chartData.map(d => d.value), 1);
  const hasData = chartData.some(d => d.value > 0);
  
  const chartHtml = !hasData ? `
    <div class="flex flex-col items-center justify-center h-48 mt-4 bg-gray-50 rounded border border-dashed border-gray-200">
      <i data-lucide="bar-chart-2" class="w-8 h-8 text-gray-300 mb-2"></i>
      <p class="text-sm text-gray-500 font-medium">No sales data for the past 7 days</p>
    </div>
  ` : `
    <div class="flex items-end justify-between h-48 mt-4 gap-2">
      ${chartData.map(d => {
        const height = (d.value / maxChartVal) * 100;
        const isToday = d.raw === today;
        return `
          <div class="flex flex-col items-center flex-1 group">
            <div class="relative w-full flex justify-center h-full items-end">
              <div class="w-full max-w-[40px] bg-${isToday ? 'primary' : 'primary/20'} rounded-t-sm transition-all duration-300 group-hover:bg-primary/80" style="height: ${height}%"></div>
              <div class="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap">
                ₹${d.value.toLocaleString('en-IN')}
              </div>
            </div>
            <span class="text-[10px] font-medium text-gray-500 mt-2 uppercase tracking-wider ${isToday ? 'text-primary font-bold' : ''}">${d.label}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // 4. Top Customers & Recent Sales
  const recentInvoicesHtml = invoices.slice(-5).reverse().map(inv => `
    <div class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-100 transition-colors" onclick="window.location.hash='#/sales'">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold text-xs uppercase">
          ${(inv.customerName || 'WLK').substring(0,2)}
        </div>
        <div>
          <p class="text-sm font-bold text-gray-800">${inv.customerName || 'Walk-in Customer'}</p>
          <p class="text-[10px] text-gray-500">${inv.id} • ${inv.date ? new Date(inv.date).toLocaleString('en-IN') : 'Just now'}</p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-sm font-bold text-gray-800">₹${Number(inv.totalAmount || inv.total || 0).toLocaleString('en-IN')}</p>
        <span class="text-[10px] px-2 py-0.5 rounded-full ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} font-medium">
          ${inv.status || 'Paid'}
        </span>
      </div>
    </div>
  `).join('') || '<div class="p-6 text-center text-gray-400 text-sm">No recent sales.</div>';

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in pb-20">
      
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-2xl font-bold text-text">Command Center</h1>
          <div class="flex items-center gap-3 mt-1">
            <p class="text-sm text-gray-500">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <span class="text-gray-300">•</span>
            <p class="text-sm cursor-pointer hover:underline" onclick="window.location.hash='#/settings'">${getBackupStatus()}</p>
          </div>
        </div>
        <div class="flex gap-2">
           <button class="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2" onclick="window.location.hash='#/daily-closing'">
             <i data-lucide="calculator" class="w-4 h-4"></i> Daily Closing
           </button>
           <button class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-bold flex items-center gap-2 shadow-sm" onclick="window.location.hash='#/pos'">
             <i data-lucide="shopping-cart" class="w-4 h-4"></i> Launch POS
           </button>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div class="bg-white p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
           <div class="flex justify-between items-start mb-2">
             <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Sales</p>
             <div class="p-1.5 bg-green-50 text-green-600 rounded-md"><i data-lucide="trending-up" class="w-4 h-4"></i></div>
           </div>
           <h3 class="text-2xl font-bold text-gray-800">₹${todaysSales.toLocaleString('en-IN')}</h3>
           <p class="text-[10px] text-gray-400 mt-1">${todaysInvoices.length} invoices generated</p>
        </div>
        
        <div class="bg-white p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
           <div class="flex justify-between items-start mb-2">
             <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Collection</p>
             <div class="p-1.5 bg-blue-50 text-blue-600 rounded-md"><i data-lucide="wallet" class="w-4 h-4"></i></div>
           </div>
           <h3 class="text-2xl font-bold text-gray-800">₹${todaysCollection.toLocaleString('en-IN')}</h3>
           <p class="text-[10px] text-gray-400 mt-1">Total cash/bank inflow</p>
        </div>

        <div class="bg-white p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
           <div class="flex justify-between items-start mb-2">
             <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Receivables</p>
             <div class="p-1.5 bg-orange-50 text-orange-600 rounded-md"><i data-lucide="users" class="w-4 h-4"></i></div>
           </div>
           <h3 class="text-2xl font-bold text-gray-800">₹${customerReceivables.toLocaleString('en-IN')}</h3>
           <p class="text-[10px] text-gray-400 mt-1">Pending from clients</p>
        </div>

        <div class="bg-white p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
           <div class="flex justify-between items-start mb-2">
             <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dealer Payables</p>
             <div class="p-1.5 bg-red-50 text-red-600 rounded-md"><i data-lucide="truck" class="w-4 h-4"></i></div>
           </div>
           <h3 class="text-2xl font-bold text-gray-800">₹${dealerPayables.toLocaleString('en-IN')}</h3>
           <p class="text-[10px] text-gray-400 mt-1">To be paid to suppliers</p>
        </div>

        <div class="bg-white p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
           <div class="flex justify-between items-start mb-2">
             <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Today's Expenses</p>
             <div class="p-1.5 bg-purple-50 text-purple-600 rounded-md"><i data-lucide="receipt" class="w-4 h-4"></i></div>
           </div>
           <h3 class="text-2xl font-bold text-gray-800">₹${todaysExpenses.toLocaleString('en-IN')}</h3>
           <p class="text-[10px] text-gray-400 mt-1">Operating costs today</p>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Column: Chart & Quick Actions -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Quick Actions -->
          <div class="bg-white p-5 rounded-xl border border-border shadow-sm">
            <h3 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="zap" class="w-4 h-4 text-primary"></i> Quick Actions</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button class="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors border border-transparent hover:border-primary/20 group" onclick="window.location.hash='#/pos'">
                <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-500 group-hover:text-primary mb-2">
                  <i data-lucide="file-plus" class="w-5 h-5"></i>
                </div>
                <span class="text-xs font-semibold text-gray-700 group-hover:text-primary">New Invoice</span>
              </button>
              
              <button class="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors border border-transparent hover:border-primary/20 group" onclick="window.location.hash='#/purchases'">
                <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-500 group-hover:text-primary mb-2">
                  <i data-lucide="package-plus" class="w-5 h-5"></i>
                </div>
                <span class="text-xs font-semibold text-gray-700 group-hover:text-primary">Record Purchase</span>
              </button>
              
              <button class="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors border border-transparent hover:border-primary/20 group" onclick="window.location.hash='#/expenses'">
                <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-500 group-hover:text-primary mb-2">
                  <i data-lucide="receipt" class="w-5 h-5"></i>
                </div>
                <span class="text-xs font-semibold text-gray-700 group-hover:text-primary">Add Expense</span>
              </button>

              <button class="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors border border-transparent hover:border-primary/20 group" onclick="window.location.hash='#/customers'; setTimeout(() => window.dispatchEvent(new CustomEvent('openCustomerDrawer')), 100);">
                <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-500 group-hover:text-primary mb-2">
                  <i data-lucide="user-plus" class="w-5 h-5"></i>
                </div>
                <span class="text-xs font-semibold text-gray-700 group-hover:text-primary">New Customer</span>
              </button>
            </div>
          </div>

          <!-- Sales Chart -->
          <div class="bg-white p-6 rounded-xl border border-border shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2"><i data-lucide="bar-chart-2" class="w-4 h-4 text-primary"></i> 7-Day Sales Trend</h3>
              <span class="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">Past Week</span>
            </div>
            ${chartHtml}
          </div>

          <!-- Recent Invoices -->
          <div class="bg-white p-0 rounded-xl border border-border shadow-sm overflow-hidden">
            <div class="p-5 border-b border-border flex items-center justify-between bg-gray-50">
               <h3 class="text-sm font-bold text-gray-800 flex items-center gap-2"><i data-lucide="clock" class="w-4 h-4 text-primary"></i> Recent Sales Activity</h3>
               <button class="text-xs font-bold text-primary hover:underline" onclick="window.location.hash='#/sales'">View All</button>
            </div>
            <div class="p-2 space-y-1">
               ${recentInvoicesHtml}
            </div>
          </div>

        </div>

        <!-- Right Column: Alerts & Status -->
        <div class="space-y-6">
          
          ${Card({
            title: 'Pilot Deployment Setup',
            icon: 'rocket',
            content: `
              <div class="space-y-3 pt-2">
                <a href="#/onboarding-stock" class="block p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <i data-lucide="package-open" class="w-4 h-4 text-primary group-hover:scale-110 transition-transform"></i>
                    </div>
                    <div>
                      <h4 class="text-sm font-semibold text-text">1. Opening Stock Wizard</h4>
                      <p class="text-[10px] text-gray-500 mt-0.5">Enter initial inventory quantities</p>
                    </div>
                  </div>
                </a>
                <a href="#/onboarding-balances" class="block p-3 border border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors group">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <i data-lucide="scale" class="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform"></i>
                    </div>
                    <div>
                      <h4 class="text-sm font-semibold text-text">2. Opening Balances</h4>
                      <p class="text-[10px] text-gray-500 mt-0.5">Initialize customer and dealer ledgers</p>
                    </div>
                  </div>
                </a>
              </div>
            `
          })}

          <!-- Action Center / Alerts -->
          <div class="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div class="p-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <h3 class="text-sm font-bold text-red-800 flex items-center gap-2"><i data-lucide="alert-triangle" class="w-4 h-4"></i> Action Required</h3>
              <span class="bg-red-200 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">${deadStockProducts.length + pendingDeliveries} items</span>
            </div>
            
            <div class="p-4 space-y-4 max-h-[400px] overflow-y-auto">
              ${deadStockProducts.length === 0 && pendingDeliveries === 0 ? '<p class="text-sm text-gray-500 text-center py-4">All caught up! No urgent actions.</p>' : ''}
              
              ${deadStockProducts.slice(0,5).map(p => `
                <div class="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div class="p-2 bg-red-50 text-danger rounded-lg shrink-0 mt-0.5"><i data-lucide="package-x" class="w-4 h-4"></i></div>
                  <div>
                    <p class="text-xs font-bold text-gray-800 leading-tight">${p.name}</p>
                    <p class="text-[10px] text-gray-500 mt-1">Dead stock (0 qty remaining). Restock immediately.</p>
                  </div>
                </div>
              `).join('')}

              ${pendingDeliveries > 0 ? `
                <div class="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div class="p-2 bg-orange-50 text-warning rounded-lg shrink-0 mt-0.5"><i data-lucide="truck" class="w-4 h-4"></i></div>
                  <div>
                    <p class="text-xs font-bold text-gray-800 leading-tight">${pendingDeliveries} Pending Deliveries</p>
                    <p class="text-[10px] text-gray-500 mt-1">Customers are waiting for dispatch.</p>
                    <button class="mt-2 text-[10px] font-bold text-primary hover:underline" onclick="window.location.hash='#/delivery'">Manage Deliveries &rarr;</button>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Low Stock Warnings -->
          <div class="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div class="p-4 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
              <h3 class="text-sm font-bold text-orange-800 flex items-center gap-2"><i data-lucide="arrow-down-circle" class="w-4 h-4"></i> Low Stock Warnings</h3>
              <span class="bg-orange-200 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">${lowStockProducts.length} items</span>
            </div>
            <div class="p-4 space-y-3 max-h-[300px] overflow-y-auto">
              ${lowStockProducts.length === 0 ? '<p class="text-sm text-gray-500 text-center py-4">Inventory levels look healthy.</p>' : ''}
              
              ${lowStockProducts.slice(0,6).map(p => `
                <div class="flex items-center justify-between pb-2 border-b border-gray-100 last:border-0 last:pb-0">
                  <div class="truncate pr-2">
                    <p class="text-xs font-bold text-gray-800 truncate">${p.name}</p>
                    <p class="text-[10px] text-gray-500">Min: ${p.minStock || 5}</p>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <div class="text-right">
                      <span class="text-sm font-bold text-orange-600">${p.stock}</span>
                      <span class="text-[10px] text-gray-500 block">${p.unit || 'Nos'}</span>
                    </div>
                    <button class="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors" title="Purchase" onclick="window.location.hash='#/purchases'; setTimeout(() => window.dispatchEvent(new CustomEvent('draftPurchase', {detail: '${p.id}'})), 200)">
                      <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
              ${lowStockProducts.length > 6 ? `
                <div class="p-3 bg-gray-50 text-center border-t border-border">
                  <button class="text-xs font-bold text-primary hover:underline" onclick="window.location.hash='#/inventory'">View All Inventory</button>
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Profit Analysis Widget -->
          <div class="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div class="p-4 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <h3 class="text-sm font-bold text-green-800 flex items-center gap-2"><i data-lucide="trending-up" class="w-4 h-4"></i> Profit Analysis</h3>
              <span class="bg-green-200 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Last 7 Days</span>
            </div>
            <div class="p-4 space-y-4">
              <div>
                <p class="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Gross Profit (7D)</p>
                <div class="flex items-end justify-between">
                  <h4 class="text-xl font-bold text-gray-800">₹${weekProfit.grossProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}</h4>
                  <span class="text-xs text-gray-500 mb-1">Rev: ₹${weekProfit.revenue.toLocaleString('en-IN')}</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                  <div class="bg-green-500 h-1.5 rounded-full" style="width: ${Math.min(100, Math.max(0, (weekProfit.grossProfit / (weekProfit.revenue || 1)) * 100))}%"></div>
                </div>
              </div>
              
              <div class="pt-3 border-t border-gray-100">
                <p class="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">Net Profit (After Exp)</p>
                <div class="flex items-end justify-between">
                  <h4 class="text-xl font-bold ${netWeekProfit >= 0 ? 'text-success' : 'text-danger'}">₹${netWeekProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}</h4>
                  <span class="text-xs text-gray-500 mb-1">Exp: ₹${weekExpenses.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

export function onMount() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
