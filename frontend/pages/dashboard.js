/**
 * Senthil Enterprises ERP - Dashboard Page Controller
 * Displays top-level KPIs, charts, and quick actions.
 */
import { KPICard, Card } from '../components/ui/cards.js';
import { Table, TableCell } from '../components/ui/tables.js';
import { Badge, ProgressBar } from '../components/ui/status.js';
import { CSSBarChart } from '../components/charts/charts.js';
import { PrimaryButton, IconButton } from '../components/ui/buttons.js';
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const invoices = DataProvider.getSalesInvoices() || [];
  const products = DataProvider.getProducts() || [];
  const recentInvoices = invoices.slice(-5).reverse();
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const todaysSales = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const kpiSection = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      \${KPICard({
        title: "Total Sales",
        value: '₹' + todaysSales.toLocaleString('en-IN'),
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>',
        color: 'primary',
        badgeText: 'Updated',
        badgeColor: 'success'
      })}
      \${KPICard({
        title: 'Total Invoices',
        value: invoices.length.toString(),
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>',
        color: 'warning',
        badgeText: 'Active',
        badgeColor: 'success'
      })}
      \${KPICard({
        title: 'Low Stock Items',
        value: lowStockProducts.length.toString(),
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>',
        color: 'danger',
        badgeText: lowStockProducts.length > 0 ? \`\${lowStockProducts.length} new\` : 'All good',
        badgeColor: lowStockProducts.length > 0 ? 'danger' : 'success'
      })}
      \${KPICard({
        title: 'Pending Payments',
        value: '₹0',
        iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>',
        color: 'primary',
        badgeText: 'None',
        badgeColor: 'default'
      })}
    </div>
  \`;


  const recentInvoicesTable = Table({
    headers: ['Invoice #', 'Customer', 'Items', 'Amount', 'Status'],
    rows: recentInvoices,
    renderRow: (row) => `
      <tr class="hover:bg-gray-50/50 transition-colors cursor-pointer">
        \${TableCell({ content: \`<span class="text-sm font-medium text-primary">\${row.id}</span>\` })}
        \${TableCell({ content: \`
          <div>
            <p class="text-sm font-medium text-text">\${row.customerName || 'Walk-in Customer'}</p>
          </div>
        \` })}
        \${TableCell({ content: \`<span class="text-sm text-gray-500">\${(row.items || []).length} items</span>\` })}
        \${TableCell({ content: \`<span class="text-sm font-semibold text-text">₹\${(row.total || 0).toLocaleString('en-IN')}</span>\`, align: 'right' })}
        \${TableCell({ content: Badge({ text: row.status || 'Paid', type: (row.status === 'Paid' || !row.status) ? 'success' : row.status === 'Pending' ? 'warning' : 'danger' }), align: 'center' })}
      </tr>
    \`
  });

  const chartData = [
    { label: 'Mon', value: '₹32K', percentage: 45, isHighlight: false },
    { label: 'Tue', value: '₹44K', percentage: 62, isHighlight: false },
    { label: 'Wed', value: '₹27K', percentage: 38, isHighlight: false },
    { label: 'Thu', value: '₹55K', percentage: 78, isHighlight: false },
    { label: 'Fri', value: '₹39K', percentage: 55, isHighlight: false },
    { label: 'Sat', value: '₹65K', percentage: 92, isHighlight: true },
    { label: 'Sun', value: '₹25K', percentage: 35, isHighlight: false },
  ];

  const leftColumn = `
    <div class="lg:col-span-2 space-y-6">
      ${CSSBarChart({
        title: 'Weekly Sales Overview',
        subtitle: 'Sales performance for the last 7 days',
        data: chartData
      })}
      ${Card({
        title: 'Recent Invoices',
        subtitle: 'Last 5 transactions',
        headerAction: '<a href="#/sales" class="text-xs font-medium text-primary hover:text-primary/80 transition-colors">View All</a>',
        children: recentInvoicesTable
      })}
    </div>
  `;

  const rightColumn = `
    <div class="space-y-6">
      <!-- Quick Actions -->
      ${Card({
        title: 'Quick Actions',
        children: `
          <div class="grid grid-cols-2 gap-2.5">
            ${IconButton({ label: 'New Invoice', iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>', color: 'primary' })}
            ${IconButton({ label: 'Add Customer', iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>', color: 'success' })}
            ${IconButton({ label: 'Add Product', iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>', color: 'warning' })}
            ${IconButton({ label: 'Purchase Order', iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>', color: 'primary' })}
          </div>
        `
      })}

      <!-- Stock Alerts -->
      ${Card({
        title: 'Stock Alerts',
        children: `
          <div class="space-y-3 mb-3">
            <div class="flex items-center justify-between p-3 rounded-lg bg-danger/5 border border-danger/10">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                </div>
                <div>
                  <p class="text-xs font-medium text-text">1/2" PVC Pipe</p>
                  <p class="text-[10px] text-gray-400">Only 3 units left</p>
                </div>
              </div>
              <span class="text-[10px] font-bold text-danger">Critical</span>
            </div>
            <div class="flex items-center justify-between p-3 rounded-lg bg-warning/5 border border-warning/10">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <svg class="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9.75 3.75c0 .621-.504 1.125-1.125 1.125h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a1.125 1.125 0 011.125-1.125h1.5c.621 0 1.125.504 1.125 1.125v1.5z"/></svg>
                </div>
                <div>
                  <p class="text-xs font-medium text-text">Crompton 1HP Motor</p>
                  <p class="text-[10px] text-gray-400">8 units remaining</p>
                </div>
              </div>
              <span class="text-[10px] font-bold text-warning">Low</span>
            </div>
          </div>
          ${PrimaryButton({ label: 'View All Alerts', fullWidth: true })}
        `
      })}

      <!-- Top Selling Products -->
      ${Card({
        title: 'Top Products This Week',
        children: `
          <div class="space-y-4">
            <div>
              <div class="flex items-center justify-between mb-1.5"><span class="text-xs font-medium text-text">1/2" PVC Pipe (Astral)</span><span class="text-xs font-semibold text-text">₹1,24,000</span></div>
              ${ProgressBar({ percentage: 85, color: 'primary' })}
              <p class="text-[10px] text-gray-400 mt-0.5">142 units sold</p>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1.5"><span class="text-xs font-medium text-text">Crompton 1HP Motor</span><span class="text-xs font-semibold text-text">₹98,500</span></div>
              ${ProgressBar({ percentage: 68, color: 'primary' })}
              <p class="text-[10px] text-gray-400 mt-0.5">38 units sold</p>
            </div>
            <div>
              <div class="flex items-center justify-between mb-1.5"><span class="text-xs font-medium text-text">Asian Paints Apex 4L</span><span class="text-xs font-semibold text-text">₹72,300</span></div>
              ${ProgressBar({ percentage: 52, color: 'primary' })}
              <p class="text-[10px] text-gray-400 mt-0.5">89 units sold</p>
            </div>
          </div>
        `
      })}
    </div>
  `;

  return `
    <div class="p-6 max-w-[1440px] mx-auto fade-in">
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-text">Good Afternoon, Senthil</h1>
        <p class="text-sm text-gray-400 mt-1">Here's what's happening at Senthil Enterprises today.</p>
      </div>
      
      ${kpiSection}

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        ${leftColumn}
        ${rightColumn}
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  // Ensure layout shell is visible (in case user came from Login)
  document.getElementById('sidebar-root').style.display = 'flex';
  document.getElementById('navbar-root').style.display = 'flex';
  
  // Animate progress bars on load
  setTimeout(() => {
    rootElement.querySelectorAll('.progress-bar').forEach(bar => {
      const width = bar.style.width;
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = width; }, 100);
    });
  }, 300);
}
