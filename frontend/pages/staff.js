/**
 * Senthil Enterprises ERP - Staff Management
 */
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const staff = DataProvider.getStaff() || [];

  const renderRow = (emp) => {
    let badge = 'success';
    if (emp.status === 'On Leave') badge = 'warning';
    if (emp.status === 'Inactive') badge = 'danger';

    return \`
    <tr class="row-hover cursor-pointer" onclick="window.dispatchEvent(new CustomEvent('openStaffDrawer'))">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">\${emp.id || '-'}</td>
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-xs font-bold text-primary">\${(emp.name || '-').charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-text">\${emp.name || '-'}</p>
            <p class="text-[10px] text-gray-400">\${emp.phone || '-'}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600">\${emp.role || '-'}</td>
      <td class="px-4 py-3.5 text-right font-medium text-text">\${emp.salary || '-'}</td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-\${badge}/10 text-\${badge} uppercase tracking-wider">\${emp.status || 'Active'}</span>
      </td>
      <td class="px-4 py-3.5 text-right">
        <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('openStaffDrawer'))">
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
          <h1 class="text-2xl font-bold text-text">Staff Management</h1>
          <p class="text-sm text-gray-400 mt-1">Manage shop employees, roles, salaries, and attendance records.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.dispatchEvent(new CustomEvent('openStaffDrawer'))" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Add Staff
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden">
        <div class="p-4 border-b border-border flex items-center justify-between bg-gray-50/50">
          <div class="relative w-72">
            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input type="text" placeholder="Search staff..." class="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary">
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
            <tbody class="divide-y divide-border">
              \${staff.length > 0 ? staff.map(renderRow).join('') : '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No staff found.</td></tr>'}
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
        <h3 class="text-base font-semibold text-text">Staff Profile</h3>
        <button class="close-staff-drawer p-1.5 rounded-md hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="p-6 flex-1 overflow-y-auto space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Emp ID (Auto)</label><input type="text" value="EMP-005" disabled class="w-full px-3 py-2.5 bg-gray-100 border border-border rounded-lg text-sm text-gray-500"></div>
          <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Full Name</label><input type="text" placeholder="e.g. Ramesh" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
        </div>
        <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Contact Number</label><input type="text" placeholder="+91 " class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
        <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Role</label>
          <select class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            <option>Store Manager</option><option>Sales Executive</option><option>Delivery Driver</option><option>Helper</option>
          </select>
        </div>
        <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Base Salary (₹)</label><input type="number" placeholder="15000" class="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></div>
        <div><label class="text-xs font-medium text-gray-500 block mb-1.5">System Access / Permissions (Placeholder)</label>
          <div class="p-4 bg-gray-50 border border-border rounded-lg text-sm text-gray-500">Access control will be managed in User Settings.</div>
        </div>
        <div><label class="text-xs font-medium text-gray-500 block mb-1.5">Attendance (Placeholder)</label>
          <div class="p-4 bg-gray-50 border border-border rounded-lg text-sm text-gray-500">Attendance tracking integration goes here.</div>
        </div>
      </div>
      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button class="close-staff-drawer px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">Save Details</button>
      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  const overlay = rootElement.querySelector('#staff-drawer-overlay');
  const formDrawer = rootElement.querySelector('#staff-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-staff-drawer');

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

  window.addEventListener('openStaffDrawer', openForm);
  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);
}
