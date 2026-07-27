/**
 * Senthil Enterprises ERP - Dealers Page Controller
 */
import { PrimaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const dealers = DataProvider.getDealers();

  const renderStars = (rating) => {
    let html = '';
    const full = Math.floor(rating || 0);
    for(let i=0; i<5; i++) {
      if(i < full) html += '<span class="text-warning">★</span>';
      else html += '<span class="text-gray-300">★</span>';
    }
    html += \`<span class="text-xs text-gray-400 ml-1">\${(rating||0).toFixed(1)}</span>\`;
    return html;
  };

  const renderRow = (d) => {
    const initials = d.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    const isInactive = !d.isActive;
    const color = d.category === 'Plumbing' ? 'primary' : d.category === 'Electricals' ? 'success' : 'warning';
    
    return \`
    <tr class="row-hover cursor-pointer" onclick="window.dispatchEvent(new CustomEvent('openDealerProfile', {detail: '\${d.id}'}))">
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-\${color}/10 flex items-center justify-center">
            <span class="text-xs font-bold text-\${color}">\${initials}</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-text">\${d.name}</p>
            <p class="text-[10px] text-gray-400">Since 2024</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600">\${d.contactPerson || '-'}</td>
      <td class="px-4 py-3.5 text-sm text-gray-600">\${d.phone}</td>
      <td class="px-4 py-3.5">
        <span class="font-mono text-xs text-gray-500">\${d.gstin || '-'}</span>
      </td>
      <td class="px-4 py-3.5 text-right font-semibold \${d.outstanding > 0 ? 'text-warning' : 'text-text'}">₹\${d.outstanding || 0}</td>
      <td class="px-4 py-3.5 text-right text-sm text-success font-medium">₹0</td>
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-1">
          \${renderStars(4.5)}
        </div>
      </td>
      <td class="px-4 py-3.5 text-right">
        <div class="flex items-center justify-end gap-1">
          <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" title="Edit" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('openDealerForm'))">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
          </button>
          <button class="p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-gray-100" title="Delete" onclick="event.stopPropagation()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
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
          <h1 class="text-2xl font-bold text-text">Dealer Management</h1>
          <p class="text-sm text-gray-400 mt-1">Manage all suppliers, dealers, and their accounts.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="flex items-center gap-1.5 px-3.5 py-2 border border-border text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25"/></svg>
            Import
          </button>
          <button class="flex items-center gap-1.5 px-3.5 py-2 border border-border text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            Export
          </button>
          <button onclick="window.dispatchEvent(new CustomEvent('openDealerForm'))" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Add Dealer
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        \${KPICard({ title: 'Total Dealers', value: dealers.length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>', color: 'primary' })}
        \${KPICard({ title: 'Outstanding Amount', value: '₹' + dealers.reduce((sum, d) => sum + (d.outstanding || 0), 0).toLocaleString('en-IN'), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/>', color: 'warning' })}
        \${KPICard({ title: 'Replacement Cases', value: '0', iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>', color: 'danger' })}
        \${KPICard({ title: 'Pending Payments', value: '₹0', iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'success' })}
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden mb-6">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1200px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Dealer</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Company</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Phone</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">GST</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Outstanding</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Payment Due</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Rating</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              ${dealers.map(renderRow).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Right Drawer Overlay -->
    <div id="dealer-drawer-overlay" class="overlay fixed inset-0 bg-black/30 z-[60] opacity-0 pointer-events-none transition-opacity duration-200"></div>
    
    <!-- Dealer Form Drawer -->
    <aside id="dealer-form-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[520px] bg-white border-l border-border z-[70] overflow-y-auto shadow-2xl transition-transform duration-250">
      <div class="flex items-center justify-between px-6 h-16 border-b border-border sticky top-0 bg-white z-10">
        <h3 class="text-base font-semibold text-text">Add / Edit Dealer</h3>
        <button class="close-dealer-drawer p-1.5 rounded-md hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="p-6 space-y-5">
        <div>
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Dealer Name *</label>
          <input type="text" placeholder="e.g. Vrindavan Traders" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
        </div>
        <div>
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Company / Firm Name</label>
          <input type="text" placeholder="e.g. Vrindavan Enterprises" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Phone *</label>
            <input type="text" placeholder="+91 98765 43210" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Email</label>
            <input type="email" placeholder="dealer@company.com" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">GST Number</label>
            <input type="text" placeholder="33AAACV1234E1Z9" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">PAN Number</label>
            <input type="text" placeholder="AABCV1234E" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
          </div>
        </div>
        <div class="flex gap-3 pt-4">
          <button class="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            Save Dealer
          </button>
        </div>
      </div>
    </aside>

    <!-- Dealer Profile Drawer -->
    <aside id="dealer-profile-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[600px] bg-white border-l border-border z-[75] overflow-y-auto shadow-2xl transition-transform duration-250">
      <div class="flex items-center justify-between px-6 h-16 border-b border-border sticky top-0 bg-white z-10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-sm font-bold text-primary">VT</span>
          </div>
          <div>
            <h3 class="text-base font-semibold text-text">Vrindavan Traders</h3>
            <p class="text-xs text-gray-400">Dealer since 2022 · GST: 33AAACV1234E1Z9</p>
          </div>
        </div>
        <button class="close-dealer-drawer p-1.5 rounded-md hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="p-6 space-y-6" id="dealer-profile-content">
        <!-- Content injected via JS -->
      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  document.getElementById('sidebar-root').style.display = 'flex';
  document.getElementById('navbar-root').style.display = 'flex';

  const overlay = rootElement.querySelector('#dealer-drawer-overlay');
  const formDrawer = rootElement.querySelector('#dealer-form-drawer');
  const profileDrawer = rootElement.querySelector('#dealer-profile-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-dealer-drawer');

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
    profileDrawer.classList.add('translate-x-full');
  };

  const openForm = () => {
    closeAll();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  const openProfile = (e) => {
    import('../services/DataProvider.js').then(({ DataProvider }) => {
      const d = DataProvider.getDealerById(e.detail);
      if(!d) return;

      const initials = d.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
      const color = d.category === 'Plumbing' ? 'primary' : d.category === 'Electricals' ? 'success' : 'warning';

      rootElement.querySelector('#dealer-profile-drawer .flex.items-center.gap-3').innerHTML = \`
        <div class="w-10 h-10 rounded-full bg-\${color}/10 flex items-center justify-center">
          <span class="text-sm font-bold text-\${color}">\${initials}</span>
        </div>
        <div>
          <h3 class="text-base font-semibold text-text">\${d.name}</h3>
          <p class="text-xs text-gray-400">Dealer since 2024 · GST: \${d.gstin || '-'}</p>
        </div>
      \`;

      rootElement.querySelector('#dealer-profile-content').innerHTML = \`
        <div class="bg-gray-50/60 rounded-xl border border-border p-4">
          <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Company Information</h4>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-xs text-gray-400">Firm Name</p>
              <p class="font-medium text-text">\${d.company || '-'}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Phone</p>
              <p class="font-medium text-text">\${d.phone}</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-gray-400">Address</p>
              <p class="font-medium text-text">\${d.address || '-'}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">GST</p>
              <p class="font-mono text-xs text-text">\${d.gstin || '-'}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Contact Person</p>
              <p class="font-mono text-xs text-text">\${d.contactPerson || '-'}</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50/60 rounded-xl border border-border p-4">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Outstanding Ledger</h4>
            <span class="text-sm font-bold text-warning">₹\${d.outstanding || 0}</span>
          </div>
          <div class="space-y-2">
            <!-- Mock pending purchases for now -->
            <div class="flex items-center justify-between text-sm p-2 rounded-lg bg-white/60 border border-border text-center text-gray-400">
              No recent purchases found.
            </div>
          </div>
        </div>
      \`;

      closeAll();
      overlay.classList.remove('opacity-0', 'pointer-events-none');
      overlay.classList.add('opacity-100');
      profileDrawer.classList.remove('translate-x-full');
    });
  };

  window.addEventListener('openDealerForm', openForm);
  window.addEventListener('openDealerProfile', openProfile);
  
  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);
}
