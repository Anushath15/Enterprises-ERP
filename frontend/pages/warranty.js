/**
 * Senthil Enterprises ERP - Warranty Management
 */
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const warranties = DataProvider.getWarranties() || [];


  const renderRow = (wrt) => {
    let statusColor = 'primary';
    if (wrt.claimStatus === 'Active Claim' || wrt.claimStatus === 'Sent to Company') statusColor = 'warning';
    if (wrt.claimStatus === 'Resolved') statusColor = 'success';
    if (wrt.claimStatus === 'Rejected') statusColor = 'danger';

    return \`
    <tr class="row-hover cursor-pointer" onclick="window.dispatchEvent(new CustomEvent('openWarrantyDrawer'))">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">\${wrt.id || '-'}</td>
      <td class="px-4 py-3.5">
        <p class="text-sm font-medium text-text">\${wrt.product || '-'}</p>
        <p class="text-[10px] text-gray-400">Customer: \${wrt.customer || '-'}</p>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600">\${wrt.invoice || '-'}</td>
      <td class="px-4 py-3.5 text-sm text-gray-500">\${wrt.expiry || '-'}</td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-\${statusColor}/10 text-\${statusColor} uppercase tracking-wider">\${wrt.claimStatus || 'No Claim'}</span>
      </td>
      <td class="px-4 py-3.5 text-sm font-medium text-text">\${wrt.replacement || '-'}</td>
      <td class="px-4 py-3.5 text-right">
        <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('openWarrantyDrawer'))">
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
          <h1 class="text-2xl font-bold text-text">Warranty Management</h1>
          <p class="text-sm text-gray-400 mt-1">Track product warranties, customer claims, and company replacements.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.dispatchEvent(new CustomEvent('openWarrantyDrawer'))" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Register Warranty / Claim
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1000px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Record ID</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Product / Customer</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Invoice Ref</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Warranty Expiry</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Claim Status</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Replacement</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              \${warranties.length > 0 ? warranties.map(renderRow).join('') : '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No warranty records found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Drawer Overlay -->
    <div id="warranty-drawer-overlay" class="overlay fixed inset-0 bg-black/30 z-[60] opacity-0 pointer-events-none transition-opacity duration-200"></div>
    
    <!-- Drawer -->
    <aside id="warranty-form-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[600px] bg-white border-l border-border z-[70] overflow-y-auto shadow-2xl transition-transform duration-250 flex flex-col">
      <div class="flex items-center justify-between px-6 h-16 border-b border-border sticky top-0 bg-white z-10">
        <h3 class="text-base font-semibold text-text">Warranty Record Details</h3>
        <button class="close-warranty-drawer p-1.5 rounded-md hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="p-6 flex-1 overflow-y-auto space-y-5">
        
        <div class="grid grid-cols-2 gap-4">
          <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Warranty ID (Auto)</label><input type="text" value="WRT-2026-046" disabled class="w-full px-3 py-2.5 bg-gray-100 border border-border rounded-lg text-sm text-gray-500"></div>
          <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Invoice Reference</label><input type="text" placeholder="Search INV-..." class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
        </div>

        <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Customer Name</label><input type="text" placeholder="Auto-filled from Invoice" disabled class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
        <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Product Name</label><input type="text" placeholder="Select product from Invoice..." class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
        
        <div class="grid grid-cols-2 gap-4">
          <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Warranty Expiry Date</label><input type="date" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
          <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Claim Status</label>
            <select class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
              <option>No Claim</option><option>Active Claim</option><option>Sent to Company</option><option>Resolved</option><option>Rejected</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Replacement Status</label>
            <select class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
              <option>-</option><option>Pending</option><option>Repaired</option><option>Replaced (New Item)</option>
            </select>
          </div>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Timeline (Placeholder)</label>
          <div class="p-4 bg-gray-50 border border-border rounded-lg text-sm text-gray-500">Claim lifecycle timeline goes here (Claimed -> Sent -> Received -> Closed).</div>
        </div>

        <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Service Notes</label><textarea rows="3" placeholder="Describe the fault or customer complaint..." class="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></textarea></div>
      </div>
      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button class="close-warranty-drawer px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">Save Record</button>
      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  const overlay = rootElement.querySelector('#warranty-drawer-overlay');
  const formDrawer = rootElement.querySelector('#warranty-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-warranty-drawer');

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

  window.addEventListener('openWarrantyDrawer', openForm);
  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);
}
