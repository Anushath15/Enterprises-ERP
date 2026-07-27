/**
 * Senthil Enterprises ERP - Sales Return Management
 */
import { PrimaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const returns = DataProvider.getSalesReturns() || [];
  const customers = DataProvider.getCustomers();

  const renderRow = (ret) => {
    const customer = DataProvider.getCustomerById(ret.customerId) || { name: 'Unknown', type: '' };
    const initials = customer.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    const statusColor = ret.status === 'Pending' ? 'warning' : (ret.status === 'Approved' ? 'success' : 'danger');

    return \`
    <tr class="row-hover cursor-pointer" onclick="window.dispatchEvent(new CustomEvent('openReturnDrawer'))">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">\${ret.id}</td>
      <td class="px-4 py-3.5 text-sm text-gray-600">\${ret.invoice || '-'}</td>
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-[10px] font-bold text-primary">\${initials}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-text">\${customer.name}</p>
            <p class="text-[10px] text-gray-400">\${customer.type}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600">\${ret.product || '-'}</td>
      <td class="px-4 py-3.5 text-center text-sm text-gray-600">\${ret.qty || 0}</td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger/10 text-danger">\${ret.reason || 'Returned'}</span>
      </td>
      <td class="px-4 py-3.5 text-right text-sm font-semibold text-text">₹\${ret.amount || 0}</td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-\${statusColor}/10 text-\${statusColor} status-badge">\${ret.status || 'Pending'}</span>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-500">\${ret.date || '-'}</td>
      <td class="px-4 py-3.5 text-right">
        <div class="flex items-center justify-end gap-1">
          <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('openReturnDrawer'))">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </button>
        </div>
      </td>
    </tr>
    \`;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Sales Return Management</h1>
          <p class="text-sm text-gray-400 mt-1">Manage customer returns, refunds, exchanges, and stock updates.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.dispatchEvent(new CustomEvent('openReturnDrawer'))" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Create Return
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        \${KPICard({ title: 'Total Returns', value: returns.length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'primary' })}
        \${KPICard({ title: 'Pending Returns', value: returns.filter(r => r.status === 'Pending').length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>', color: 'warning' })}
        \${KPICard({ title: 'Approved Returns', value: returns.filter(r => r.status === 'Approved').length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'success' })}
        \${KPICard({ title: 'Refund Amount', value: '₹' + returns.reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString('en-IN'), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>', color: 'primary' })}
      </div>

      <div class="flex items-center gap-1 border-b border-border mb-6">
        <button class="px-4 py-3 text-sm font-medium text-primary border-b-2 border-primary">Return Requests</button>
        <button class="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-text">Approved</button>
        <button class="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-text">Rejected</button>
        <button class="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-text">Refunds</button>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1200px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Return ID</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Invoice</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Customer</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Product</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-center">Qty</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Reason</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Refund Amount</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Created</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              \${returns.length > 0 ? returns.map(renderRow).join('') : '<tr><td colspan="10" class="px-4 py-8 text-center text-gray-500">No returns found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Right Drawer Overlay -->
    <div id="return-drawer-overlay" class="overlay fixed inset-0 bg-black/30 z-[60] opacity-0 pointer-events-none transition-opacity duration-200"></div>
    
    <!-- Create Return Drawer -->
    <aside id="return-form-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[600px] bg-white border-l border-border z-[70] overflow-y-auto shadow-2xl transition-transform duration-250">
      <div class="flex items-center justify-between px-6 h-16 border-b border-border sticky top-0 bg-white z-10">
        <h3 class="text-base font-semibold text-text">Create Sales Return</h3>
        <button class="close-return-drawer p-1.5 rounded-md hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Return ID (Auto)</label>
            <input type="text" value="RET-2026-045" disabled class="w-full px-3 py-2.5 bg-gray-100 border border-border rounded-lg text-sm text-gray-500">
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Original Invoice Number</label>
            <input type="text" placeholder="Search INV-..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
          </div>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Select Customer</label>
          <select class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            \${customers.map(c => \`<option value="\${c.id}">\${c.name}</option>\`).join('')}
          </select>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Product Search</label>
          <input type="text" placeholder="Search product to return..." class="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary shadow-sm">
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Return Summary</label>
          <div class="border border-border rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50/60">
                <tr>
                  <th class="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide">Product</th>
                  <th class="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wide">Qty</th>
                  <th class="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wide">Price</th>
                  <th class="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wide">Refund</th>
                  <th class="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr>
                  <td class="px-3 py-2.5 text-xs text-text">Crompton 1HP Motor</td>
                  <td class="px-3 py-2.5 text-center"><input type="number" value="1" class="w-14 px-2 py-1 text-xs border border-border rounded bg-white text-center focus:outline-none focus:border-primary"></td>
                  <td class="px-3 py-2.5 text-right text-xs text-text">₹4,200</td>
                  <td class="px-3 py-2.5 text-right text-xs font-semibold text-text">₹4,200</td>
                  <td class="px-3 py-2.5 text-right"><button class="text-gray-400 hover:text-danger">×</button></td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50/60 border-t border-border">
                <tr>
                  <td colspan="3" class="px-3 py-2.5 text-right text-xs font-medium text-gray-500">Total Refund Amount</td>
                  <td colspan="2" class="px-3 py-2.5 text-right text-xs font-semibold text-text">₹4,200</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Return Reason</label>
            <select class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
              <option>Defective</option>
              <option>Damaged</option>
              <option>Changed Mind</option>
              <option>Wrong Product</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Condition</label>
            <select class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
              <option>Unopened</option>
              <option>Opened - Good</option>
              <option>Opened - Damaged</option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input type="checkbox" id="restock" checked class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary">
          <label for="restock" class="text-sm font-medium text-text">Restock item into inventory automatically</label>
        </div>

        <div class="mt-4 pt-4 border-t border-border">
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Approve return placeholder</label>
          <div class="flex items-center gap-4">
             <button class="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/90 transition-colors">
               Approve Return & Process Refund
             </button>
             <button class="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-border text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
               Save as Draft
             </button>
          </div>
        </div>

      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  document.getElementById('sidebar-root').style.display = 'flex';
  document.getElementById('navbar-root').style.display = 'flex';

  const overlay = rootElement.querySelector('#return-drawer-overlay');
  const formDrawer = rootElement.querySelector('#return-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-return-drawer');

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  const openForm = () => {
    closeAll();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  window.addEventListener('openReturnDrawer', openForm);
  
  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);
}
