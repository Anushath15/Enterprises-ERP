import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Credit Management
 */
import { PrimaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export async function render() {
  const customers = DataProvider.getCustomers();
  const credits = customers.filter(c => c.outstanding > 0);

  const renderRow = (cust) => {
    const initials = cust.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    
    // Simple logic for status
    let status = 'Good';
    let statusColor = 'success';
    if (cust.outstanding >= (cust.creditLimit || 0) * 0.9 && cust.creditLimit > 0) {
      status = 'Warning';
      statusColor = 'warning';
    }
    if (cust.outstanding > (cust.creditLimit || 0)) {
      status = 'Overdue';
      statusColor = 'danger';
    }

    return `
    <tr class="row-hover cursor-pointer" data-credit-row="${escapeHtml(cust.id)}">
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="text-xs font-bold text-primary">${escapeHtml(initials)}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-text">${escapeHtml(cust.name)}</p>
            <p class="text-[10px] text-gray-400">${escapeHtml(cust.id)} • ${escapeHtml(cust.type)}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5 text-right font-semibold text-danger">₹${cust.outstanding.toLocaleString('en-IN')}</td>
      <td class="px-4 py-3.5 text-right text-sm text-gray-600">₹${(cust.creditLimit || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3.5 text-right font-medium text-warning">₹0</td>
      <td class="px-4 py-3.5 text-sm text-gray-500">-</td>
      <td class="px-4 py-3.5">
        <span class="status-badge status-${statusColor}">${escapeHtml(status)}</span>
      </td>
      <td class="px-4 py-3.5 text-right">
        <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100">
          <i data-lucide="indian-rupee" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>
    `;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Credit Management</h1>
          <p class="text-sm text-gray-400 mt-1">Track customer outstanding balances, credit limits, and collect payments.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="flex items-center gap-1.5 px-4 py-2 bg-white border border-border text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <i data-lucide="download" class="w-4 h-4"></i>
            Export Report
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${KPICard({ title: 'Total Outstanding', value: '₹' + credits.reduce((sum, c) => sum + (c.outstanding || 0), 0).toLocaleString('en-IN'), iconSvg: '<i data-lucide="trending-down"></i>', color: 'danger' })}
        ${KPICard({ title: 'Customers in Credit', value: credits.length.toString(), iconSvg: '<i data-lucide="users"></i>', color: 'warning' })}
        ${KPICard({ title: 'Overdue Amount', value: '₹0', iconSvg: '<i data-lucide="alert-circle"></i>', color: 'danger' })}
        ${KPICard({ title: 'Collections Today', value: '₹0', iconSvg: '<i data-lucide="check-circle"></i>', color: 'success' })}
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden">
        <div class="p-4 border-b border-border flex items-center justify-between bg-gray-50/50">
          <div class="relative w-72">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input type="text" id="credit-search" placeholder="Search customer..." class="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-primary">
          </div>
          <div class="flex gap-2">
            <select id="credit-status-filter" class="text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary">
              <option value="">All Customers</option>
              <option value="Overdue">Overdue</option>
              <option value="Warning">Warning (Near Limit)</option>
            </select>
          </div>
          <span id="credit-count-label" class="text-xs text-gray-400">Showing ${credits.length} accounts</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1000px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Customer</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Outstanding</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Credit Limit</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Due Amount</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Due Date</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="credit-tbody" class="divide-y divide-border">
              ${credits.length > 0 ? credits.map(renderRow).join('') : '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No customers in credit.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Right Drawer Overlay -->
    <div id="credit-drawer-overlay" class="overlay fixed inset-0 bg-black/30 z-[60] opacity-0 pointer-events-none transition-opacity duration-200"></div>
    
    <!-- Collect Payment Drawer -->
    <aside id="credit-form-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[600px] bg-white border-l border-border z-[70] overflow-y-auto shadow-2xl transition-transform duration-250 flex flex-col">
      <div class="flex items-center justify-between px-6 h-16 border-b border-border sticky top-0 bg-white z-10">
        <h3 class="text-base font-semibold text-text">Payment Collection</h3>
        <button class="close-credit-drawer p-1.5 rounded-md hover:bg-gray-100">
          <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto space-y-6">
        <!-- Customer Summary -->
        <div class="bg-gray-50 rounded-xl p-4 border border-border" id="credit-customer-summary">
          <!-- Populated by JS -->
        </div>

        <!-- Collection Form -->
        <div>
          <h4 class="text-sm font-semibold text-text mb-4">Record Payment</h4>
          <div class="space-y-4">
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Payment Date</label>
              <input type="date" id="credit-payment-date" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs font-medium text-gray-500 block mb-1.5">Amount Collected</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input type="number" id="credit-payment-amount" placeholder="0.00" class="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
                </div>
              </div>
              <div>
                <label class="text-xs font-medium text-gray-500 block mb-1.5">Payment Method</label>
                <select id="credit-payment-method" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer (NEFT/RTGS)</option>
                  <option>Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Reference No. (Cheque / UPI ID)</label>
              <input type="text" id="credit-payment-ref" placeholder="Enter reference number..." class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            </div>

            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Notes</label>
              <textarea id="credit-payment-notes" rows="2" placeholder="Partial payment for previous month..." class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary"></textarea>
            </div>
          </div>
        </div>
        
        <!-- Payment History Table -->
        <div>
          <h4 class="text-sm font-semibold text-text mb-3">Recent Payment History</h4>
          <div class="border border-border rounded-lg overflow-hidden">
            <table class="w-full text-xs">
              <thead class="bg-gray-50">
                <tr class="text-left text-gray-500 uppercase tracking-wide">
                  <th class="px-3 py-2 font-medium">Date</th>
                  <th class="px-3 py-2 font-medium">Method</th>
                  <th class="px-3 py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody id="credit-payment-history" class="divide-y divide-border">
                <tr><td colspan="3" class="px-3 py-4 text-center text-gray-400">Select a customer to view history</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button class="close-credit-drawer px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button id="save-credit-payment-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">Save Payment</button>
      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  const overlay = rootElement.querySelector('#credit-drawer-overlay');
  const formDrawer = rootElement.querySelector('#credit-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-credit-drawer');
  const tbody = rootElement.querySelector('#credit-tbody');
  const creditSearch = rootElement.querySelector('#credit-search');
  const creditStatusFilter = rootElement.querySelector('#credit-status-filter');
  const countLabel = rootElement.querySelector('#credit-count-label');
  let currentCustomerId = null;

  // Set default payment date to today
  const payDateInput = rootElement.querySelector('#credit-payment-date');
  if (payDateInput) payDateInput.value = new Date().toISOString().split('T')[0];

  const allCredits = DataProvider.getCustomers().filter(c => c.outstanding > 0);

  const renderRow = (cust) => {
    const initials = cust.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    let status = 'Good', statusColor = 'success';
    if (cust.outstanding >= (cust.creditLimit || 0) * 0.9 && cust.creditLimit > 0) { status = 'Warning'; statusColor = 'warning'; }
    if (cust.outstanding > (cust.creditLimit || 0) && cust.creditLimit > 0) { status = 'Overdue'; statusColor = 'danger'; }
    return `<tr class="row-hover cursor-pointer" data-credit-row="${escapeHtml(cust.id)}">
      <td class="px-4 py-3.5"><div class="flex items-center gap-2.5"><div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><span class="text-xs font-bold text-primary">${escapeHtml(initials)}</span></div><div><p class="text-sm font-medium text-text">${escapeHtml(cust.name)}</p><p class="text-[10px] text-gray-400">${escapeHtml(cust.id)} • ${escapeHtml(cust.type)}</p></div></div></td>
      <td class="px-4 py-3.5 text-right font-semibold text-danger">₹${cust.outstanding.toLocaleString('en-IN')}</td>
      <td class="px-4 py-3.5 text-right text-sm text-gray-600">₹${(cust.creditLimit || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3.5 text-right font-medium text-warning">₹0</td>
      <td class="px-4 py-3.5 text-sm text-gray-500">-</td>
      <td class="px-4 py-3.5"><span class="status-badge status-${statusColor}">${escapeHtml(status)}</span></td>
      <td class="px-4 py-3.5 text-right"><button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100"><i data-lucide="indian-rupee" class="w-4 h-4 pointer-events-none"></i></button></td>
    </tr>`;
  };

  // Search & filter wiring
  const applyFilter = () => {
    const q = (creditSearch?.value || '').toLowerCase();
    const statusF = creditStatusFilter?.value || '';
    const filtered = allCredits.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false;
      if (statusF) {
        let status = 'Good';
        if (c.outstanding >= (c.creditLimit || 0) * 0.9 && c.creditLimit > 0) status = 'Warning';
        if (c.outstanding > (c.creditLimit || 0) && c.creditLimit > 0) status = 'Overdue';
        if (status !== statusF) return false;
      }
      return true;
    });
    if (countLabel) countLabel.textContent = `Showing ${filtered.length} of ${allCredits.length} accounts`;
    if (tbody) {
      tbody.innerHTML = filtered.length > 0
        ? filtered.map(renderRow).join('')
        : '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400 text-sm">No accounts match your filter</td></tr>';
      if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
    }
  };
  const handleSearchInput = () => applyFilter();
  if (creditSearch) creditSearch.addEventListener('input', handleSearchInput);
  if (creditStatusFilter) creditStatusFilter.addEventListener('change', applyFilter);

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  const openForm = (e) => {
    currentCustomerId = e.detail;
    const cust = DataProvider.getCustomerById(currentCustomerId);
    if (cust) {
      rootElement.querySelector('#credit-customer-summary').innerHTML = `
        <div class="flex justify-between items-start mb-4">
          <div>
            <h4 class="font-semibold text-text text-lg">${escapeHtml(cust.name)}</h4>
            <p class="text-xs text-gray-500 mt-0.5">${escapeHtml(cust.type)} • ${escapeHtml(cust.id)}</p>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 border-t border-border pt-4">
          <div><p class="text-[10px] text-gray-500 uppercase tracking-wide">Outstanding</p><p class="font-bold text-danger">₹${(cust.outstanding || 0).toLocaleString('en-IN')}</p></div>
          <div><p class="text-[10px] text-gray-500 uppercase tracking-wide">Credit Limit</p><p class="font-semibold text-text">₹${(cust.creditLimit || 0).toLocaleString('en-IN')}</p></div>
          <div><p class="text-[10px] text-gray-500 uppercase tracking-wide">Phone</p><p class="font-semibold text-text">${escapeHtml(cust.phone || '-')}</p></div>
        </div>`;

      // Load real payment history from invoices
      const invoices = DataProvider.getSalesInvoices().filter(inv => inv.customerId === currentCustomerId && inv.amountPaid > 0);
      const payHistTbody = rootElement.querySelector('#credit-payment-history');
      if (payHistTbody) {
        payHistTbody.innerHTML = invoices.length > 0
          ? invoices.slice(0, 10).map(inv => `<tr><td class="px-3 py-2 text-text">${escapeHtml(inv.date || '-')}</td><td class="px-3 py-2 text-gray-600">${escapeHtml(inv.paymentMethod || 'Cash')} (${escapeHtml(inv.id)})</td><td class="px-3 py-2 text-right font-medium text-success">+ ₹${Number(inv.amountPaid || 0).toLocaleString('en-IN')}</td></tr>`).join('')
          : '<tr><td colspan="3" class="px-3 py-4 text-center text-gray-400">No payment records found</td></tr>';
      }
    }
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  const handleRowClick = (e) => {
    const row = e.target.closest('[data-credit-row]');
    if (!row) return;
    const id = row.getAttribute('data-credit-row');
    if (id) window.dispatchEvent(new CustomEvent('openCreditDrawer', { detail: id }));
  };
  if (tbody) tbody.addEventListener('click', handleRowClick);

  const handleSavePayment = () => {
    if (!currentCustomerId) return;
    const amount = parseFloat(rootElement.querySelector('#credit-payment-amount')?.value) || 0;
    if (amount <= 0) { NotificationService.warning('Please enter a valid payment amount.'); return; }

    try {
      DataProvider.updateCustomerBalance(currentCustomerId, -amount);
      closeAll();
      // In-place update the row
      const cust = DataProvider.getCustomerById(currentCustomerId);
      if (cust) {
        const row = tbody?.querySelector(`tr[data-credit-row="${currentCustomerId}"]`);
        if (row) {
          const outstandingTd = row.querySelectorAll('td')[1];
          if (outstandingTd) outstandingTd.textContent = '₹' + (cust.outstanding || 0).toLocaleString('en-IN');
        }
        // Remove row if outstanding is now 0
        if ((cust.outstanding || 0) <= 0) {
          const rowToRemove = tbody?.querySelector(`tr[data-credit-row="${currentCustomerId}"]`);
          if (rowToRemove) { rowToRemove.style.opacity = '0'; setTimeout(() => rowToRemove.remove(), 300); }
        }
      }
      NotificationService.success(`Payment of ₹${amount.toLocaleString('en-IN')} recorded.`);
    } catch (err) {
      NotificationService.error(err.message);
    }
  };
  const saveBtn = rootElement.querySelector('#save-credit-payment-btn');
  if (saveBtn) saveBtn.addEventListener('click', handleSavePayment);

  window.addEventListener('openCreditDrawer', openForm);

  const handleCloseClick = () => closeAll();
  closeBtns.forEach(btn => btn.addEventListener('click', handleCloseClick));
  overlay.addEventListener('click', handleCloseClick);
  
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Cleanup: prevent duplicate listeners on back-navigation
  return function cleanup() {
    window.removeEventListener('openCreditDrawer', openForm);
    if (creditSearch) creditSearch.removeEventListener('input', handleSearchInput);
    if (creditStatusFilter) creditStatusFilter.removeEventListener('change', applyFilter);
    if (tbody) tbody.removeEventListener('click', handleRowClick);
    if (saveBtn) saveBtn.removeEventListener('click', handleSavePayment);
    closeBtns.forEach(btn => btn.removeEventListener('click', handleCloseClick));
    overlay.removeEventListener('click', handleCloseClick);
  };
}
