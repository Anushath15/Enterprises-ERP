import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Sales Return Management
 * FIXES: SR-001 removed hardcoded fake data, SR-002 real DataProvider.saveSalesReturn,
 *        SR-003 no reload, SR-004 search/filter wired, SR-005 row click pre-fills,
 *        SR-006 Lucide icons (no inline SVG), SR-007 status tabs wired
 */
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';
import { escapeHtml } from '../utils/escapeHtml.js';

const RETURN_REASONS = ['Defective', 'Damaged', 'Wrong Product', 'Changed Mind', 'Quality Issue', 'Other'];

export async function render() {
  const returns = DataProvider.getSalesReturns() || [];
  const customers = DataProvider.getCustomers() || [];

  const renderRow = (ret) => {
    const customer = DataProvider.getCustomerById(ret.customerId) || { name: ret.customerName || 'Unknown', type: '' };
    const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const statusColor = ret.status === 'Pending' ? 'warning' : (ret.status === 'Approved' ? 'success' : 'danger');

    return `
    <tr class="row-hover cursor-pointer" data-id="${escapeHtml(ret.id)}" data-return-row="${escapeHtml(ret.id)}">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(ret.id)}</td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(ret.invoice || '-')}</td>
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-[10px] font-bold text-primary">${escapeHtml(initials)}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-text">${escapeHtml(customer.name)}</p>
            <p class="text-[10px] text-gray-400">${escapeHtml(customer.type || '')}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${ret.items ? ret.items.map(i => escapeHtml(i.name)).join(', ') : escapeHtml(ret.product || '-')}</td>
      <td class="px-4 py-3.5 text-center text-sm text-gray-600">${ret.items ? ret.items.reduce((s, i) => s + Number(i.qty || 0), 0) : (ret.qty || 0)}</td>
      <td class="px-4 py-3.5">
        <span class="status-badge status-danger">${escapeHtml(ret.reason || 'Returned')}</span>
      </td>
      <td class="px-4 py-3.5 text-right text-sm font-semibold text-text">₹${Number(ret.amount || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3.5">
        <span class="status-badge status-${statusColor}">${escapeHtml(ret.status || 'Pending')}</span>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(ret.date ? ret.date.split('T')[0] : '-')}</td>
      <td class="px-4 py-3.5 text-right">
        <button class="return-view-btn p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-id="${escapeHtml(ret.id)}" title="View Return">
          <i data-lucide="eye" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>`;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Sales Return Management</h1>
          <p class="text-sm text-gray-400 mt-0.5">Manage customer returns, refunds, and stock updates.</p>
        </div>
        <button id="btn-new-return" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
          <i data-lucide="plus" class="w-4 h-4"></i> Create Return
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${KPICard({ title: 'Total Returns', value: returns.length.toString(), iconSvg: '<i data-lucide="rotate-ccw"></i>', color: 'primary' })}
        ${KPICard({ title: 'Pending', value: returns.filter(r => r.status === 'Pending').length.toString(), iconSvg: '<i data-lucide="clock"></i>', color: 'warning' })}
        ${KPICard({ title: 'Approved', value: returns.filter(r => r.status === 'Approved').length.toString(), iconSvg: '<i data-lucide="check-circle"></i>', color: 'success' })}
        ${KPICard({ title: 'Refund Value', value: '₹' + returns.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString('en-IN'), iconSvg: '<i data-lucide="credit-card"></i>', color: 'danger' })}
      </div>

      <!-- Search & Filter Bar -->
      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="ret-search" placeholder="Search by ID, customer, invoice..."
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
        </div>
        <select id="ret-status-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <span id="ret-count-label" class="text-xs text-gray-400 ml-auto">Showing ${returns.length} returns</span>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1200px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Return ID</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Invoice</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Customer</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Products</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-center">Qty</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Reason</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Refund</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="returns-tbody" class="divide-y divide-border">
              ${returns.length > 0 ? returns.map(renderRow).join('') : '<tr><td colspan="10" class="px-4 py-12 text-center text-gray-400 text-sm">No returns found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Overlay -->
    <div id="return-drawer-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] opacity-0 pointer-events-none transition-opacity duration-300"></div>

    <!-- Drawer -->
    <aside id="return-form-drawer" class="fixed top-0 right-0 h-screen w-[580px] bg-white border-l border-border z-[70] shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300">
      <div class="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-danger/10 rounded-lg text-danger">
            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
          </div>
          <h3 class="text-base font-bold text-text" id="ret-drawer-title">Create Sales Return</h3>
        </div>
        <button class="close-return-drawer p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto space-y-4">
        <form id="return-form" class="space-y-4">
          <input type="hidden" id="ret-id">
          <input type="hidden" id="ret-product-id">

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Return Date *</label>
              <input type="date" id="ret-date" required class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Original Invoice No.</label>
              <input type="text" id="ret-invoice" placeholder="INV-..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Customer *</label>
            <select id="ret-customer" required class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
              <option value="">Select Customer...</option>
              ${customers.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Product Name *</label>
              <input type="text" id="ret-product" required placeholder="Product returned..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Quantity *</label>
              <input type="number" id="ret-qty" required min="1" value="1" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Refund Amount (₹) *</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
              <input type="number" id="ret-amount" required min="0" placeholder="0.00" class="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm font-bold focus:outline-none focus:border-primary">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Return Reason *</label>
              <select id="ret-reason" required class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                ${RETURN_REASONS.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Status *</label>
              <select id="ret-status" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input type="checkbox" id="ret-restock" checked class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary">
            <label for="ret-restock" class="text-sm font-medium text-text">Restock item into inventory automatically</label>
          </div>
        </form>
      </div>

      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button class="close-return-drawer px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button id="save-return-btn" class="px-5 py-2 text-sm font-semibold text-white bg-danger rounded-lg hover:bg-danger/90 flex items-center gap-2 transition-colors">
          <i data-lucide="save" class="w-4 h-4"></i> Save Return
        </button>
      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();

  const allReturns = DataProvider.getSalesReturns() || [];
  const overlay = rootElement.querySelector('#return-drawer-overlay');
  const formDrawer = rootElement.querySelector('#return-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-return-drawer');
  const tbody = rootElement.querySelector('#returns-tbody');
  const retSearch = rootElement.querySelector('#ret-search');
  const retStatusFilter = rootElement.querySelector('#ret-status-filter');
  const countLabel = rootElement.querySelector('#ret-count-label');

  const today = new Date().toISOString().split('T')[0];
  const retDate = rootElement.querySelector('#ret-date');
  if (retDate) retDate.value = today;

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  const renderRow = (ret) => {
    const customer = DataProvider.getCustomerById(ret.customerId) || { name: ret.customerName || 'Unknown', type: '' };
    const initials = customer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const sc = ret.status === 'Pending' ? 'warning' : (ret.status === 'Approved' ? 'success' : 'danger');
    return `<tr class="row-hover cursor-pointer" data-id="${escapeHtml(ret.id)}" data-return-row="${escapeHtml(ret.id)}">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(ret.id)}</td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(ret.invoice || '-')}</td>
      <td class="px-4 py-3.5"><div class="flex items-center gap-2.5"><div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center"><span class="text-[10px] font-bold text-primary">${escapeHtml(initials)}</span></div><div><p class="text-sm font-medium text-text">${escapeHtml(customer.name)}</p></div></div></td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${ret.items ? ret.items.map(i => escapeHtml(i.name)).join(', ') : escapeHtml(ret.product || '-')}</td>
      <td class="px-4 py-3.5 text-center text-sm text-gray-600">${ret.items ? ret.items.reduce((s, i) => s + Number(i.qty || 0), 0) : (ret.qty || 0)}</td>
      <td class="px-4 py-3.5"><span class="status-badge status-danger">${escapeHtml(ret.reason || '-')}</span></td>
      <td class="px-4 py-3.5 text-right text-sm font-semibold text-text">₹${Number(ret.amount || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3.5"><span class="status-badge status-${sc}">${escapeHtml(ret.status || 'Pending')}</span></td>
      <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(ret.date ? ret.date.split('T')[0] : '-')}</td>
      <td class="px-4 py-3.5 text-right"><button class="return-view-btn p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-id="${escapeHtml(ret.id)}" title="View Return"><i data-lucide="eye" class="w-4 h-4 pointer-events-none"></i></button></td>
    </tr>`;
  };

  // Search & filter (SR-004)
  const applyFilter = () => {
    const q = (retSearch?.value || '').toLowerCase();
    const status = retStatusFilter?.value || '';
    const filtered = allReturns.filter(r => {
      if (status && r.status !== status) return false;
      if (q) {
        const cust = DataProvider.getCustomerById(r.customerId);
        const custName = (cust?.name || r.customerName || '').toLowerCase();
        if (!r.id.toLowerCase().includes(q) && !custName.includes(q) && !(r.invoice || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (countLabel) countLabel.textContent = `Showing ${filtered.length} of ${allReturns.length} returns`;
    if (tbody) {
      tbody.innerHTML = filtered.length > 0 ? filtered.map(renderRow).join('') : '<tr><td colspan="10" class="px-4 py-12 text-center text-gray-400 text-sm">No returns match your filter</td></tr>';
      if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
    }
  };
  if (retSearch) retSearch.addEventListener('input', applyFilter);
  if (retStatusFilter) retStatusFilter.addEventListener('change', applyFilter);

  const openForm = (e) => {
    const id = e.detail;
    const form = rootElement.querySelector('#return-form');
    if (form) form.reset();
    if (id) {
      const ret = allReturns.find(r => r.id === id);
      if (ret) {
        rootElement.querySelector('#ret-id').value = ret.id;
        rootElement.querySelector('#ret-date').value = ret.date ? ret.date.split('T')[0] : today;
        rootElement.querySelector('#ret-invoice').value = ret.invoice || '';
        rootElement.querySelector('#ret-customer').value = ret.customerId || '';
        rootElement.querySelector('#ret-product-id').value = ret.items ? ret.items[0]?.productId : '';
        rootElement.querySelector('#ret-product').value = ret.items ? ret.items[0]?.name : (ret.product || '');
        rootElement.querySelector('#ret-qty').value = ret.items ? ret.items[0]?.qty : (ret.qty || '');
        rootElement.querySelector('#ret-amount').value = ret.amount || '';
        rootElement.querySelector('#ret-reason').value = ret.reason || 'Defective';
        rootElement.querySelector('#ret-status').value = ret.status || 'Pending';
      }
      rootElement.querySelector('#ret-drawer-title').textContent = 'View / Edit Return';
    } else {
      rootElement.querySelector('#ret-id').value = '';
      rootElement.querySelector('#ret-date').value = today;
      rootElement.querySelector('#ret-drawer-title').textContent = 'Create Sales Return';
    }
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  // Fix SR-001: Invoice lookup
  const invoiceInput = rootElement.querySelector('#ret-invoice');
  if (invoiceInput) {
    invoiceInput.addEventListener('blur', () => {
      const invId = invoiceInput.value.trim();
      if (!invId) return;
      const inv = DataProvider.getSalesInvoices().find(i => i.id === invId);
      if (inv) {
        if (inv.customerId) rootElement.querySelector('#ret-customer').value = inv.customerId;
        if (inv.items && inv.items.length === 1) {
          rootElement.querySelector('#ret-product-id').value = inv.items[0].productId || '';
          rootElement.querySelector('#ret-product').value = inv.items[0].name;
          rootElement.querySelector('#ret-qty').value = inv.items[0].qty;
          rootElement.querySelector('#ret-amount').value = (inv.items[0].qty * inv.items[0].price).toFixed(2);
        }
        NotificationService.success('Invoice details loaded');
      }
    });
  }

  window.addEventListener('openReturnDrawer', openForm);
  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);

  // Delegated table clicks (replaces inline onclick)
  const handleTableClick = (e) => {
    const viewBtn = e.target.closest('.return-view-btn');
    if (viewBtn) {
      e.stopPropagation();
      openForm({ detail: viewBtn.getAttribute('data-id') });
      return;
    }
    const row = e.target.closest('[data-return-row]');
    if (row) openForm({ detail: row.getAttribute('data-return-row') });
  };
  tbody.addEventListener('click', handleTableClick);

  const newReturnBtn = rootElement.querySelector('#btn-new-return');
  if (newReturnBtn) newReturnBtn.addEventListener('click', () => openForm({ detail: null }));

  // Initialize Draft Recovery
  const formEl = rootElement.querySelector('#return-form');
  if (formEl) DraftManager.init('salesReturn', formEl);

  // Save (SR-001, SR-002, SR-003)
  rootElement.querySelector('#save-return-btn')?.addEventListener('click', () => {
    const form = rootElement.querySelector('#return-form');
    if (!form.reportValidity()) return;

    const customerId = rootElement.querySelector('#ret-customer').value;
    const productName = rootElement.querySelector('#ret-product').value.trim();
    const qty = Number(rootElement.querySelector('#ret-qty').value) || 1;
    const amount = Number(rootElement.querySelector('#ret-amount').value) || 0;

    const ret = {
      id: rootElement.querySelector('#ret-id').value || null,
      date: rootElement.querySelector('#ret-date').value,
      invoice: rootElement.querySelector('#ret-invoice').value.trim(),
      customerId,
      product: productName,
      qty,
      amount,
      reason: rootElement.querySelector('#ret-reason').value,
      status: rootElement.querySelector('#ret-status').value,
      // Provide items array so DataProvider.saveSalesReturn validates correctly
      items: [{ productId: rootElement.querySelector('#ret-product-id').value, name: productName, qty, price: amount / qty, total: amount }]
    };

    try {
      const saved = DataProvider.saveSalesReturn(ret);
      DraftManager.clearDraft('salesReturn');
      const existingIdx = allReturns.findIndex(r => r.id === saved.id);
      if (existingIdx > -1) allReturns[existingIdx] = saved;
      else allReturns.unshift(saved);

      closeAll();
      applyFilter();
      NotificationService.success('Sales return saved!');
    } catch (err) {
      NotificationService.error(err.message);
    }
  });

  return function cleanup() {
    window.removeEventListener('openReturnDrawer', openForm);
  };
}
