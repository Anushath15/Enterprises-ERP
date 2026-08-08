import { NotificationService } from '../services/notificationService.js';
import { DataProvider } from '../services/dataProvider.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export async function render() {
  const users = DataProvider.getUsers() || [];

  const renderRow = (usr) => {
    return `
    <tr class="row-hover cursor-pointer" data-user-row="${escapeHtml(usr.id)}">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(usr.id || '-')}</td>
      <td class="px-4 py-3.5">
        <p class="text-sm font-medium text-text">${escapeHtml(usr.name || '-')}</p>
        <p class="text-[10px] text-gray-400">${escapeHtml(usr.phone || '-')}</p>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(usr.role || '-')}</td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(usr.department || '-')}</td>
      <td class="px-4 py-3.5 text-right font-medium text-text">${escapeHtml(usr.salary || '-')}</td>
      <td class="px-4 py-3.5 text-right text-sm text-gray-500">${escapeHtml(usr.joiningDate || '-')}</td>
      <td class="px-4 py-3.5 text-right">
        <button class="edit-user-btn p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-id="${escapeHtml(usr.id)}">
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
          <h1 class="text-2xl font-bold text-text">Staff Management</h1>
          <p class="text-sm text-gray-400 mt-1">Manage employee records (Name, Phone, Dept, Salary, etc).</p>
        </div>
        <div class="flex items-center gap-2">
          <button data-user-new class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i>
            Add Employee
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="user-search" placeholder="Search by name, phone..."
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
        </div>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[900px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">ID</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Employee Name</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Role</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Department</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Salary</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Joining Date</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="user-tbody" class="divide-y divide-border">
              ${users.length > 0 ? users.map(renderRow).join('') : '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No records found.</td></tr>'}
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
        <h3 class="text-base font-semibold text-text" id="user-drawer-title">Employee Record</h3>
        <button class="close-user-drawer p-1.5 rounded-md hover:bg-gray-100">
          <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
        </button>
      </div>
      <div class="p-6 flex-1 overflow-y-auto space-y-5">
        <form id="user-form">
          <input type="hidden" id="usr-id">
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Employee Name *</label><input type="text" id="usr-name" required placeholder="Full name" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
            <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Phone Number</label><input type="text" id="usr-phone" placeholder="+91 " class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Role *</label><input type="text" id="usr-role" required placeholder="e.g. Sales Executive" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
            <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Department</label><input type="text" id="usr-department" placeholder="e.g. Sales" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Salary (₹)</label><input type="number" id="usr-salary" placeholder="15000" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
            <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Joining Date</label><input type="date" id="usr-joining" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
          </div>

          <div class="mb-4">
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Address</label>
            <textarea id="usr-address" rows="2" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></textarea>
          </div>

          <div class="mb-4">
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Notes</label>
            <textarea id="usr-notes" rows="2" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></textarea>
          </div>
        </form>
      </div>
      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button class="close-user-drawer px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button id="save-users-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">Save Record</button>
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
  
  let allUsers = DataProvider.getUsers() || [];
  const overlay = rootElement.querySelector('#user-drawer-overlay');
  const formDrawer = rootElement.querySelector('#user-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-user-drawer');
  const tbody = rootElement.querySelector('#user-tbody');
  const searchInput = rootElement.querySelector('#user-search');

  const renderRow = (usr) => {
    return `<tr class="row-hover cursor-pointer" data-user-row="${escapeHtml(usr.id)}">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(usr.id || '-')}</td>
      <td class="px-4 py-3.5"><p class="text-sm font-medium text-text">${escapeHtml(usr.name || '-')}</p><p class="text-[10px] text-gray-400">${escapeHtml(usr.phone || '-')}</p></td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(usr.role || '-')}</td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(usr.department || '-')}</td>
      <td class="px-4 py-3.5 text-right font-medium text-text">${escapeHtml(usr.salary || '-')}</td>
      <td class="px-4 py-3.5 text-right text-sm text-gray-500">${escapeHtml(usr.joiningDate || '-')}</td>
      <td class="px-4 py-3.5 text-right"><button class="edit-user-btn p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-id="${escapeHtml(usr.id)}"><i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i></button></td>
    </tr>`;
  };

  const handleSearch = () => {
    const q = searchInput.value.toLowerCase();
    const filtered = allUsers.filter(u => (u.name || '').toLowerCase().includes(q) || (u.phone || '').toLowerCase().includes(q));
    if (tbody) {
      tbody.innerHTML = filtered.length > 0 ? filtered.map(renderRow).join('') : '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No records match your search</td></tr>';
      if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
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
        if (title) title.textContent = 'Edit Employee Record';
        rootElement.querySelector('#usr-id').value = usr.id;
        rootElement.querySelector('#usr-name').value = usr.name || '';
        rootElement.querySelector('#usr-phone').value = usr.phone || '';
        rootElement.querySelector('#usr-role').value = usr.role || '';
        rootElement.querySelector('#usr-department').value = usr.department || '';
        rootElement.querySelector('#usr-salary').value = usr.salary || '';
        rootElement.querySelector('#usr-joining').value = usr.joiningDate || '';
        rootElement.querySelector('#usr-address').value = usr.address || '';
        rootElement.querySelector('#usr-notes').value = usr.notes || '';
      }
    } else {
      if (title) title.textContent = 'Add Employee';
    }

    closeAll();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  safeWindowAdd('openUserDrawer', openForm);
  const handleNewUser = () => openForm({ detail: null });
  rootElement.querySelector('[data-user-new]')?.addEventListener('click', handleNewUser);

  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);

  const handleRowClick = (e) => {
    const editBtn = e.target.closest('.edit-user-btn');
    const row = editBtn ? editBtn.closest('tr') : e.target.closest('[data-user-row]');
    if (!row) return;
    const id = editBtn ? editBtn.getAttribute('data-id') : row.getAttribute('data-user-row');
    if (id) openForm({ detail: id });
  };
  if (tbody) tbody.addEventListener('click', handleRowClick);

  const saveBtn = rootElement.querySelector('#save-users-btn');
  const handleSave = () => {
    const form = rootElement.querySelector('#user-form');
    if (!form.reportValidity()) return;

      const usr = {
        id: rootElement.querySelector('#usr-id').value || null,
        name: rootElement.querySelector('#usr-name').value.trim(),
        phone: rootElement.querySelector('#usr-phone').value.trim(),
        role: rootElement.querySelector('#usr-role').value,
        department: rootElement.querySelector('#usr-department').value,
        salary: rootElement.querySelector('#usr-salary').value,
        joiningDate: rootElement.querySelector('#usr-joining').value,
        address: rootElement.querySelector('#usr-address').value,
        notes: rootElement.querySelector('#usr-notes').value
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
        NotificationService.success('Employee record saved successfully!');
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
    

    window.removeEventListener('openUserDrawer', openForm);
    if (searchInput) searchInput.removeEventListener('input', handleSearch);
    if (tbody) tbody.removeEventListener('click', handleRowClick);
    rootElement.querySelector('[data-user-new]')?.removeEventListener('click', handleNewUser);
    closeBtns.forEach(btn => btn.removeEventListener('click', closeAll));
    overlay.removeEventListener('click', closeAll);
    if (saveBtn) saveBtn.removeEventListener('click', handleSave);
  };
}
