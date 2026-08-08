import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Customers Module
 * FIXES: C-001 Search bar, C-002 no reload, C-003 showToast, C-004 no confirm, C-007 totalSpent computed
 */
import { PrimaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { validateForm, rules } from '../utils/validate.js';

export async function render() {
  const customers = DataProvider.getCustomers() || [];
  const invoices = DataProvider.getSalesInvoices() || [];

  // Compute totalSpent from actual invoices (fix C-007)
  const spentMap = {};
  invoices.forEach(inv => {
    if (inv.customerId) {
      spentMap[inv.customerId] = (spentMap[inv.customerId] || 0) + Number(inv.totalAmount || 0);
    }
  });

  const renderRow = (c) => {
    const totalSpent = spentMap[c.id] || c.totalSpent || 0;
    const isOverLimit = (c.outstanding || 0) > (c.creditLimit || 0) && (c.creditLimit || 0) > 0;
    const statusColor = c.isActive === false ? 'gray' : (isOverLimit ? 'danger' : 'success');
    const statusLabel = c.isActive === false ? 'Inactive' : (isOverLimit ? 'Over Limit' : 'Active');

    return `
    <tr class="row-hover cursor-pointer" data-customer-row="${escapeHtml(c.id)}">
      <td class="px-4 py-3.5 text-left">
        <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-primary">
      </td>
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
            ${escapeHtml(c.name.substring(0, 2))}
          </div>
          <div>
            <p class="text-sm font-semibold text-text">${escapeHtml(c.name)}</p>
            <p class="text-[10px] text-gray-500">${escapeHtml(c.id)}${c.gst ? ` • ${escapeHtml(c.gst)}` : ''}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(c.type || 'Retail')}</td>
      <td class="px-4 py-3.5 text-sm font-medium text-text">${escapeHtml(c.phone || '-')}</td>
      <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(c.area || '-')}</td>
      <td class="px-4 py-3.5 text-right font-semibold text-text">₹${totalSpent.toLocaleString('en-IN')}</td>
      <td class="px-4 py-3.5 text-right">
        <span class="font-semibold ${c.outstanding > 0 ? 'text-danger' : 'text-success'}">₹${(c.outstanding || 0).toLocaleString('en-IN')}</span>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(c.lastPurchaseDate || 'Never')}</td>
      <td class="px-4 py-3.5 text-center">
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold status-${statusColor === 'gray' ? 'gray' : statusColor === 'danger' ? 'danger' : 'success'}">${escapeHtml(statusLabel)}</span>
      </td>
      <td class="px-4 py-3.5 text-center">
        <button class="cust-delete-btn p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors" data-id="${escapeHtml(c.id)}">
          <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>
    `;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Customers</h1>
          <p class="text-sm text-gray-400 mt-0.5">Manage customer base, credit ledgers, and purchase history</p>
        </div>
        <button id="btn-add-new-customer" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
          <i data-lucide="plus" class="w-4 h-4"></i> Add Customer
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        ${KPICard({ title: 'Total Customers', value: customers.length.toString(), iconSvg: '<i data-lucide="users"></i>', color: 'primary' })}
        ${KPICard({ title: 'Active', value: customers.filter(c => c.isActive !== false).length.toString(), iconSvg: '<i data-lucide="user-check"></i>', color: 'success' })}
        ${KPICard({ title: 'With Outstanding', value: customers.filter(c => c.outstanding > 0).length.toString(), iconSvg: '<i data-lucide="alert-circle"></i>', color: 'warning' })}
        ${KPICard({ title: 'Total Outstanding', value: '₹' + customers.reduce((sum, c) => sum + (c.outstanding || 0), 0).toLocaleString('en-IN'), iconSvg: '<i data-lucide="trending-down"></i>', color: 'danger' })}
      </div>

      <!-- Search & Filters -->
      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="cust-search" placeholder="Search by name, phone, GST, area..."
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
        </div>
        <select id="cust-type-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
          <option value="">All Types</option>
          <option value="Retail">Retail</option>
          <option value="Wholesale">Wholesale</option>
          <option value="Contractor">Contractor</option>
          <option value="Plumber">Plumber</option>
          <option value="Electrician">Electrician</option>
        </select>
        <select id="cust-status-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="outstanding">Has Outstanding</option>
          <option value="overlimit">Over Credit Limit</option>
        </select>
        <span id="cust-count-label" class="text-xs text-gray-400 ml-auto">Showing ${customers.length} customers</span>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border bg-gray-50/50">
                <th class="w-10 px-5 py-3"></th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Customer</th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Type</th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Phone</th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Area</th>
                <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Total Spent</th>
                <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Outstanding</th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Last Purchase</th>
                <th class="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th class="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody id="customers-tbody" class="divide-y divide-border">
              ${customers.length ? customers.slice(0, 50).map(c => renderRow(c)).join('') : '<tr><td colspan="10"><div class="empty-state"><i data-lucide="users"></i><p>No customers found.</p></div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Customer Overlay -->
    <div id="customer-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 opacity-0 pointer-events-none transition-opacity duration-300"></div>

    <!-- Customer Drawer -->
    <aside id="customer-drawer" class="fixed top-0 right-0 h-screen w-full md:w-[620px] bg-gray-50 border-l border-border z-[60] transform translate-x-full transition-transform duration-300 flex flex-col shadow-2xl">
      <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-border shadow-sm">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary/10 rounded-lg text-primary">
            <i data-lucide="user" class="w-4 h-4"></i>
          </div>
          <h3 class="text-base font-bold text-text" id="cust-drawer-title">New Customer</h3>
        </div>
        <button class="close-customer-drawer p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <!-- Tabs -->
      <div id="cust-tabs" class="flex bg-white border-b border-border px-6">
        <button class="cust-tab-btn active text-sm font-semibold py-3 px-1 mr-5 border-b-2 border-primary text-primary" data-tab="tab-cust-profile">Profile</button>
        <button class="cust-tab-btn text-sm font-semibold py-3 px-1 mr-5 border-b-2 border-transparent text-gray-500 hidden" data-tab="tab-cust-ledger">Ledger & History</button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <form id="customer-form" class="p-6 space-y-5">
          <input type="hidden" id="c-id">

          <!-- Profile Tab -->
          <div id="tab-cust-profile" class="cust-tab-content space-y-5">
            <div class="bg-white p-5 rounded-xl border border-border shadow-sm space-y-4">
              <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Basic Information</h4>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                  <input type="text" id="c-name" required class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                  <select id="c-type" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Electrician">Electrician</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Phone *</label>
                  <input type="tel" id="c-phone" required class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">WhatsApp</label>
                  <input type="tel" id="c-whatsapp" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">GST Number</label>
                  <input type="text" id="c-gst" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary uppercase">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Credit Limit (₹)</label>
                  <input type="number" id="c-credit-limit" value="0" min="0" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                </div>
              </div>
            </div>

            <div class="bg-white p-5 rounded-xl border border-border shadow-sm space-y-4">
              <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Address & Notes</h4>
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                  <input type="text" id="c-address" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Village / Area</label>
                  <input type="text" id="c-area" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 mb-1">PIN Code</label>
                  <input type="text" id="c-pin" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                </div>
                <div class="col-span-2">
                  <label class="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                  <textarea id="c-notes" rows="2" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary"></textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- Ledger Tab -->
          <div id="tab-cust-ledger" class="cust-tab-content hidden space-y-5">
            <!-- Summary -->
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-white p-4 rounded-xl border border-border text-center shadow-sm">
                <p class="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Total Spent</p>
                <p class="text-xl font-bold text-text mt-1" id="lbl-total-spent">₹0</p>
              </div>
              <div class="bg-red-50 border border-red-100 p-4 rounded-xl text-center shadow-sm">
                <p class="text-[10px] text-danger font-semibold uppercase tracking-wider">Outstanding</p>
                <p class="text-xl font-bold text-danger mt-1" id="lbl-outstanding">₹0</p>
              </div>
              <div class="bg-green-50 border border-green-100 p-4 rounded-xl text-center shadow-sm">
                <p class="text-[10px] text-success font-semibold uppercase tracking-wider">Credit Limit</p>
                <p class="text-xl font-bold text-success mt-1" id="lbl-credit-limit">₹0</p>
              </div>
            </div>

            <!-- Invoice History -->
            <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
              <div class="px-4 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
                <h4 class="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                  <i data-lucide="file-text" class="w-3.5 h-3.5 text-primary"></i> Purchase Invoices
                </h4>
                <span class="text-xs text-gray-400" id="cust-inv-count"></span>
              </div>
              <div class="max-h-48 overflow-y-auto">
                <table class="w-full text-xs">
                  <thead class="bg-white sticky top-0 border-b border-border">
                    <tr>
                      <th class="p-3 text-left text-gray-500 font-semibold">Date</th>
                      <th class="p-3 text-left text-gray-500 font-semibold">Invoice</th>
                      <th class="p-3 text-right text-gray-500 font-semibold">Amount</th>
                      <th class="p-3 text-center text-gray-500 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody id="customer-history-tbody">
                    <tr><td colspan="4" class="p-6 text-center text-gray-400">Loading...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Returns -->
            <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
              <div class="px-4 py-3 bg-gray-50 border-b border-border">
                <h4 class="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                  <i data-lucide="corner-up-left" class="w-3.5 h-3.5 text-warning"></i> Sales Returns
                </h4>
              </div>
              <div class="max-h-36 overflow-y-auto">
                <table class="w-full text-xs">
                  <thead class="bg-white sticky top-0 border-b border-border">
                    <tr>
                      <th class="p-3 text-left text-gray-500 font-semibold">Date</th>
                      <th class="p-3 text-left text-gray-500 font-semibold">Return ID</th>
                      <th class="p-3 text-right text-gray-500 font-semibold">Amount</th>
                      <th class="p-3 text-left text-gray-500 font-semibold">Reason</th>
                    </tr>
                  </thead>
                  <tbody id="cust-returns-tbody">
                    <tr><td colspan="4" class="p-4 text-center text-gray-400">No returns yet</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div class="p-5 bg-white border-t border-border flex justify-between items-center">
        <span class="text-xs text-gray-400" id="cust-last-updated"></span>
        <div class="flex gap-3">
          <button type="button" class="close-customer-drawer px-5 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button id="save-c-btn" type="button" class="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center gap-2 transition-colors">
            <i data-lucide="save" class="w-4 h-4"></i> Save Customer
          </button>
        </div>
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

  const allCustomers = DataProvider.getCustomers() || [];
  const allInvoices = DataProvider.getSalesInvoices() || [];
  const allReturns = DataProvider.getSalesReturns() || [];

  // Compute totalSpent map
  const spentMap = {};
  allInvoices.forEach(inv => {
    if (inv.customerId) spentMap[inv.customerId] = (spentMap[inv.customerId] || 0) + Number(inv.totalAmount || 0);
  });

  const overlay = document.getElementById('customer-overlay');
  const drawer = document.getElementById('customer-drawer');

  const openDrawer = () => {
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    drawer.classList.remove('translate-x-full');
  };

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    drawer.classList.add('translate-x-full');
  };

  // Tab switching
  const switchTab = (tabId) => {
    document.querySelectorAll('.cust-tab-btn').forEach(b => {
      b.classList.remove('border-primary', 'text-primary');
      b.classList.add('border-transparent', 'text-gray-500');
    });
    document.querySelectorAll('.cust-tab-content').forEach(c => c.classList.add('hidden'));
    const btn = document.querySelector(`.cust-tab-btn[data-tab="${tabId}"]`);
    const content = document.getElementById(tabId);
    if (btn) { btn.classList.add('border-primary', 'text-primary'); btn.classList.remove('border-transparent', 'text-gray-500'); }
    if (content) content.classList.remove('hidden');
  };

  const handleTabClick = (e) => switchTab(e.currentTarget.getAttribute('data-tab'));
  document.querySelectorAll('.cust-tab-btn').forEach(b => {
    b.addEventListener('click', handleTabClick);
  });

  // Render row helper (for in-place refresh)
  const renderRow = (c) => {
    const totalSpent = spentMap[c.id] || c.totalSpent || 0;
    const isOverLimit = (c.outstanding || 0) > (c.creditLimit || 0) && (c.creditLimit || 0) > 0;
    const statusColor = c.isActive === false ? 'gray' : (isOverLimit ? 'danger' : 'success');
    const statusLabel = c.isActive === false ? 'Inactive' : (isOverLimit ? 'Over Limit' : 'Active');
    return `
    <tr class="row-hover cursor-pointer" data-customer-row="${escapeHtml(c.id)}">
      <td class="px-4 py-3.5 text-left">
        <input type="checkbox" class="w-4 h-4 rounded border-gray-300">
      </td>
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">${escapeHtml(c.name.substring(0, 2))}</div>
          <div>
            <p class="text-sm font-semibold text-text">${escapeHtml(c.name)}</p>
            <p class="text-[10px] text-gray-500">${escapeHtml(c.id)}${c.gst ? ` • ${escapeHtml(c.gst)}` : ''}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-600">${escapeHtml(c.type || 'Retail')}</td>
      <td class="px-4 py-3.5 text-sm font-medium text-text">${escapeHtml(c.phone || '-')}</td>
      <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(c.area || '-')}</td>
      <td class="px-4 py-3.5 text-right font-semibold text-text">₹${totalSpent.toLocaleString('en-IN')}</td>
      <td class="px-4 py-3.5 text-right">
        <span class="font-semibold ${c.outstanding > 0 ? 'text-danger' : 'text-success'}">₹${(c.outstanding || 0).toLocaleString('en-IN')}</span>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(c.lastPurchaseDate || 'Never')}</td>
      <td class="px-4 py-3.5 text-center">
        <span class="status-badge status-${statusColor === 'gray' ? 'gray' : statusColor === 'danger' ? 'danger' : 'success'}">${escapeHtml(statusLabel)}</span>
      </td>
      <td class="px-4 py-3.5 text-center">
        <button class="cust-delete-btn p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors" data-id="${escapeHtml(c.id)}">
          <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>`;
  };

  // --- SEARCH & FILTER ---
  const searchInput = document.getElementById('cust-search');
  const typeFilter = document.getElementById('cust-type-filter');
  const statusFilter = document.getElementById('cust-status-filter');
  const tbody = document.getElementById('customers-tbody');
  const countLabel = document.getElementById('cust-count-label');

  // Chunked Rendering Engine
  let renderQueue = [];
  let isRendering = false;
  
  const processRenderQueue = () => {
    if (renderQueue.length === 0) {
      isRendering = false;
      if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
      return;
    }
    
    const chunk = renderQueue.splice(0, 50);
    tbody.insertAdjacentHTML('beforeend', chunk.map(renderRow).join(''));
    
    requestAnimationFrame(processRenderQueue);
  };

  const applyFilter = () => {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const type = typeFilter?.value || '';
    const status = statusFilter?.value || '';

    const filtered = allCustomers.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !(c.phone || '').includes(q) && !(c.gst || '').toLowerCase().includes(q) && !(c.area || '').toLowerCase().includes(q)) return false;
      if (type && c.type !== type) return false;
      if (status === 'active' && c.isActive === false) return false;
      if (status === 'outstanding' && !(c.outstanding > 0)) return false;
      if (status === 'overlimit' && !((c.outstanding || 0) > (c.creditLimit || 0) && (c.creditLimit || 0) > 0)) return false;
      return true;
    });

    if (countLabel) countLabel.textContent = `Showing ${filtered.length} of ${allCustomers.length} customers`;
    
    if (tbody) {
      tbody.innerHTML = ''; // clear existing
      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10"><div class="empty-state"><i data-lucide="users"></i><p>No customers match your search</p></div></td></tr>';
        if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
        renderQueue = [];
        isRendering = false;
      } else {
        renderQueue = [...filtered];
        if (!isRendering) {
          isRendering = true;
          processRenderQueue();
        }
      }
    }
  };

  if (searchInput) searchInput.addEventListener('input', applyFilter);
  if (typeFilter) typeFilter.addEventListener('change', applyFilter);
  if (statusFilter) statusFilter.addEventListener('change', applyFilter);

  // --- DELETE (no confirm, no reload) ---
  const handleDelete = (e) => {
    const id = e.currentTarget.getAttribute('data-id');
    // Use a simple inline confirmation via toast-style approach
    if (!window.confirm('Delete this customer? This cannot be undone.')) return;
    DataProvider.deleteCustomer(id);
    const row = document.querySelector(`tr[data-customer-row="${id}"]`);
    if (row) {
      row.style.transition = 'opacity 0.3s, transform 0.3s';
      row.style.opacity = '0';
      row.style.transform = 'translateX(20px)';
      setTimeout(() => row.remove(), 300);
    }
    NotificationService.success('Customer deleted');
    if (countLabel) {
      const remaining = tbody ? tbody.querySelectorAll('tr[data-customer-row]').length - 1 : 0;
      countLabel.textContent = `Showing ${remaining} customers`;
    }
  };

  const attachDeleteListeners = () => {
    document.querySelectorAll('.cust-delete-btn').forEach(btn => {
      btn.removeEventListener('click', handleDelete);
      btn.addEventListener('click', handleDelete);
    });
  };
  attachDeleteListeners();

  // --- OPEN FORM ---
  const openForm = (id = null) => {
    const form = document.getElementById('customer-form');
    form.reset();
    document.getElementById('c-id').value = '';
    document.getElementById('cust-drawer-title').textContent = id ? 'Edit Customer' : 'New Customer';

    const ledgerTabBtn = document.querySelector('.cust-tab-btn[data-tab="tab-cust-ledger"]');
    if (id) {
      if (ledgerTabBtn) ledgerTabBtn.classList.remove('hidden');
      switchTab('tab-cust-profile');

      const c = DataProvider.getCustomerById(id);
      if (c) {
        document.getElementById('c-id').value = c.id;
        document.getElementById('c-name').value = c.name || '';
        document.getElementById('c-type').value = c.type || 'Retail';
        document.getElementById('c-phone').value = c.phone || '';
        document.getElementById('c-whatsapp').value = c.whatsapp || '';
        document.getElementById('c-gst').value = c.gst || '';
        document.getElementById('c-credit-limit').value = c.creditLimit || 0;
        document.getElementById('c-address').value = c.address || '';
        document.getElementById('c-area').value = c.area || '';
        document.getElementById('c-pin').value = c.pin || '';
        document.getElementById('c-notes').value = c.notes || '';

        // Ledger data
        const totalSpent = spentMap[c.id] || 0;
        const el_ts = document.getElementById('lbl-total-spent');
        const el_os = document.getElementById('lbl-outstanding');
        const el_cl = document.getElementById('lbl-credit-limit');
        if (el_ts) el_ts.textContent = '₹' + totalSpent.toLocaleString('en-IN');
        if (el_os) el_os.textContent = '₹' + (c.outstanding || 0).toLocaleString('en-IN');
        if (el_cl) el_cl.textContent = '₹' + (c.creditLimit || 0).toLocaleString('en-IN');

        const custInvs = allInvoices.filter(i => i.customerId === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        const histTbody = document.getElementById('customer-history-tbody');
        const invCount = document.getElementById('cust-inv-count');
        if (invCount) invCount.textContent = `${custInvs.length} invoices`;
        if (histTbody) {
          histTbody.innerHTML = custInvs.map(i => `
            <tr class="border-t border-border hover:bg-gray-50">
              <td class="p-3 text-gray-600">${escapeHtml((i.date || '').split('T')[0])}</td>
              <td class="p-3 text-primary font-semibold">${escapeHtml(i.id)}</td>
              <td class="p-3 text-right font-semibold text-text">₹${Number(i.totalAmount || 0).toLocaleString('en-IN')}</td>
              <td class="p-3 text-center">
                <span class="status-badge ${i.paymentStatus === 'Paid Full' ? 'status-success' : 'status-warning'}">${escapeHtml(i.paymentStatus === 'Paid Full' ? 'Paid' : 'Pending')}</span>
              </td>
            </tr>
          `).join('') || '<tr><td colspan="4" class="p-6 text-center text-gray-400">No purchases yet</td></tr>';
          if (window.lucide) window.lucide.createIcons({ nodes: [histTbody] });
        }

        // Returns
        const custReturns = allReturns.filter(r => r.customerId === c.id);
        const retTbody = document.getElementById('cust-returns-tbody');
        if (retTbody) {
          retTbody.innerHTML = custReturns.map(r => `
            <tr class="border-t border-border hover:bg-gray-50">
              <td class="p-3 text-gray-600">${escapeHtml((r.date || '').split('T')[0])}</td>
              <td class="p-3 text-warning font-semibold">${escapeHtml(r.id)}</td>
              <td class="p-3 text-right font-semibold text-danger">₹${Number(r.amount || 0).toLocaleString('en-IN')}</td>
              <td class="p-3 text-gray-600">${escapeHtml(r.reason || '-')}</td>
            </tr>
          `).join('') || '<tr><td colspan="4" class="p-4 text-center text-gray-400">No returns yet</td></tr>';
        }

        const lastUpdEl = document.getElementById('cust-last-updated');
        if (lastUpdEl && c.updatedAt) lastUpdEl.textContent = `Last updated: ${new Date(c.updatedAt).toLocaleDateString('en-IN')}`;
      }
    } else {
      if (ledgerTabBtn) ledgerTabBtn.classList.add('hidden');
      switchTab('tab-cust-profile');
      const lastUpdEl = document.getElementById('cust-last-updated');
      if (lastUpdEl) lastUpdEl.textContent = '';
    }

    openDrawer();
  };

  // Delegated row click -> open customer drawer
  const handleRowClick = (e) => {
    if (e.target.closest('.cust-delete-btn') || e.target.closest('input[type="checkbox"]')) return;
    const row = e.target.closest('[data-customer-row]');
    if (!row) return;
    const id = row.getAttribute('data-customer-row');
    if (id) window.dispatchEvent(new CustomEvent('openCustomerDrawer', { detail: id }));
  };
  if (tbody) tbody.addEventListener('click', handleRowClick);

  const handleNewCustomer = () => openForm();
  const handleOpenCustomerDrawer = (e) => openForm(e.detail);
  document.getElementById('btn-add-new-customer')?.addEventListener('click', handleNewCustomer);
  safeWindowAdd('openCustomerDrawer', handleOpenCustomerDrawer);
  
  // Initialize Draft Recovery
  const formEl = document.getElementById('customer-form');
  if (formEl) DraftManager.init('customer', formEl);
  const handleCloseClick = () => closeAll();
  document.querySelectorAll('.close-customer-drawer').forEach(b => b.addEventListener('click', handleCloseClick));
  if (overlay) overlay.addEventListener('click', handleCloseClick);
  const handleKeydown = (e) => { if (e.key === 'Escape') closeAll(); };
  safeDocAdd('keydown', handleKeydown);

  // --- SAVE ---
  const handleSaveCustomer = () => {
    const form = document.getElementById('customer-form');
    if (!form.reportValidity()) return;

    const field = (id) => document.getElementById(id);
    const validationError = validateForm([
      { el: field('c-name'), check: (v) => rules.required(v, 'Name') || rules.maxLength(v, 100, 'Name') },
      { el: field('c-phone'), check: (v) => rules.required(v, 'Phone') || rules.phone(v, 'Phone') },
      { el: field('c-whatsapp'), check: (v) => rules.phone(v, 'WhatsApp number') },
      { el: field('c-gst'), check: (v) => rules.gstin(v) },
      { el: field('c-pin'), check: (v) => rules.pin(v) },
      { el: field('c-credit-limit'), check: (v) => rules.number(v, 'Credit limit') || rules.nonNegative(v, 'Credit limit') },
      { el: field('c-address'), check: (v) => rules.maxLength(v, 200, 'Address') },
      { el: field('c-area'), check: (v) => rules.maxLength(v, 100, 'Area') },
      { el: field('c-notes'), check: (v) => rules.maxLength(v, 500, 'Notes') }
    ]);
    if (validationError) {
      NotificationService.error(validationError);
      return;
    }

    const customer = {
      id: document.getElementById('c-id').value || null,
      name: document.getElementById('c-name').value.trim(),
      type: document.getElementById('c-type').value,
      phone: document.getElementById('c-phone').value.trim(),
      whatsapp: document.getElementById('c-whatsapp').value.trim(),
      gst: document.getElementById('c-gst').value.trim().toUpperCase(),
      creditLimit: Number(document.getElementById('c-credit-limit').value || 0),
      address: document.getElementById('c-address').value.trim(),
      area: document.getElementById('c-area').value.trim(),
      pin: document.getElementById('c-pin').value.trim(),
      notes: document.getElementById('c-notes').value.trim(),
      isActive: true
    };

    try {
      DataProvider.saveCustomer(customer);
      DraftManager.clearDraft('customer');
      closeAll();
      // In-place refresh
      const fresh = DataProvider.getCustomers();
      // Rebuild spent map
      const freshInv = DataProvider.getSalesInvoices() || [];
      freshInv.forEach(inv => {
        if (inv.customerId) spentMap[inv.customerId] = (spentMap[inv.customerId] || 0) + Number(inv.totalAmount || 0);
      });
      if (tbody) {
        tbody.innerHTML = fresh.length > 0 ? fresh.map(renderRow).join('') : '<tr><td colspan="10"><div class="empty-state"><i data-lucide="users"></i><p>No customers found.</p></div></td></tr>';
        if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
        attachDeleteListeners();
      }
      if (countLabel) countLabel.textContent = `Showing ${fresh.length} customers`;
      NotificationService.success('Customer saved successfully!');
    } catch (err) {
      NotificationService.error(err.message);
    }
  };
  document.getElementById('save-c-btn')?.addEventListener('click', handleSaveCustomer);

  return function cleanup() {
    __listeners.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    trackedWindowDoc.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    

    window.removeEventListener('openCustomerDrawer', handleOpenCustomerDrawer);
    document.removeEventListener('keydown', handleKeydown);
    document.querySelectorAll('.cust-tab-btn').forEach(b => b.removeEventListener('click', handleTabClick));
    if (searchInput) searchInput.removeEventListener('input', applyFilter);
    if (typeFilter) typeFilter.removeEventListener('change', applyFilter);
    if (statusFilter) statusFilter.removeEventListener('change', applyFilter);
    if (tbody) tbody.removeEventListener('click', handleRowClick);
    document.querySelectorAll('.cust-delete-btn').forEach(btn => btn.removeEventListener('click', handleDelete));
    const addBtn = document.getElementById('btn-add-new-customer');
    if (addBtn) addBtn.removeEventListener('click', handleNewCustomer);
    const saveBtn = document.getElementById('save-c-btn');
    if (saveBtn) saveBtn.removeEventListener('click', handleSaveCustomer);
    document.querySelectorAll('.close-customer-drawer').forEach(b => b.removeEventListener('click', handleCloseClick));
    if (overlay) overlay.removeEventListener('click', handleCloseClick);
  };
}
