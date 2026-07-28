/**
 * Senthil Enterprises ERP - User Management
 */
import { DataProvider } from '../services/dataProvider.js';

export async function render() {
  const users = DataProvider.getUsers() || [];


  const renderRow = (usr) => {
    let badge = 'success';
    if (usr.status === 'Suspended') badge = 'danger';

    return `
    <tr class="row-hover cursor-pointer" data-id="${usr.id}" onclick="window.dispatchEvent(new CustomEvent('openUserDrawer', {detail: '${usr.id}'}))">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${usr.id || '-'}</td>
      <td class="px-4 py-3.5">
        <p class="text-sm font-medium text-text">${usr.name || '-'}</p>
        <p class="text-[10px] text-gray-400">@${usr.username || '-'}</p>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${usr.role || '-'}</td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-${badge}/10 text-${badge} uppercase tracking-wider">${usr.status || 'Active'}</span>
      </td>
        <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('openUserDrawer', {detail: '${usr.id}'}))">
          <i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>
    `;
  };

  return `
    <div class="p-6 max-w-[1200px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">User Management</h1>
          <p class="text-sm text-gray-400 mt-1">Manage system access, user roles, and login credentials.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.dispatchEvent(new CustomEvent('openUserDrawer', {detail: null}))" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Add System User
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="user-search" placeholder="Search by name, username..."
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
        </div>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[800px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">User ID</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Name / Username</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">System Role</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Account Status</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="user-tbody" class="divide-y divide-border">
              ${users.length > 0 ? users.map(renderRow).join('') : '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No users found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Drawer Overlay -->
    <div id="user-drawer-overlay" class="overlay fixed inset-0 bg-black/30 z-[60] opacity-0 pointer-events-none transition-opacity duration-200"></div>
    
    <!-- Drawer -->
    <aside id="user-form-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[500px] bg-white border-l border-border z-[70] overflow-y-auto shadow-2xl transition-transform duration-250 flex flex-col">
      <div class="flex items-center justify-between px-6 h-16 border-b border-border sticky top-0 bg-white z-10">
        <h3 class="text-base font-semibold text-text" id="user-drawer-title">System User Account</h3>
        <button class="close-user-drawer p-1.5 rounded-md hover:bg-gray-100">
          <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
        </button>
      </div>
      <div class="p-6 flex-1 overflow-y-auto space-y-5">
        <form id="user-form">
          <input type="hidden" id="usr-id">
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Full Name *</label><input type="text" id="usr-name" required placeholder="Display name" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
            <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Username (Login ID) *</label><input type="text" id="usr-username" required placeholder="e.g. jdoe" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
          </div>

          <div class="mb-4">
            <label class="text-xs font-medium text-gray-500 block mb-1.5">System Role *</label>
            <select id="usr-role" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
              <option>Administrator (Full Access)</option><option>Manager (Can edit, cannot delete)</option><option>Sales User (Billing only)</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Account Status *</label>
            <select id="usr-status" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
              <option>Active</option><option>Suspended</option>
            </select>
          </div>
        </form>
        
        <div class="pt-4 border-t border-border">
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Permissions (Placeholder)</label>
          <div class="p-4 bg-gray-50 border border-border rounded-lg text-sm text-gray-500 mb-4">Granular checkboxes for read/write access per module will render here.</div>
          
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Security (Placeholder)</label>
          <button class="w-full py-2 bg-gray-100 border border-border text-text text-sm rounded-lg hover:bg-gray-200">Reset User Password</button>
        </div>

      </div>
      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button class="close-user-drawer px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button id="save-users-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">Save Account</button>
      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();
  
  let allUsers = DataProvider.getUsers() || [];
  const overlay = rootElement.querySelector('#user-drawer-overlay');
  const formDrawer = rootElement.querySelector('#user-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-user-drawer');
  const tbody = rootElement.querySelector('#user-tbody');
  const searchInput = rootElement.querySelector('#user-search');

  const renderRow = (usr) => {
    let badge = 'success';
    if (usr.status === 'Suspended') badge = 'danger';
    return `<tr class="row-hover cursor-pointer" data-id="${usr.id}" onclick="window.dispatchEvent(new CustomEvent('openUserDrawer', {detail: '${usr.id}'}))">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${usr.id || '-'}</td>
      <td class="px-4 py-3.5"><p class="text-sm font-medium text-text">${usr.name || '-'}</p><p class="text-[10px] text-gray-400">@${usr.username || '-'}</p></td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${usr.role || '-'}</td>
      <td class="px-4 py-3.5"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-${badge}/10 text-${badge} uppercase tracking-wider">${usr.status || 'Active'}</span></td>
      <td class="px-4 py-3.5 text-right"><button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('openUserDrawer', {detail: '${usr.id}'}))"><i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i></button></td>
    </tr>`;
  };

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      const filtered = allUsers.filter(u => (u.name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q));
      if (tbody) {
        tbody.innerHTML = filtered.length > 0 ? filtered.map(renderRow).join('') : '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">No users match your search</td></tr>';
        if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
      }
    });
  }

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  const openForm = (e) => {
    const id = e.detail;
    const form = rootElement.querySelector('#user-form');
    const title = rootElement.querySelector('#user-drawer-title');
    if (form) form.reset();

    if (id) {
      const usr = allUsers.find(u => u.id === id);
      if (usr) {
        if (title) title.textContent = 'Edit System User';
        rootElement.querySelector('#usr-id').value = usr.id;
        rootElement.querySelector('#usr-name').value = usr.name || '';
        rootElement.querySelector('#usr-username').value = usr.username || '';
        rootElement.querySelector('#usr-role').value = usr.role || 'Sales User (Billing only)';
        rootElement.querySelector('#usr-status').value = usr.status || 'Active';
      }
    } else {
      if (title) title.textContent = 'Add System User';
    }

    closeAll();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  window.addEventListener('openUserDrawer', openForm);

  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);

  const saveBtn = rootElement.querySelector('#save-users-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const form = rootElement.querySelector('#user-form');
      if (!form.reportValidity()) return;

      const usr = {
        id: rootElement.querySelector('#usr-id').value || null,
        name: rootElement.querySelector('#usr-name').value.trim(),
        username: rootElement.querySelector('#usr-username').value.trim(),
        role: rootElement.querySelector('#usr-role').value,
        status: rootElement.querySelector('#usr-status').value
      };

      try {
        const saved = DataProvider.saveUser(usr);
        const existingIdx = allUsers.findIndex(u => u.id === saved.id);
        if (existingIdx > -1) allUsers[existingIdx] = saved;
        else allUsers.unshift(saved);
        
        closeAll();
        if (tbody) {
          tbody.innerHTML = allUsers.map(renderRow).join('');
          if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
        }
        window.showToast('User saved successfully!', 'success');
      } catch (err) {
        window.showToast(err.message, 'danger');
      }
    });
  }

  return function cleanup() {
    window.removeEventListener('openUserDrawer', openForm);
  };
}

