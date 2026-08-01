/**
 * Senthil Enterprises ERP - Sales Register
 * Fix BUG-001: Wire search, payment mode filter, date filter.
 * Add view invoice detail modal.
 */
import { DataProvider } from '../services/dataProvider.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export async function render() {
  const invoices = DataProvider.getSalesInvoices() || [];
  invoices.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  // KPI calculations
  const totalRevenue = invoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysInvoices = invoices.filter(i => (i.date || '').startsWith(todayStr));
  const todaysSales = todaysInvoices.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);
  const creditPending = invoices.filter(i => i.paymentStatus !== 'Paid Full' && i.paymentMode === 'Credit');
  const creditTotal = creditPending.reduce((sum, i) => sum + Number(i.totalAmount || 0), 0);

  const renderRow = (row) => {
    const dateStr = row.date ? new Date(row.date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'N/A';
    const isPaid = row.status === 'Paid' || row.paymentStatus === 'Paid Full';
    const badgeColor = isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
    const statusText = isPaid ? 'Paid' : (row.paymentStatus || 'Pending');
    const totalAmt = Number(row.totalAmount || row.total || 0);
    
    return `
      <tr class="row-hover" data-invoice-id="${escapeHtml(row.id)}">
        <td class="px-4 py-3 font-semibold text-primary text-sm cursor-pointer view-invoice-btn" data-id="${escapeHtml(row.id)}">${escapeHtml(row.id)}</td>
        <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">${dateStr}</td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
              ${escapeHtml((row.customerName || 'WK').substring(0, 2).toUpperCase())}
            </div>
            <span class="text-sm font-medium text-text truncate max-w-[140px]">${escapeHtml(row.customerName || 'Walk-in Customer')}</span>
          </div>
        </td>
        <td class="px-4 py-3 text-sm text-gray-500 text-center">${(row.items || []).length}</td>
        <td class="px-4 py-3 text-right">
          <span class="text-sm font-bold text-text">₹${totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </td>
        <td class="px-4 py-3 text-center">
          <span class="text-xs text-gray-600 font-medium px-2 py-1 bg-gray-100 rounded-lg">${escapeHtml(row.paymentMode || 'Cash')}</span>
        </td>
        <td class="px-4 py-3 text-center">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${badgeColor}">${escapeHtml(statusText)}</span>
        </td>
        <td class="px-4 py-3 text-right">
          <button class="view-invoice-btn p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" data-id="${escapeHtml(row.id)}" title="View Invoice">
            <i data-lucide="eye" class="w-4 h-4"></i>
          </button>
          <button class="print-invoice-btn p-1.5 text-gray-400 hover:text-success hover:bg-success/10 rounded-lg transition-colors" data-id="${escapeHtml(row.id)}" title="Print Invoice">
            <i data-lucide="printer" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>`;
  };

  const tableRows = invoices.length > 0 
    ? invoices.map(renderRow).join('')
    : `<tr><td colspan="8" class="px-4 py-16 text-center">
        <div class="flex flex-col items-center gap-3 text-gray-400">
          <i data-lucide="receipt" class="w-10 h-10"></i>
          <p class="text-sm font-medium">No sales found</p>
          <p class="text-xs">Create your first invoice from POS</p>
          <button data-sales-nav="#/pos" class="mt-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90">Go to POS</button>
        </div>
      </td></tr>`;

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in pb-20">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 class="text-2xl font-bold text-text">Sales Register</h1>
          <p class="text-sm text-gray-500 mt-1">View and manage all sales invoices</p>
        </div>
        <div class="flex items-center gap-3">
          <button data-sales-nav="#/sales-returns" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2 transition-colors">
            <i data-lucide="corner-down-left" class="w-4 h-4"></i> Sales Returns
          </button>
          <button data-sales-nav="#/pos" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-bold flex items-center gap-2 shadow-sm transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i> New Invoice
          </button>
        </div>
      </div>

      <!-- KPI Summary -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white p-4 rounded-xl border border-border shadow-sm">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Invoices</p>
          <p class="text-2xl font-bold text-text mt-1">${invoices.length}</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-border shadow-sm">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Revenue</p>
          <p class="text-2xl font-bold text-primary mt-1">₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-border shadow-sm">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's Sales</p>
          <p class="text-2xl font-bold text-success mt-1">₹${todaysSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          <p class="text-[10px] text-gray-400 mt-0.5">${todaysInvoices.length} invoices</p>
        </div>
        <div class="bg-white p-4 rounded-xl border border-border shadow-sm">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Credit Pending</p>
          <p class="text-2xl font-bold text-danger mt-1">₹${creditTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
          <p class="text-[10px] text-gray-400 mt-0.5">${creditPending.length} invoices</p>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="bg-white rounded-xl border border-border p-4 mb-6 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="sales-search" placeholder="Search by Invoice # or Customer name..." 
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
        </div>
        <select id="sales-payment-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors">
          <option value="">All Payment Modes</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Credit">Credit</option>
        </select>
        <select id="sales-status-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors">
          <option value="">All Status</option>
          <option value="Paid Full">Paid</option>
          <option value="Pending">Pending</option>
        </select>
        <select id="sales-date-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors">
          <option value="">All Dates</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <span id="filter-count" class="text-xs text-gray-400 ml-auto">Showing ${invoices.length} invoices</span>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border bg-gray-50/60">
                <th class="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Invoice #</th>
                <th class="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Date & Time</th>
                <th class="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Customer</th>
                <th class="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Items</th>
                <th class="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                <th class="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Mode</th>
                <th class="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                <th class="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody id="sales-table-body" class="divide-y divide-border">
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Invoice Detail Modal -->
    <div id="invoice-modal-overlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] opacity-0 pointer-events-none transition-opacity duration-200 flex items-center justify-center p-4">
      <div id="invoice-modal" class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform scale-95 opacity-0 transition-all duration-200">
        <!-- Modal populated dynamically -->
      </div>
    </div>

    <!-- Print area -->
    <div id="print-receipt-area" style="display:none;"></div>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();

  const allInvoices = DataProvider.getSalesInvoices() || [];
  allInvoices.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const tbody = rootElement.querySelector('#sales-table-body');
  const searchInput = rootElement.querySelector('#sales-search');
  const paymentFilter = rootElement.querySelector('#sales-payment-filter');
  const statusFilter = rootElement.querySelector('#sales-status-filter');
  const dateFilter = rootElement.querySelector('#sales-date-filter');
  const filterCount = rootElement.querySelector('#filter-count');

  // =====================
  // FILTERING LOGIC
  // =====================

  const applyFilters = () => {
    const q = searchInput.value.toLowerCase().trim();
    const mode = paymentFilter.value;
    const status = statusFilter.value;
    const dateRange = dateFilter.value;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let filtered = allInvoices.filter(inv => {
      // Text search
      if (q && !inv.id.toLowerCase().includes(q) && !(inv.customerName || '').toLowerCase().includes(q)) return false;
      // Payment mode
      if (mode && inv.paymentMode !== mode) return false;
      // Status
      if (status && inv.paymentStatus !== status) return false;
      // Date range
      if (dateRange) {
        const invDate = new Date(inv.date || 0);
        const invDateStr = invDate.toISOString().split('T')[0];
        if (dateRange === 'today' && invDateStr !== todayStr) return false;
        if (dateRange === 'week') {
          const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
          if (invDate < weekAgo) return false;
        }
        if (dateRange === 'month') {
          if (invDate.getMonth() !== now.getMonth() || invDate.getFullYear() !== now.getFullYear()) return false;
        }
      }
      return true;
    });

    filterCount.textContent = `Showing ${filtered.length} of ${allInvoices.length} invoices`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="8" class="px-4 py-12 text-center">
          <div class="flex flex-col items-center gap-2 text-gray-400">
            <i data-lucide="search" class="w-8 h-8"></i>
            <p class="text-sm">No invoices match your filters</p>
          </div>
        </td></tr>`;
    } else {
      tbody.innerHTML = filtered.map(row => {
        const dateStr = row.date ? new Date(row.date).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'N/A';
        const isPaid = row.status === 'Paid' || row.paymentStatus === 'Paid Full';
        const badgeColor = isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700';
        const statusText = isPaid ? 'Paid' : (row.paymentStatus || 'Pending');
        const totalAmt = Number(row.totalAmount || row.total || 0);
        
        return `
          <tr class="row-hover" data-invoice-id="${escapeHtml(row.id)}">
            <td class="px-4 py-3 font-semibold text-primary text-sm cursor-pointer view-invoice-btn" data-id="${escapeHtml(row.id)}">${escapeHtml(row.id)}</td>
            <td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">${dateStr}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  ${escapeHtml((row.customerName || 'WK').substring(0, 2).toUpperCase())}
                </div>
                <span class="text-sm font-medium text-text truncate max-w-[140px]">${escapeHtml(row.customerName || 'Walk-in Customer')}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 text-center">${(row.items || []).length}</td>
            <td class="px-4 py-3 text-right font-bold text-text">₹${totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="px-4 py-3 text-center">
              <span class="text-xs text-gray-600 font-medium px-2 py-1 bg-gray-100 rounded-lg">${escapeHtml(row.paymentMode || 'Cash')}</span>
            </td>
            <td class="px-4 py-3 text-center">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${badgeColor}">${escapeHtml(statusText)}</span>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="view-invoice-btn p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" data-id="${escapeHtml(row.id)}" title="View">
                <i data-lucide="eye" class="w-4 h-4"></i>
              </button>
              <button class="print-invoice-btn p-1.5 text-gray-400 hover:text-success hover:bg-success/10 rounded-lg transition-colors" data-id="${escapeHtml(row.id)}" title="Print">
                <i data-lucide="printer" class="w-4 h-4"></i>
              </button>
            </td>
          </tr>`;
      }).join('');
    }
    if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
  };

  searchInput.addEventListener('input', applyFilters);
  paymentFilter.addEventListener('change', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  dateFilter.addEventListener('change', applyFilters);

  // =====================
  // INVOICE VIEW MODAL
  // =====================

  const modalOverlay = rootElement.querySelector('#invoice-modal-overlay');
  const modal = rootElement.querySelector('#invoice-modal');

  const openInvoiceModal = (id) => {
    const inv = allInvoices.find(i => i.id === id);
    if (!inv) return;

    const dateStr = inv.date ? new Date(inv.date).toLocaleString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : 'N/A';
    const isPaid = inv.status === 'Paid' || inv.paymentStatus === 'Paid Full';

    modal.innerHTML = `
      <div class="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h3 class="text-xl font-bold text-text">Invoice ${escapeHtml(inv.id)}</h3>
          <p class="text-sm text-gray-400 mt-0.5">${dateStr}</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="create-del-from-modal" class="px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1" title="Create Delivery">
            <i data-lucide="truck" class="w-4 h-4"></i> Dispatch
          </button>
          <button id="print-from-modal" class="p-2 text-gray-500 hover:text-success hover:bg-success/10 rounded-lg transition-colors" title="Print">
            <i data-lucide="printer" class="w-5 h-5"></i>
          </button>
          <button id="close-invoice-modal" class="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- Customer & Status -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-50 p-4 rounded-xl">
            <p class="text-xs text-gray-400 mb-1">Customer</p>
            <p class="text-sm font-bold text-text">${escapeHtml(inv.customerName || 'Walk-in Customer')}</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-xl">
            <p class="text-xs text-gray-400 mb-1">Payment</p>
            <p class="text-sm font-bold text-text">${escapeHtml(inv.paymentMode || 'Cash')}</p>
            <span class="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}">${isPaid ? 'Paid' : 'Pending'}</span>
          </div>
        </div>

        <!-- Items Table -->
        <div class="border border-border rounded-xl overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase">Product</th>
                <th class="px-4 py-2.5 text-center text-[10px] font-semibold text-gray-400 uppercase">Qty</th>
                <th class="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase">Rate</th>
                <th class="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase">GST%</th>
                <th class="px-4 py-2.5 text-right text-[10px] font-semibold text-gray-400 uppercase">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              ${(inv.items || []).map(item => `
                <tr>
                  <td class="px-4 py-3 text-sm font-medium text-text">${escapeHtml(item.name)}</td>
                  <td class="px-4 py-3 text-sm text-gray-500 text-center">${item.qty}</td>
                  <td class="px-4 py-3 text-sm text-gray-500 text-right">₹${(item.price || 0).toLocaleString('en-IN')}</td>
                  <td class="px-4 py-3 text-sm text-gray-500 text-right">${item.taxRate || 0}%</td>
                  <td class="px-4 py-3 text-sm font-semibold text-text text-right">₹${((item.qty || 0) * (item.price || 0)).toFixed(2)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="bg-gray-50 p-4 rounded-xl space-y-2">
          <div class="flex justify-between text-sm"><span class="text-gray-500">Subtotal</span><span class="font-medium">₹${Number(inv.subtotal || 0).toFixed(2)}</span></div>
          ${Number(inv.discount || 0) > 0 ? `<div class="flex justify-between text-sm"><span class="text-gray-500">Discount</span><span class="font-medium text-success">- ₹${Number(inv.discount || 0).toFixed(2)}</span></div>` : ''}
          ${Number(inv.taxTotal || 0) > 0 ? `<div class="flex justify-between text-sm"><span class="text-gray-500">GST</span><span class="font-medium">+ ₹${Number(inv.taxTotal || 0).toFixed(2)}</span></div>` : ''}
          ${Number(inv.cgstTotal || 0) > 0 ? `<div class="flex justify-between text-xs text-gray-500 pl-4"><span class="text-gray-400">CGST</span><span>+ ₹${Number(inv.cgstTotal).toFixed(2)}</span></div>` : ''}
          ${Number(inv.sgstTotal || 0) > 0 ? `<div class="flex justify-between text-xs text-gray-500 pl-4"><span class="text-gray-400">SGST</span><span>+ ₹${Number(inv.sgstTotal).toFixed(2)}</span></div>` : ''}
          <div class="border-t border-border pt-2 flex justify-between text-base font-bold"><span>Total</span><span class="text-primary">₹${Number(inv.totalAmount || 0).toFixed(2)}</span></div>
        </div>
      </div>`;

    modal.querySelector('#close-invoice-modal').addEventListener('click', closeInvoiceModal);
    modal.querySelector('#print-from-modal').addEventListener('click', () => {
      printInvoice(inv);
    });
    modal.querySelector('#create-del-from-modal').addEventListener('click', () => {
      closeInvoiceModal();
      window.location.hash = '#/delivery';
      setTimeout(() => {
        const delForm = document.getElementById('delivery-form');
        if(delForm) {
          window.dispatchEvent(new CustomEvent('openDeliveryDrawer', {detail: null}));
          setTimeout(() => {
            document.getElementById('del-invoice').value = inv.id;
            document.getElementById('del-customer').value = inv.customerName || 'Walk-in Customer';
            document.getElementById('del-charge').value = 0;
            // Optionally, we could pre-fill address or phone if we have it in inv, but currently inv has customerId
          }, 100);
        }
      }, 100);
    });

    if (window.lucide) window.lucide.createIcons({ nodes: [modal] });

    modalOverlay.classList.remove('opacity-0', 'pointer-events-none');
    modalOverlay.classList.add('opacity-100');
    modal.classList.remove('scale-95', 'opacity-0');
    modal.classList.add('scale-100', 'opacity-100');
  };

  const closeInvoiceModal = () => {
    modalOverlay.classList.remove('opacity-100');
    modalOverlay.classList.add('opacity-0', 'pointer-events-none');
    modal.classList.remove('scale-100', 'opacity-100');
    modal.classList.add('scale-95', 'opacity-0');
  };

  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeInvoiceModal(); });

  // =====================
  // PRINT INVOICE
  // =====================

  const printInvoice = (inv) => {
    const settings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
    const shopName = settings.shopName || 'Senthil Enterprises';
    const date = new Date(inv.date).toLocaleString('en-IN');
    const receiptArea = document.getElementById('print-receipt-area');
    receiptArea.innerHTML = `
      <div class="receipt-title">${escapeHtml(shopName)}</div>
      <div class="receipt-divider"></div>
      <div style="font-size:11px;"><b>Invoice:</b> ${escapeHtml(inv.id)}</div>
      <div style="font-size:11px;"><b>Date:</b> ${date}</div>
      <div style="font-size:11px;"><b>Customer:</b> ${escapeHtml(inv.customerName || 'Walk-in')}</div>
      <div style="font-size:11px;"><b>Payment:</b> ${escapeHtml(inv.paymentMode)}</div>
      <div class="receipt-divider"></div>
      <table>
        <tr><th style="text-align:left">Item</th><th>Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Total</th></tr>
        ${(inv.items || []).map(item => `
          <tr>
            <td style="font-size:10px;">${escapeHtml(item.name)}</td>
            <td style="text-align:center">${item.qty}</td>
            <td style="text-align:right">₹${item.price}</td>
            <td style="text-align:right">₹${(item.qty * item.price).toFixed(2)}</td>
          </tr>`).join('')}
      </table>
      <div class="receipt-divider"></div>
      ${Number(inv.discount || 0) > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Discount</span><span>- ₹${Number(inv.discount).toFixed(2)}</span></div>` : ''}
      ${Number(inv.taxTotal || 0) > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Total GST</span><span>+ ₹${Number(inv.taxTotal).toFixed(2)}</span></div>` : ''}
      ${Number(inv.cgstTotal || 0) > 0 ? `<div style="display:flex;justify-content:space-between;font-size:10px;color:#666;"><span> - CGST</span><span>+ ₹${Number(inv.cgstTotal).toFixed(2)}</span></div>` : ''}
      ${Number(inv.sgstTotal || 0) > 0 ? `<div style="display:flex;justify-content:space-between;font-size:10px;color:#666;"><span> - SGST</span><span>+ ₹${Number(inv.sgstTotal).toFixed(2)}</span></div>` : ''}
      <div class="receipt-total" style="display:flex;justify-content:space-between;"><span>TOTAL</span><span>₹${Number(inv.totalAmount || 0).toFixed(2)}</span></div>
      <div class="receipt-divider"></div>
      <div style="text-align:center;font-size:10px;">Thank you!</div>`;
    window.print();
  };

  // =====================
  // TABLE EVENT DELEGATION
  // =====================

  const handleTableClick = (e) => {
    const viewBtn = e.target.closest('.view-invoice-btn');
    const printBtn = e.target.closest('.print-invoice-btn');
    if (viewBtn) {
      openInvoiceModal(viewBtn.getAttribute('data-id'));
    } else if (printBtn) {
      const inv = allInvoices.find(i => i.id === printBtn.getAttribute('data-id'));
      if (inv) printInvoice(inv);
    }
  };

  tbody.addEventListener('click', handleTableClick);

  // Header / empty-state navigation (delegated, no inline handlers)
  const handleNavClick = (e) => {
    const btn = e.target.closest('[data-sales-nav]');
    if (btn) window.location.hash = btn.getAttribute('data-sales-nav');
  };
  rootElement.addEventListener('click', handleNavClick);

  // ESC to close modal
  const keyHandler = (e) => { if (e.key === 'Escape') closeInvoiceModal(); };
  window.addEventListener('keydown', keyHandler);

  return function cleanup() {
    window.removeEventListener('keydown', keyHandler);
  };
}
