import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Staff Management
 */
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export async function render() {
  const staff = DataProvider.getStaff() || [];

  const renderRow = (emp) => {
    let badge = 'success';
    if (emp.status === 'On Leave') badge = 'warning';
    if (emp.status === 'Inactive') badge = 'danger';

    return `
    <tr class="row-hover cursor-pointer" data-staff-row="${escapeHtml(emp.id)}">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(emp.id || '-')}</td>
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-xs font-bold text-primary">${escapeHtml((emp.name || '-').charAt(0).toUpperCase())}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-text">${escapeHtml(emp.name || '-')}</p>
            <p class="text-[10px] text-gray-400">${escapeHtml(emp.phone || '-')}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(emp.role || '-')}</td>
      <td class="px-4 py-3.5 text-right font-medium text-text">${escapeHtml(emp.salary || '-')}</td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-${badge}/10 text-${badge} uppercase tracking-wider">${escapeHtml(emp.status || 'Active')}</span>
      </td>
      <td class="px-4 py-3.5 text-right">
        <button class="edit-staff-btn p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-id="${escapeHtml(emp.id)}">
          <i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>
    `;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Staff Management</h1>
          <p class="text-sm text-gray-400 mt-1">Manage shop employees, roles, salaries, and attendance records.</p>
        </div>
        <div class="flex items-center gap-2">
          <button data-staff-new class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Add Staff
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden">
        <div class="p-4 border-b border-border flex items-center justify-between bg-gray-50/50">
          <div class="relative w-72">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input type="text" id="staff-search" placeholder="Search staff..." class="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary">
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1000px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Emp ID</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Staff Name</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Role</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Base Salary</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="staff-tbody" class="divide-y divide-border">
              ${staff.length > 0 ? staff.map(renderRow).join('') : '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No staff found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Drawer Overlay -->
    <div id="staff-drawer-overlay" class="overlay fixed inset-0 bg-black/30 z-[60] opacity-0 pointer-events-none transition-opacity duration-200"></div>
    
    <!-- Drawer -->
    <aside id="staff-form-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[500px] bg-white border-l border-border z-[70] overflow-y-auto shadow-2xl transition-transform duration-250 flex flex-col">
      <div class="flex items-center justify-between px-6 h-16 border-b border-border sticky top-0 bg-white z-10">
        <h3 class="text-base font-semibold text-text" id="staff-drawer-title">Staff Profile</h3>
        <button class="close-staff-drawer p-1.5 rounded-md hover:bg-gray-100">
          <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
        </button>
      </div>
      <div class="p-6 flex-1 overflow-y-auto space-y-5">
        <form id="staff-form">
          <input type="hidden" id="staff-id">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Full Name *</label><input type="text" id="staff-name" required placeholder="e.g. Ramesh" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
            <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Contact Number</label><input type="text" id="staff-phone" placeholder="+91 " class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Role *</label>
              <select id="staff-role" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
                <option>Store Manager</option><option>Sales Executive</option><option>Delivery Driver</option><option>Helper</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Status *</label>
              <select id="staff-status" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
                <option>Active</option><option>On Leave</option><option>Inactive</option>
              </select>
            </div>
          </div>
          <div class="mb-4"><label class="text-xs font-medium text-gray-500 block mb-1.5">Base Salary (₹)</label><input type="number" id="staff-salary" placeholder="15000" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
        </form>
      </div>
      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button class="close-staff-drawer px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button id="save-staff-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">Save Details</button>
      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  const __listeners = [];
  const safeRootAdd = (type, listener, options) => {
    __listeners.push({ target: rootElement, type, listener, options });
    rootElement.addEventListener(type, listener, options);
  };
  const trackedWindowDoc = [];
  const safeWindowAdd = (type, listener, options) => {
    trackedWindowDoc.push({ target: window, type, listener, options });
    window.addEventListener(type, listener, options);
  };
  const safeDocAdd = (type, listener, options) => {
    trackedWindowDoc.push({ target: document, type, listener, options });
    document.addEventListener(type, listener, options);
  };
  
  if (window.lucide) window.lucide.createIcons();

  let allStaff = DataProvider.getStaff() || [];
  const overlay = rootElement.querySelector('#staff-drawer-overlay');
  const formDrawer = rootElement.querySelector('#staff-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-staff-drawer');
  const tbody = rootElement.querySelector('#staff-tbody');
  const searchInput = rootElement.querySelector('#staff-search');

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  const renderRow = (emp) => {
    let badge = 'success';
    if (emp.status === 'On Leave') badge = 'warning';
    if (emp.status === 'Inactive') badge = 'danger';
    return `<tr class="row-hover cursor-pointer" data-staff-row="${escapeHtml(emp.id)}">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(emp.id || '-')}</td>
      <td class="px-4 py-3.5"><div class="flex items-center gap-2.5"><div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><span class="text-xs font-bold text-primary">${escapeHtml((emp.name || '-').charAt(0).toUpperCase())}</span></div><div><p class="text-sm font-medium text-text">${escapeHtml(emp.name || '-')}</p><p class="text-[10px] text-gray-400">${escapeHtml(emp.phone || '-')}</p></div></div></td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(emp.role || '-')}</td>
      <td class="px-4 py-3.5 text-right font-medium text-text">${escapeHtml(emp.salary || '-')}</td>
      <td class="px-4 py-3.5"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-${badge}/10 text-${badge} uppercase tracking-wider">${escapeHtml(emp.status || 'Active')}</span></td>
      <td class="px-4 py-3.5 text-right"><button class="edit-staff-btn p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-id="${escapeHtml(emp.id)}"><i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i></button></td>
    </tr>`;
  };

  const handleSearch = () => {
    const q = searchInput.value.toLowerCase();
    const filtered = allStaff.filter(s => (s.name || '').toLowerCase().includes(q) || (s.role || '').toLowerCase().includes(q));
    if (tbody) {
      tbody.innerHTML = filtered.length > 0 ? filtered.map(renderRow).join('') : '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No staff match your search</td></tr>';
      if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  const openForm = (e) => {
    const id = e.detail;
    const form = rootElement.querySelector('#staff-form');
    const title = rootElement.querySelector('#staff-drawer-title');
    if (form) form.reset();

    if (id) {
      const emp = allStaff.find(s => s.id === id);
      if (emp) {
        if (title) title.textContent = 'Edit Staff Profile';
        rootElement.querySelector('#staff-id').value = emp.id;
        rootElement.querySelector('#staff-name').value = emp.name || '';
        rootElement.querySelector('#staff-phone').value = emp.phone || '';
        rootElement.querySelector('#staff-role').value = emp.role || 'Sales Executive';
        rootElement.querySelector('#staff-salary').value = emp.salary || '';
        rootElement.querySelector('#staff-status').value = emp.status || 'Active';
      }
    } else {
      if (title) title.textContent = 'Add New Staff';
    }
    
    closeAll();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  safeWindowAdd('openStaffDrawer', openForm);
  const handleNewStaff = () => openForm({ detail: null });
  rootElement.querySelector('[data-staff-new]')?.addEventListener('click', handleNewStaff);
  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);

  const handleRowClick = (e) => {
    const editBtn = e.target.closest('.edit-staff-btn');
    const row = editBtn ? editBtn.closest('tr') : e.target.closest('[data-staff-row]');
    if (!row) return;
    const id = editBtn ? editBtn.getAttribute('data-id') : row.getAttribute('data-staff-row');
    if (id) openForm({ detail: id });
  };
  if (tbody) tbody.addEventListener('click', handleRowClick);

  // Initialize Draft Recovery
  const formEl = rootElement.querySelector('#staff-form');
  if (formEl) DraftManager.init('staff', formEl);

  const saveBtn = rootElement.querySelector('#save-staff-btn');
  const handleSave = () => {
    const form = rootElement.querySelector('#staff-form');
    if (!form.reportValidity()) return;

      const emp = {
        id: rootElement.querySelector('#staff-id').value || null,
        name: rootElement.querySelector('#staff-name').value.trim(),
        phone: rootElement.querySelector('#staff-phone').value.trim(),
        role: rootElement.querySelector('#staff-role').value,
        status: rootElement.querySelector('#staff-status').value,
        salary: rootElement.querySelector('#staff-salary').value
      };

      try {
        const saved = DataProvider.saveStaff(emp);
        DraftManager.clearDraft('staff');
        const existingIdx = allStaff.findIndex(s => s.id === saved.id);
        if (existingIdx > -1) allStaff[existingIdx] = saved;
        else allStaff.unshift(saved);
        
        closeAll();
        if (tbody) {
          tbody.innerHTML = allStaff.map(renderRow).join('');
          if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
        }
        NotificationService.success('Staff saved successfully!');
      } catch (err) {
        NotificationService.error(err.message);
      }
  };
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSave);
  }

  return function cleanup() {
    __listeners.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    trackedWindowDoc.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    

    window.removeEventListener('openStaffDrawer', openForm);
    if (searchInput) searchInput.removeEventListener('input', handleSearch);
    if (tbody) tbody.removeEventListener('click', handleRowClick);
    rootElement.querySelector('[data-staff-new]')?.removeEventListener('click', handleNewStaff);
    closeBtns.forEach(btn => btn.removeEventListener('click', closeAll));
    overlay.removeEventListener('click', closeAll);
    if (saveBtn) saveBtn.removeEventListener('click', handleSave);
  };
}

