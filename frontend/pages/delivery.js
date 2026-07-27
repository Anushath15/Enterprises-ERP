/**
 * Senthil Enterprises ERP - Delivery Management
 */
import { PrimaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const deliveries = DataProvider.getDeliveries() || [];

  const renderRow = (del) => {
    let statusColor = 'primary';
    if (del.status === 'Pending') statusColor = 'warning';
    if (del.status === 'Completed') statusColor = 'success';
    if (del.status === 'Failed' || del.status === 'Returned') statusColor = 'danger';

    return \`
    <tr class="row-hover cursor-pointer" onclick="window.dispatchEvent(new CustomEvent('openDeliveryDrawer'))">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">\${del.id || '-'}</td>
      <td class="px-4 py-3.5 text-sm text-gray-600">\${del.invoice || '-'}</td>
      <td class="px-4 py-3.5">
        <p class="text-sm font-medium text-text">\${del.customer || '-'}</p>
        <p class="text-[10px] text-gray-400">\${del.phone || '-'}</p>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-500 max-w-[200px] truncate" title="\${del.address || '-'}">\${del.address || '-'}</td>
      <td class="px-4 py-3.5 text-sm font-medium text-text">\${del.person || '-'}</td>
      <td class="px-4 py-3.5 text-right font-semibold text-text">₹\${(del.charge || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-\${statusColor}/10 text-\${statusColor} uppercase tracking-wider">\${del.status || 'Pending'}</span>
      </td>
      <td class="px-4 py-3.5 text-right">
        <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('openDeliveryDrawer'))">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
        </button>
      </td>
    </tr>
    \`;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Delivery Management</h1>
          <p class="text-sm text-gray-400 mt-1">Manage product deliveries, assign delivery personnel, and track logistics.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.dispatchEvent(new CustomEvent('openDeliveryDrawer'))" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Create Delivery Request
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        \${KPICard({ title: 'Pending Deliveries', value: deliveries.filter(d => d.status === 'Pending').length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>', color: 'warning' })}
        \${KPICard({ title: 'In Transit', value: deliveries.filter(d => d.status === 'In Transit').length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>', color: 'primary' })}
        \${KPICard({ title: 'Completed (Today)', value: deliveries.filter(d => d.status === 'Completed').length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'success' })}
        \${KPICard({ title: 'Delivery Charges Collected', value: '₹' + deliveries.reduce((sum, d) => sum + (d.charge || 0), 0).toLocaleString('en-IN'), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'primary' })}
      </div>

      <div class="flex items-center gap-1 border-b border-border mb-6">
        <button class="px-4 py-3 text-sm font-medium text-primary border-b-2 border-primary">All Deliveries</button>
        <button class="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-text">Pending</button>
        <button class="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-text">Completed</button>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1100px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Delivery ID</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Invoice</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Customer</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Address</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Driver</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Delivery Charge</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
              <tbody class="divide-y divide-border">
                ${deliveries.length > 0 ? deliveries.map(renderRow).join('') : '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">No deliveries found.</td></tr>'}
              </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Right Drawer Overlay -->
    <div id="delivery-drawer-overlay" class="overlay fixed inset-0 bg-black/30 z-[60] opacity-0 pointer-events-none transition-opacity duration-200"></div>
    
    <!-- Manage Delivery Drawer -->
    <aside id="delivery-form-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[550px] bg-white border-l border-border z-[70] overflow-y-auto shadow-2xl transition-transform duration-250 flex flex-col">
      <div class="flex items-center justify-between px-6 h-16 border-b border-border sticky top-0 bg-white z-10">
        <h3 class="text-base font-semibold text-text">Manage Delivery</h3>
        <button class="close-delivery-drawer p-1.5 rounded-md hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto space-y-5">
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Delivery ID (Auto)</label>
            <input type="text" value="DEL-2407-16" disabled class="w-full px-3 py-2.5 bg-gray-100 border border-border rounded-lg text-sm text-gray-500">
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Linked Invoice</label>
            <input type="text" placeholder="Search INV-..." class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
          </div>
        </div>

        <div class="bg-primary/5 border border-primary/20 rounded-lg p-4">
           <h4 class="text-sm font-semibold text-primary mb-1">Customer Logistics (From Invoice)</h4>
           <div class="mt-3 space-y-2">
             <div class="flex">
               <span class="w-24 text-xs text-gray-500">Customer:</span>
               <span class="text-xs font-medium text-text">Karthik Constructions</span>
             </div>
             <div class="flex">
               <span class="w-24 text-xs text-gray-500">Contact:</span>
               <span class="text-xs font-medium text-text">+91 98765 43210</span>
             </div>
             <div class="flex">
               <span class="w-24 text-xs text-gray-500">Address:</span>
               <span class="text-xs font-medium text-text">Plot 45, New Town Extension, Chennai</span>
             </div>
           </div>
        </div>
        
        <div>
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Assign Delivery Person</label>
          <select class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            <option>Murugan (Auto)</option>
            <option>Selvam (Mini Truck)</option>
            <option>Third Party Logistics</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Delivery Charge (₹)</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <input type="number" placeholder="250" class="w-full pl-8 pr-3 py-2.5 bg-white border border-border rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-primary">
            </div>
            <p class="text-[10px] text-gray-400 mt-1">To be collected by driver</p>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Delivery Status</label>
            <select class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
              <option>Pending</option>
              <option>In Transit</option>
              <option>Completed</option>
              <option>Failed / Returned</option>
            </select>
          </div>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Delivery Notes for Driver</label>
          <textarea rows="3" placeholder="Call customer before arriving. Unload at back gate." class="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></textarea>
        </div>

      </div>
      
      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-between sticky bottom-0">
        <button class="px-4 py-2 text-sm font-medium text-danger bg-white border border-border rounded-lg hover:bg-danger/10">Delete Request</button>
        <div class="flex gap-2">
          <button class="close-delivery-drawer px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
          <button class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">Save Details</button>
        </div>
      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  const overlay = rootElement.querySelector('#delivery-drawer-overlay');
  const formDrawer = rootElement.querySelector('#delivery-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-delivery-drawer');

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

  window.addEventListener('openDeliveryDrawer', openForm);
  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);
}
