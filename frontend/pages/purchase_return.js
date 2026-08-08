import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Purchase Return Management
 * FIXES: PR-001 removed hardcoded fake data, PR-002 real DataProvider.savePurchaseReturn,
 *        PR-003 no reload, PR-004 search/filter wired, PR-005 row click pre-fills,
 *        PR-006 Lucide icons, PR-007 status tabs wired
 */
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';
import { escapeHtml } from '../utils/escapeHtml.js';

const RETURN_REASONS = ['Defective', 'Damaged in Transit', 'Wrong Item Supplied', 'Excess Quantity', 'Quality Issue', 'Other'];

export async function render() {
  const returns = DataProvider.getPurchaseReturns() || [];
  const dealers = DataProvider.getDealers() || [];

  const renderRow = (ret) => {
    const dealer = DataProvider.getDealerById(ret.dealerId) || { companyName: ret.dealerName || 'Unknown', type: '' };
    const initials = dealer.companyName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const statusColor = ret.status === 'Pending' ? 'warning' : (ret.status === 'Approved' ? 'success' : 'danger');

    return `
    <tr class="row-hover cursor-pointer" data-id="${escapeHtml(ret.id)}" data-pret-row="${escapeHtml(ret.id)}">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(ret.id)}</td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(ret.invoice || '-')}</td>
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-[10px] font-bold text-primary">${escapeHtml(initials)}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-text">${escapeHtml(dealer.companyName)}</p>
            <p class="text-[10px] text-gray-400">${escapeHtml(dealer.type || '')}</p>
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
        <button class="pret-view-btn p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-id="${escapeHtml(ret.id)}" title="View Debit Note">
          <i data-lucide="eye" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>`;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Purchase Return (Debit Note)</h1>
          <p class="text-sm text-gray-400 mt-0.5">Manage goods returned to suppliers and debit note issuance.</p>
        </div>
        <button id="btn-new-pret" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
          <i data-lucide="plus" class="w-4 h-4"></i> Create Debit Note
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${KPICard({ title: 'Total Debit Notes', value: returns.length.toString(), iconSvg: '<i data-lucide="file-minus"></i>', color: 'primary' })}
        ${KPICard({ title: 'Pending Approval', value: returns.filter(r => r.status === 'Pending').length.toString(), iconSvg: '<i data-lucide="clock"></i>', color: 'warning' })}
        ${KPICard({ title: 'Approved', value: returns.filter(r => r.status === 'Approved').length.toString(), iconSvg: '<i data-lucide="check-circle"></i>', color: 'success' })}
        ${KPICard({ title: 'Total Recoverable', value: '₹' + returns.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString('en-IN'), iconSvg: '<i data-lucide="indian-rupee"></i>', color: 'danger' })}
      </div>

      <!-- Search & Filter Bar -->
      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="pret-search" placeholder="Search by ID, supplier, invoice..."
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
        </div>
        <select id="pret-status-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
        <span id="pret-count-label" class="text-xs text-gray-400 ml-auto">Showing ${returns.length} records</span>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1200px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Return ID</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Supplier Inv</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Supplier</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Products</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-center">Qty</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Reason</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Debit Amt</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Date</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="pret-tbody" class="divide-y divide-border">
              ${returns.length > 0 ? returns.map(renderRow).join('') : '<tr><td colspan="10" class="px-4 py-12 text-center text-gray-400 text-sm">No purchase returns found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Overlay -->
    <div id="pret-drawer-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] opacity-0 pointer-events-none transition-opacity duration-300"></div>

    <!-- Drawer -->
    <aside id="pret-form-drawer" class="fixed top-0 right-0 h-screen w-[580px] bg-white border-l border-border z-[70] shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300">
      <div class="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-danger/10 rounded-lg text-danger">
            <i data-lucide="file-minus" class="w-4 h-4"></i>
          </div>
          <h3 class="text-base font-bold text-text" id="pret-drawer-title">Create Debit Note (Purchase Return)</h3>
        </div>
        <button class="close-pret-drawer p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto space-y-4">
        <form id="pret-form" class="space-y-4">
          <input type="hidden" id="pret-id">
          <input type="hidden" id="pret-product-id">

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Return Date *</label>
              <input type="date" id="pret-date" required class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Supplier Invoice No.</label>
              <input type="text" id="pret-invoice" placeholder="INV-..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Supplier / Dealer *</label>
            <select id="pret-dealer" required class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
              <option value="">Select Supplier...</option>
              ${dealers.map(d => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.companyName)}</option>`).join('')}
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Product Name *</label>
              <input type="text" id="pret-product" required placeholder="Product returned..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Quantity *</label>
              <input type="number" id="pret-qty" required min="1" value="1" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Debit Amount (₹) *</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
              <input type="number" id="pret-amount" required min="0" placeholder="0.00" class="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm font-bold focus:outline-none focus:border-primary">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Return Reason *</label>
              <select id="pret-reason" required class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                ${RETURN_REASONS.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Status *</label>
              <select id="pret-status" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input type="checkbox" id="pret-restock" checked class="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary">
            <label for="pret-restock" class="text-sm font-medium text-text">Deduct item from inventory automatically</label>
          </div>
        </form>
      </div>

      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button class="close-pret-drawer px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button id="save-pret-btn" class="px-5 py-2 text-sm font-semibold text-white bg-danger rounded-lg hover:bg-danger/90 flex items-center gap-2 transition-colors">
          <i data-lucide="save" class="w-4 h-4"></i> Save Debit Note
        </button>
      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();

  const allReturns = DataProvider.getPurchaseReturns() || [];
  const overlay = rootElement.querySelector('#pret-drawer-overlay');
  const formDrawer = rootElement.querySelector('#pret-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-pret-drawer');
  const tbody = rootElement.querySelector('#pret-tbody');
  const pretSearch = rootElement.querySelector('#pret-search');
  const pretStatusFilter = rootElement.querySelector('#pret-status-filter');
  const countLabel = rootElement.querySelector('#pret-count-label');

  const today = new Date().toISOString().split('T')[0];
  const pretDate = rootElement.querySelector('#pret-date');
  if (pretDate) pretDate.value = today;

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  const renderRow = (ret) => {
    const dealer = DataProvider.getDealerById(ret.dealerId) || { companyName: ret.dealerName || 'Unknown', type: '' };
    const initials = dealer.companyName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const sc = ret.status === 'Pending' ? 'warning' : (ret.status === 'Approved' ? 'success' : 'danger');
    return `<tr class="row-hover cursor-pointer" data-id="${escapeHtml(ret.id)}" data-pret-row="${escapeHtml(ret.id)}">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(ret.id)}</td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(ret.invoice || '-')}</td>
      <td class="px-4 py-3.5"><div class="flex items-center gap-2.5"><div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center"><span class="text-[10px] font-bold text-primary">${escapeHtml(initials)}</span></div><div><p class="text-sm font-medium text-text">${escapeHtml(dealer.companyName)}</p></div></div></td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${ret.items ? ret.items.map(i => escapeHtml(i.name)).join(', ') : escapeHtml(ret.product || '-')}</td>
      <td class="px-4 py-3.5 text-center text-sm text-gray-600">${ret.items ? ret.items.reduce((s, i) => s + Number(i.qty || 0), 0) : (ret.qty || 0)}</td>
      <td class="px-4 py-3.5"><span class="status-badge status-danger">${escapeHtml(ret.reason || '-')}</span></td>
      <td class="px-4 py-3.5 text-right text-sm font-semibold text-text">₹${Number(ret.amount || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3.5"><span class="status-badge status-${sc}">${escapeHtml(ret.status || 'Pending')}</span></td>
      <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(ret.date ? ret.date.split('T')[0] : '-')}</td>
      <td class="px-4 py-3.5 text-right"><button class="pret-view-btn p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-id="${escapeHtml(ret.id)}" title="View Debit Note"><i data-lucide="eye" class="w-4 h-4 pointer-events-none"></i></button></td>
    </tr>`;
  };

  // Search & filter (PR-004)
  const applyFilter = () => {
    const q = (pretSearch?.value || '').toLowerCase();
    const status = pretStatusFilter?.value || '';
    const filtered = allReturns.filter(r => {
      if (status && r.status !== status) return false;
      if (q) {
        const dealer = DataProvider.getDealerById(r.dealerId);
        const dealerName = (dealer?.companyName || r.dealerName || '').toLowerCase();
        if (!r.id.toLowerCase().includes(q) && !dealerName.includes(q) && !(r.invoice || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (countLabel) countLabel.textContent = `Showing ${filtered.length} of ${allReturns.length} records`;
    if (tbody) {
      tbody.innerHTML = filtered.length > 0 ? filtered.map(renderRow).join('') : '<tr><td colspan="10" class="px-4 py-12 text-center text-gray-400 text-sm">No purchase returns match your filter</td></tr>';
      if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
    }
  };
  if (pretSearch) pretSearch.addEventListener('input', applyFilter);
  if (pretStatusFilter) pretStatusFilter.addEventListener('change', applyFilter);

  const openForm = (e) => {
    const id = e.detail;
    const form = rootElement.querySelector('#pret-form');
    const title = rootElement.querySelector('#pret-drawer-title');
    if (form) form.reset();
    if (pretDate) pretDate.value = today;
    rootElement.querySelector('#pret-status').value = 'Pending';

    if (id) {
      const ret = allReturns.find(r => r.id === id);
      if (ret && title) {
        title.textContent = 'View/Edit Debit Note';
        rootElement.querySelector('#pret-id').value = ret.id;
        rootElement.querySelector('#pret-date').value = ret.date ? ret.date.split('T')[0] : today;
        rootElement.querySelector('#pret-invoice').value = ret.invoice || '';
        rootElement.querySelector('#pret-dealer').value = ret.dealerId || '';
        rootElement.querySelector('#pret-product-id').value = ret.items ? ret.items[0]?.productId : '';
        rootElement.querySelector('#pret-product').value = ret.items ? ret.items[0]?.name : (ret.product || '');
        rootElement.querySelector('#pret-qty').value = ret.qty || (ret.items ? ret.items.reduce((s, i) => s + Number(i.qty || 0), 0) : 1);
        rootElement.querySelector('#pret-amount').value = ret.amount || '';
        rootElement.querySelector('#pret-reason').value = ret.reason || 'Defective';
        rootElement.querySelector('#pret-status').value = ret.status || 'Pending';
      }
      rootElement.querySelector('#pret-drawer-title').textContent = 'Create Debit Note';
    }
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  // Fix PR-001: Invoice lookup
  const invoiceInput = rootElement.querySelector('#pret-invoice');
  if (invoiceInput) {
    invoiceInput.addEventListener('blur', () => {
      const invId = invoiceInput.value.trim();
      if (!invId) return;
      const inv = DataProvider.getPurchaseInvoices().find(i => i.id === invId);
      if (inv) {
        if (inv.dealerId) rootElement.querySelector('#pret-dealer').value = inv.dealerId;
        if (inv.items && inv.items.length === 1) {
          rootElement.querySelector('#pret-product-id').value = inv.items[0].productId || '';
          rootElement.querySelector('#pret-product').value = inv.items[0].name;
          rootElement.querySelector('#pret-qty').value = inv.items[0].qty;
          rootElement.querySelector('#pret-amount').value = (inv.items[0].qty * (inv.items[0].price || inv.items[0].costPrice || 0)).toFixed(2);
        }
        NotificationService.success('Purchase invoice details loaded');
      }
    });
  }

  window.addEventListener('openPurchaseReturnDrawer', openForm);
  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);

  // Delegated table clicks (replaces inline onclick)
  const handleTableClick = (e) => {
    const viewBtn = e.target.closest('.pret-view-btn');
    if (viewBtn) {
      e.stopPropagation();
      openForm({ detail: viewBtn.getAttribute('data-id') });
      return;
    }
    const row = e.target.closest('[data-pret-row]');
    if (row) openForm({ detail: row.getAttribute('data-pret-row') });
  };
  tbody.addEventListener('click', handleTableClick);

  const newPretBtn = rootElement.querySelector('#btn-new-pret');
  if (newPretBtn) newPretBtn.addEventListener('click', () => openForm({ detail: null }));

  // Initialize Draft Recovery
  const formEl = rootElement.querySelector('#pret-form');
  if (formEl) DraftManager.init('purchaseReturn', formEl);

  // Save (PR-001, PR-002, PR-003)
  rootElement.querySelector('#save-pret-btn')?.addEventListener('click', () => {
    const form = rootElement.querySelector('#pret-form');
    if (!form.reportValidity()) return;

    const dealerId = rootElement.querySelector('#pret-dealer').value;
    const productName = rootElement.querySelector('#pret-product').value.trim();
    const qty = Number(rootElement.querySelector('#pret-qty').value) || 1;
    const amount = Number(rootElement.querySelector('#pret-amount').value) || 0;

    const ret = {
      id: rootElement.querySelector('#pret-id').value || null,
      date: rootElement.querySelector('#pret-date').value,
      invoice: rootElement.querySelector('#pret-invoice').value.trim(),
      dealerId,
      product: productName,
      qty,
      amount,
      reason: rootElement.querySelector('#pret-reason').value,
      status: rootElement.querySelector('#pret-status').value,
      // Provide items array so DataProvider.savePurchaseReturn validates correctly
      items: [{ productId: rootElement.querySelector('#pret-product-id').value, name: productName, qty, price: amount / qty, total: amount }]
    };

    try {
      const saved = DataProvider.savePurchaseReturn(ret);
      DraftManager.clearDraft('purchaseReturn');
      const existingIdx = allReturns.findIndex(r => r.id === saved.id);
      if (existingIdx > -1) allReturns[existingIdx] = saved;
      else allReturns.unshift(saved);

      closeAll();
      applyFilter();
      NotificationService.success('Debit note saved successfully!');
    } catch (err) {
      NotificationService.error(err.message);
    }
  });

  return function cleanup() {
    window.removeEventListener('openPurchaseReturnDrawer', openForm);
  };
}
