/**
 * Senthil Enterprises ERP - Delivery Management
 * FIXES: D-001 real save (DataProvider.saveDelivery), D-002 fake data removed,
 *        D-003 status tabs wired, D-004 search wired, D-005 row click pre-fills form
 */
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';

export async function render() {
  const deliveries = DataProvider.getDeliveries() || [];
  const staff = DataProvider.getStaff() || [];

  const renderRow = (del) => {
    let statusColor = 'primary';
    if (del.status === 'Pending') statusColor = 'warning';
    if (del.status === 'Completed') statusColor = 'success';
    if (del.status === 'Failed' || del.status === 'Returned') statusColor = 'danger';

    return `
    <tr class="row-hover cursor-pointer" data-id="${del.id}" onclick="window.dispatchEvent(new CustomEvent('openDeliveryDrawer', {detail: '${del.id}'}))">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${del.id || '-'}</td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${del.invoice || '-'}</td>
      <td class="px-4 py-3.5">
        <p class="text-sm font-medium text-text">${del.customer || '-'}</p>
        <p class="text-[10px] text-gray-400">${del.phone || '-'}</p>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-500 max-w-[200px] truncate" title="${del.address || '-'}">${del.address || '-'}</td>
      <td class="px-4 py-3.5 text-sm font-medium text-text">${del.person || '-'}</td>
      <td class="px-4 py-3.5 text-right font-semibold text-text">₹${(del.charge || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-${statusColor}/10 text-${statusColor} uppercase tracking-wider">${del.status || 'Pending'}</span>
      </td>
      <td class="px-4 py-3.5 text-right">
        <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('openDeliveryDrawer', {detail: '${del.id}'}))">
          <i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>`;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Delivery Management</h1>
          <p class="text-sm text-gray-400 mt-0.5">Manage product deliveries, assign delivery personnel, and track logistics.</p>
        </div>
        <button onclick="window.dispatchEvent(new CustomEvent('openDeliveryDrawer', {detail: null}))" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
          <i data-lucide="plus" class="w-4 h-4"></i> New Delivery
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${KPICard({ title: 'Pending', value: deliveries.filter(d => d.status === 'Pending').length.toString(), iconSvg: '<i data-lucide="package"></i>', color: 'warning' })}
        ${KPICard({ title: 'In Transit', value: deliveries.filter(d => d.status === 'In Transit').length.toString(), iconSvg: '<i data-lucide="truck"></i>', color: 'primary' })}
        ${KPICard({ title: 'Completed', value: deliveries.filter(d => d.status === 'Completed').length.toString(), iconSvg: '<i data-lucide="check-circle"></i>', color: 'success' })}
        ${KPICard({ title: 'Charges Collected', value: '₹' + deliveries.reduce((sum, d) => sum + (d.charge || 0), 0).toLocaleString('en-IN'), iconSvg: '<i data-lucide="indian-rupee"></i>', color: 'primary' })}
      </div>

      <!-- Filter Bar -->
      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="del-search" placeholder="Search by ID, customer, invoice..."
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
        </div>
        <div class="flex items-center gap-1 border border-border rounded-lg overflow-hidden bg-gray-50">
          <button class="del-tab-btn px-4 py-2 text-xs font-semibold bg-primary text-white transition-colors" data-status="">All</button>
          <button class="del-tab-btn px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors" data-status="Pending">Pending</button>
          <button class="del-tab-btn px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors" data-status="In Transit">In Transit</button>
          <button class="del-tab-btn px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors" data-status="Completed">Completed</button>
        </div>
        <span id="del-count-label" class="text-xs text-gray-400 ml-auto">Showing ${deliveries.length} deliveries</span>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1100px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Delivery ID</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Invoice</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Customer</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Address</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Driver</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Charge</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="delivery-tbody" class="divide-y divide-border">
              ${deliveries.length > 0 ? deliveries.map(renderRow).join('') : '<tr><td colspan="8" class="px-4 py-12 text-center text-gray-400 text-sm">No deliveries found. Create your first delivery request.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Overlay -->
    <div id="delivery-drawer-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] opacity-0 pointer-events-none transition-opacity duration-300"></div>

    <!-- Drawer -->
    <aside id="delivery-form-drawer" class="fixed top-0 right-0 h-screen w-[520px] bg-white border-l border-border z-[70] shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300">
      <div class="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary/10 rounded-lg text-primary">
            <i data-lucide="truck" class="w-4 h-4"></i>
          </div>
          <h3 class="text-base font-bold text-text" id="del-drawer-title">Delivery Request</h3>
        </div>
        <button class="close-delivery-drawer p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto space-y-4">
        <form id="delivery-form" class="space-y-4">
          <input type="hidden" id="del-id">

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Linked Invoice</label>
              <input type="text" id="del-invoice" placeholder="INV-..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Delivery Date *</label>
              <input type="date" id="del-date" required class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Customer Name *</label>
            <input type="text" id="del-customer" required placeholder="Customer name..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Phone</label>
              <input type="text" id="del-phone" placeholder="+91..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Delivery Charge (₹)</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                <input type="number" id="del-charge" placeholder="0" min="0" class="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm font-semibold text-text focus:outline-none focus:border-primary">
              </div>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Delivery Address *</label>
            <textarea id="del-address" required rows="2" placeholder="Full delivery address..." class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Delivery Person</label>
              <input type="text" id="del-person" placeholder="Name / vehicle..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" list="del-staff-list">
              <datalist id="del-staff-list">
                ${staff.map(s => `<option value="${s.name}">`).join('')}
              </datalist>
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Delivery Status *</label>
              <select id="del-status" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                <option>Pending</option>
                <option>In Transit</option>
                <option>Completed</option>
                <option>Failed</option>
                <option>Returned</option>
              </select>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Driver Notes</label>
            <textarea id="del-notes" rows="2" placeholder="Call customer before arriving. Unload at back gate." class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"></textarea>
          </div>
        </form>
      </div>

      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button class="close-delivery-drawer px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button id="save-delivery-btn" class="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center gap-2 transition-colors">
          <i data-lucide="save" class="w-4 h-4"></i> Save Delivery
        </button>
      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();

  const allDeliveries = DataProvider.getDeliveries() || [];
  const overlay = rootElement.querySelector('#delivery-drawer-overlay');
  const formDrawer = rootElement.querySelector('#delivery-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-delivery-drawer');
  const tbody = rootElement.querySelector('#delivery-tbody');
  const delSearch = rootElement.querySelector('#del-search');
  const countLabel = rootElement.querySelector('#del-count-label');

  let activeStatus = '';

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  const renderRow = (del) => {
    let sc = 'primary';
    if (del.status === 'Pending') sc = 'warning';
    if (del.status === 'Completed') sc = 'success';
    if (del.status === 'Failed' || del.status === 'Returned') sc = 'danger';
    return `<tr class="row-hover cursor-pointer" data-id="${del.id}" onclick="window.dispatchEvent(new CustomEvent('openDeliveryDrawer', {detail: '${del.id}'}))">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${del.id || '-'}</td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${del.invoice || '-'}</td>
      <td class="px-4 py-3.5"><p class="text-sm font-medium text-text">${del.customer || '-'}</p><p class="text-[10px] text-gray-400">${del.phone || '-'}</p></td>
      <td class="px-4 py-3.5 text-sm text-gray-500 max-w-[200px] truncate">${del.address || '-'}</td>
      <td class="px-4 py-3.5 text-sm font-medium text-text">${del.person || '-'}</td>
      <td class="px-4 py-3.5 text-right font-semibold text-text">₹${(del.charge || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3.5"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-${sc}/10 text-${sc} uppercase tracking-wider">${del.status || 'Pending'}</span></td>
      <td class="px-4 py-3.5 text-right"><button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('openDeliveryDrawer', {detail: '${del.id}'}))"><i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i></button></td>
    </tr>`;
  };

  const applyFilter = () => {
    const q = (delSearch?.value || '').toLowerCase();
    const filtered = allDeliveries.filter(d => {
      if (activeStatus && d.status !== activeStatus) return false;
      if (q && !(d.id || '').toLowerCase().includes(q) && !(d.customer || '').toLowerCase().includes(q) && !(d.invoice || '').toLowerCase().includes(q)) return false;
      return true;
    });
    if (countLabel) countLabel.textContent = `Showing ${filtered.length} of ${allDeliveries.length} deliveries`;
    if (tbody) {
      tbody.innerHTML = filtered.length > 0
        ? filtered.map(renderRow).join('')
        : '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-400 text-sm">No deliveries match your filter</td></tr>';
      if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
    }
  };

  // Tab filter buttons
  rootElement.querySelectorAll('.del-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeStatus = btn.getAttribute('data-status');
      rootElement.querySelectorAll('.del-tab-btn').forEach(b => {
        b.classList.remove('bg-primary', 'text-white');
        b.classList.add('text-gray-600');
      });
      btn.classList.add('bg-primary', 'text-white');
      btn.classList.remove('text-gray-600');
      applyFilter();
    });
  });
  if (delSearch) delSearch.addEventListener('input', applyFilter);

  const openForm = (e) => {
    const id = e.detail;
    const form = rootElement.querySelector('#delivery-form');
    const title = rootElement.querySelector('#del-drawer-title');
    if (form) form.reset();

    const today = new Date().toISOString().split('T')[0];
    rootElement.querySelector('#del-date').value = today;

    if (id) {
      const del = allDeliveries.find(d => d.id === id);
      if (del) {
        rootElement.querySelector('#del-id').value = del.id;
        rootElement.querySelector('#del-invoice').value = del.invoice || '';
        rootElement.querySelector('#del-date').value = del.date || today;
        rootElement.querySelector('#del-customer').value = del.customer || '';
        rootElement.querySelector('#del-phone').value = del.phone || '';
        rootElement.querySelector('#del-charge').value = del.charge || '';
        rootElement.querySelector('#del-address').value = del.address || '';
        rootElement.querySelector('#del-person').value = del.person || '';
        rootElement.querySelector('#del-status').value = del.status || 'Pending';
        rootElement.querySelector('#del-notes').value = del.notes || '';
        if (title) title.textContent = 'Edit Delivery';
      }
    } else {
      if (title) title.textContent = 'New Delivery Request';
    }

    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  window.addEventListener('openDeliveryDrawer', openForm);
  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);

  // Real save (D-001)
  rootElement.querySelector('#save-delivery-btn')?.addEventListener('click', () => {
    const form = rootElement.querySelector('#delivery-form');
    if (!form.reportValidity()) return;

    const delivery = {
      id: rootElement.querySelector('#del-id').value || null,
      invoice: rootElement.querySelector('#del-invoice').value.trim(),
      date: rootElement.querySelector('#del-date').value,
      customer: rootElement.querySelector('#del-customer').value.trim(),
      phone: rootElement.querySelector('#del-phone').value.trim(),
      charge: Number(rootElement.querySelector('#del-charge').value) || 0,
      address: rootElement.querySelector('#del-address').value.trim(),
      person: rootElement.querySelector('#del-person').value.trim(),
      status: rootElement.querySelector('#del-status').value,
      notes: rootElement.querySelector('#del-notes').value.trim()
    };

    try {
      const saved = DataProvider.saveDelivery(delivery);
      const existingIdx = allDeliveries.findIndex(d => d.id === saved.id);
      if (existingIdx > -1) allDeliveries[existingIdx] = saved;
      else allDeliveries.unshift(saved);

      closeAll();
      applyFilter();
      window.showToast('Delivery saved!', 'success');
    } catch (err) {
      window.showToast(err.message, 'danger');
    }
  });

  return function cleanup() {
    window.removeEventListener('openDeliveryDrawer', openForm);
  };
}
