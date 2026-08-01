import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Warranty Management
 * FIXES: W-001 alert() removed, W-002 real DataProvider.saveWarranty(), W-003 search wired,
 *        W-004 KPI cards added, W-005 cleanup returned, W-006 Lucide icons throughout
 */
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';
import { escapeHtml } from '../utils/escapeHtml.js';

const CLAIM_STATUSES = ['No Claim', 'Active Claim', 'Sent to Company', 'Resolved', 'Rejected'];
const REPLACEMENT_STATUSES = ['-', 'Pending', 'Repaired', 'Replaced (New Item)'];

export async function render() {
  const warranties = DataProvider.getWarranties() || [];
  const active = warranties.filter(w => w.claimStatus && w.claimStatus !== 'No Claim' && w.claimStatus !== 'Resolved');
  const resolved = warranties.filter(w => w.claimStatus === 'Resolved');

  const renderRow = (wrt) => {
    let statusColor = 'primary';
    if (wrt.claimStatus === 'Active Claim' || wrt.claimStatus === 'Sent to Company') statusColor = 'warning';
    if (wrt.claimStatus === 'Resolved') statusColor = 'success';
    if (wrt.claimStatus === 'Rejected') statusColor = 'danger';

    return `
    <tr class="row-hover cursor-pointer" data-warranty-row="${escapeHtml(wrt.id)}">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(wrt.id || '-')}</td>
      <td class="px-4 py-3.5">
        <p class="text-sm font-medium text-text">${escapeHtml(wrt.product || '-')}</p>
        <p class="text-[10px] text-gray-400">${escapeHtml(wrt.customer || '-')}</p>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(wrt.invoice || '-')}</td>
      <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(wrt.expiry || '-')}</td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-${statusColor}/10 text-${statusColor} uppercase tracking-wider">${escapeHtml(wrt.claimStatus || 'No Claim')}</span>
      </td>
      <td class="px-4 py-3.5 text-sm font-medium text-text">${escapeHtml(wrt.replacement || '-')}</td>
      <td class="px-4 py-3.5 text-right">
        <button class="edit-warranty-btn p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-id="${escapeHtml(wrt.id)}">
          <i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>`;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Warranty Management</h1>
          <p class="text-sm text-gray-400 mt-0.5">Track product warranties, customer claims, and company replacements.</p>
        </div>
        <button data-warranty-new class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
          <i data-lucide="plus" class="w-4 h-4"></i> Register Warranty / Claim
        </button>
      </div>

      <!-- KPI Cards (W-004) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${KPICard({ title: 'Total Records', value: warranties.length.toString(), iconSvg: '<i data-lucide="shield"></i>', color: 'primary' })}
        ${KPICard({ title: 'Active Claims', value: active.length.toString(), iconSvg: '<i data-lucide="alert-triangle"></i>', color: 'warning' })}
        ${KPICard({ title: 'Resolved', value: resolved.length.toString(), iconSvg: '<i data-lucide="check-circle"></i>', color: 'success' })}
        ${KPICard({ title: 'Rejected', value: warranties.filter(w => w.claimStatus === 'Rejected').length.toString(), iconSvg: '<i data-lucide="x-circle"></i>', color: 'danger' })}
      </div>

      <!-- Search & Filter -->
      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="wrt-search" placeholder="Search by product, customer, invoice..."
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
        </div>
        <select id="wrt-status-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
          <option value="">All Statuses</option>
          ${CLAIM_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
        <span id="wrt-count-label" class="text-xs text-gray-400 ml-auto">Showing ${warranties.length} records</span>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1000px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Record ID</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Product / Customer</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Invoice Ref</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Expiry</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Claim Status</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Replacement</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="warranty-tbody" class="divide-y divide-border">
              ${warranties.length > 0 ? warranties.map(renderRow).join('') : '<tr><td colspan="7" class="px-4 py-12 text-center text-gray-400 text-sm">No warranty records found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Drawer Overlay -->
    <div id="warranty-drawer-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] opacity-0 pointer-events-none transition-opacity duration-300"></div>

    <!-- Drawer -->
    <aside id="warranty-form-drawer" class="fixed top-0 right-0 h-screen w-[540px] bg-white border-l border-border z-[70] shadow-2xl flex flex-col transform translate-x-full transition-transform duration-300">
      <div class="flex items-center justify-between px-6 py-4 border-b border-border bg-white">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-warning/10 rounded-lg text-warning">
            <i data-lucide="shield" class="w-4 h-4"></i>
          </div>
          <h3 class="text-base font-bold text-text" id="wrt-drawer-title">Warranty Record</h3>
        </div>
        <button class="close-warranty-drawer p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto space-y-4">
        <form id="warranty-form" class="space-y-4">
          <input type="hidden" id="wrt-id">

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Invoice Reference</label>
              <input type="text" id="wrt-invoice" placeholder="INV-..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Warranty Expiry Date *</label>
              <input type="date" id="wrt-expiry" required class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Customer Name *</label>
            <input type="text" id="wrt-customer" required placeholder="Customer name..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Product Name *</label>
            <input type="text" id="wrt-product" required placeholder="Product / model..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Claim Status</label>
              <select id="wrt-claim-status" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                ${CLAIM_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="text-xs font-semibold text-gray-600 block mb-1.5">Replacement Status</label>
              <select id="wrt-replacement" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                ${REPLACEMENT_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
              </select>
            </div>
          </div>

          <div>
            <label class="text-xs font-semibold text-gray-600 block mb-1.5">Service Notes / Complaint</label>
            <textarea id="wrt-notes" rows="3" placeholder="Describe the fault or customer complaint..."
              class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"></textarea>
          </div>
        </form>
      </div>

      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button class="close-warranty-drawer px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button id="save-warranty-btn" class="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center gap-2 transition-colors">
          <i data-lucide="save" class="w-4 h-4"></i> Save Record
        </button>
      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();

  const allWarranties = DataProvider.getWarranties() || [];
  const overlay = rootElement.querySelector('#warranty-drawer-overlay');
  const formDrawer = rootElement.querySelector('#warranty-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-warranty-drawer');
  const tbody = rootElement.querySelector('#warranty-tbody');
  const wrtSearch = rootElement.querySelector('#wrt-search');
  const wrtStatusFilter = rootElement.querySelector('#wrt-status-filter');
  const countLabel = rootElement.querySelector('#wrt-count-label');

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  const renderRow = (wrt) => {
    let sc = 'primary';
    if (wrt.claimStatus === 'Active Claim' || wrt.claimStatus === 'Sent to Company') sc = 'warning';
    if (wrt.claimStatus === 'Resolved') sc = 'success';
    if (wrt.claimStatus === 'Rejected') sc = 'danger';
    return `
    <tr class="row-hover cursor-pointer" data-warranty-row="${escapeHtml(wrt.id)}">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(wrt.id || '-')}</td>
      <td class="px-4 py-3.5"><p class="text-sm font-medium text-text">${escapeHtml(wrt.product || '-')}</p><p class="text-[10px] text-gray-400">${escapeHtml(wrt.customer || '-')}</p></td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(wrt.invoice || '-')}</td>
      <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(wrt.expiry || '-')}</td>
      <td class="px-4 py-3.5"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-${sc}/10 text-${sc} uppercase tracking-wider">${escapeHtml(wrt.claimStatus || 'No Claim')}</span></td>
      <td class="px-4 py-3.5 text-sm font-medium text-text">${escapeHtml(wrt.replacement || '-')}</td>
      <td class="px-4 py-3.5 text-right"><button class="edit-warranty-btn p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-id="${escapeHtml(wrt.id)}"><i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i></button></td>
    </tr>`;
  };

  // Search & filter wiring (W-003)
  const applyFilter = () => {
    const q = (wrtSearch?.value || '').toLowerCase();
    const status = wrtStatusFilter?.value || '';
    const filtered = allWarranties.filter(w => {
      if (q && !(w.product || '').toLowerCase().includes(q) && !(w.customer || '').toLowerCase().includes(q) && !(w.invoice || '').toLowerCase().includes(q)) return false;
      if (status && (w.claimStatus || 'No Claim') !== status) return false;
      return true;
    });
    if (countLabel) countLabel.textContent = `Showing ${filtered.length} of ${allWarranties.length} records`;
    if (tbody) {
      tbody.innerHTML = filtered.length > 0
        ? filtered.map(renderRow).join('')
        : '<tr><td colspan="7" class="px-4 py-12 text-center text-gray-400 text-sm">No records match your search</td></tr>';
      if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
    }
  };
  if (wrtSearch) wrtSearch.addEventListener('input', applyFilter);
  if (wrtStatusFilter) wrtStatusFilter.addEventListener('change', applyFilter);

  const openForm = (e) => {
    const id = e.detail;
    const form = rootElement.querySelector('#warranty-form');
    const title = rootElement.querySelector('#wrt-drawer-title');
    if (form) form.reset();

    if (id) {
      const wrt = allWarranties.find(w => w.id === id);
      if (wrt) {
        rootElement.querySelector('#wrt-id').value = wrt.id;
        rootElement.querySelector('#wrt-invoice').value = wrt.invoice || '';
        rootElement.querySelector('#wrt-expiry').value = wrt.expiry || '';
        rootElement.querySelector('#wrt-customer').value = wrt.customer || '';
        rootElement.querySelector('#wrt-product').value = wrt.product || '';
        rootElement.querySelector('#wrt-claim-status').value = wrt.claimStatus || 'No Claim';
        rootElement.querySelector('#wrt-replacement').value = wrt.replacement || '-';
        rootElement.querySelector('#wrt-notes').value = wrt.notes || '';
        if (title) title.textContent = 'Edit Warranty Record';
      }
    } else {
      if (title) title.textContent = 'New Warranty Record';
    }

    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  window.addEventListener('openWarrantyDrawer', openForm);
  const handleNewWarranty = () => openForm({ detail: null });
  rootElement.querySelector('[data-warranty-new]')?.addEventListener('click', handleNewWarranty);
  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);

  const handleRowClick = (e) => {
    const editBtn = e.target.closest('.edit-warranty-btn');
    const row = editBtn ? editBtn.closest('tr') : e.target.closest('[data-warranty-row]');
    if (!row) return;
    const id = editBtn ? editBtn.getAttribute('data-id') : row.getAttribute('data-warranty-row');
    if (id) openForm({ detail: id });
  };
  if (tbody) tbody.addEventListener('click', handleRowClick);

  // Initialize Draft Recovery
  const formEl = rootElement.querySelector('#warranty-form');
  if (formEl) DraftManager.init('warranty', formEl);

  // Save (W-001, W-002) — real DataProvider call, no alert(), no reload
  const saveBtn = rootElement.querySelector('#save-warranty-btn');
  const handleSave = () => {
    const form = rootElement.querySelector('#warranty-form');
    if (!form.reportValidity()) return;

    const warranty = {
      id: rootElement.querySelector('#wrt-id').value || null,
      invoice: rootElement.querySelector('#wrt-invoice').value.trim(),
      expiry: rootElement.querySelector('#wrt-expiry').value,
      customer: rootElement.querySelector('#wrt-customer').value.trim(),
      product: rootElement.querySelector('#wrt-product').value.trim(),
      claimStatus: rootElement.querySelector('#wrt-claim-status').value,
      replacement: rootElement.querySelector('#wrt-replacement').value,
      notes: rootElement.querySelector('#wrt-notes').value.trim()
    };

    try {
      const saved = DataProvider.saveWarranty(warranty);
      DraftManager.clearDraft('warranty');
      const existingIdx = allWarranties.findIndex(w => w.id === saved.id);
      if (existingIdx > -1) allWarranties[existingIdx] = saved;
      else allWarranties.unshift(saved);

      closeAll();
      if (tbody) {
        tbody.innerHTML = allWarranties.length > 0 ? allWarranties.map(renderRow).join('') : '<tr><td colspan="7" class="px-4 py-12 text-center text-gray-400 text-sm">No records found.</td></tr>';
        if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
      }
      if (countLabel) countLabel.textContent = `Showing ${allWarranties.length} records`;
      NotificationService.success('Warranty record saved!');
    } catch (err) {
      NotificationService.error(err.message);
    }
  };
  if (saveBtn) {
    saveBtn.addEventListener('click', handleSave);
  }

  return function cleanup() {
    window.removeEventListener('openWarrantyDrawer', openForm);
    if (wrtSearch) wrtSearch.removeEventListener('input', applyFilter);
    if (wrtStatusFilter) wrtStatusFilter.removeEventListener('change', applyFilter);
    if (tbody) tbody.removeEventListener('click', handleRowClick);
    rootElement.querySelector('[data-warranty-new]')?.removeEventListener('click', handleNewWarranty);
    closeBtns.forEach(btn => btn.removeEventListener('click', closeAll));
    overlay.removeEventListener('click', closeAll);
    if (saveBtn) saveBtn.removeEventListener('click', handleSave);
  };
}
