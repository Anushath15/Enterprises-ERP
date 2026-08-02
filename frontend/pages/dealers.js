import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Dealers (Suppliers) Module
 */
import { PrimaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { validateForm, rules } from '../utils/validate.js';

export async function render() {
  const dealers = DataProvider.getDealers() || [];
  
  const renderRow = (d) => {
    return `
    <tr class="row-hover cursor-pointer" data-dealer-row="${escapeHtml(d.id)}">
      <td class="px-4 py-3.5 text-left">
        <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-primary">
      </td>
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase">
            ${escapeHtml((d.companyName || d.name || 'D').substring(0, 2))}
          </div>
          <div>
            <p class="text-sm font-semibold text-text">${escapeHtml(d.companyName || d.name)}</p>
            <p class="text-[10px] text-gray-500 font-medium">${escapeHtml(d.contactPerson || d.name)} ${d.gst ? `• GST: ${escapeHtml(d.gst)}` : ''}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5 text-sm font-medium text-text">${escapeHtml(d.phone || '-')}</td>
      <td class="px-4 py-3.5 text-right font-bold text-text">₹${(d.totalPurchased || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
      <td class="px-4 py-3.5 text-right">
        <span class="font-bold ${d.outstanding > 0 ? 'text-danger' : 'text-success'}">₹${(d.outstanding || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</span>
      </td>
      <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(d.latestPurchase || 'Never')}</td>
      <td class="px-4 py-3.5 text-center">
        <span class="status-badge ${d.status === 'Active' ? 'status-success' : 'status-warning'}">${escapeHtml(d.status || 'Active')}</span>
      </td>
      <td class="px-4 py-3.5 text-center">
        <button class="dealer-delete-btn p-1.5 rounded-lg text-gray-400 hover:text-danger transition-colors" data-dealer-id="${escapeHtml(d.id)}" title="Delete Dealer">
          <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>
    `;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto pb-20 fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Dealers &amp; Suppliers</h1>
          <p class="text-sm text-gray-400 mt-0.5">Manage vendor accounts, purchase history, and payable ledgers.</p>
        </div>
        <button id="add-new-dealer" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
          <i data-lucide="plus" class="w-4 h-4"></i> New Dealer
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        ${KPICard({ title: 'Total Dealers', value: dealers.length.toString(), iconSvg: '<i data-lucide="truck"></i>', color: 'primary' })}
        ${KPICard({ title: 'Total Purchases', value: '₹' + dealers.reduce((sum, d) => sum + (d.totalPurchased || 0), 0).toLocaleString('en-IN'), iconSvg: '<i data-lucide="shopping-bag"></i>', color: 'success' })}
        ${KPICard({ title: 'With Outstanding', value: dealers.filter(d => d.outstanding > 0).length.toString(), iconSvg: '<i data-lucide="alert-circle"></i>', color: 'warning' })}
        ${KPICard({ title: 'Total Payable', value: '₹' + dealers.reduce((sum, d) => sum + (d.outstanding || 0), 0).toLocaleString('en-IN'), iconSvg: '<i data-lucide="credit-card"></i>', color: 'danger' })}
      </div>

      <!-- Search & Filter -->
      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="dealer-search" placeholder="Search by company, name, phone, GST..."
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
        </div>
        <select id="dealer-status-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="outstanding">Has Outstanding</option>
        </select>
        <span id="dealer-count-label" class="text-xs text-gray-400 ml-auto">Showing ${dealers.length} dealers</span>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border bg-gray-50/50">
                <th class="w-10 px-5 py-3"></th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Company &amp; Contact</th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Phone</th>
                <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Total Purchased</th>
                <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Payable Balance</th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Last Purchase</th>
                <th class="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th class="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody id="dealers-tbody" class="divide-y divide-border">
              ${dealers.length ? dealers.map(d => renderRow(d)).join('') : '<tr><td colspan="8" class="px-4 py-12 text-center text-gray-400 text-sm">No dealers found.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Dealer Overlay / Drawer -->
    <div id="dealer-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 opacity-0 pointer-events-none transition-opacity duration-300"></div>
    
    <aside id="dealer-drawer" class="fixed top-0 right-0 h-screen w-full md:w-[850px] bg-gray-50 border-l border-border z-[60] drawer-exit flex flex-col shadow-2xl">
      <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-border shadow-sm z-10">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-primary/10 rounded-lg text-primary">
            <i data-lucide="truck" class="w-5 h-5"></i>
          </div>
          <h3 class="text-lg font-bold text-text" id="drawer-title">New Dealer Profile</h3>
        </div>
        <button class="close-dealer-drawer p-2 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10 transition-colors">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      
      <!-- Tabs -->
      <div class="bg-white px-6 border-b border-border flex gap-6" id="dealer-tabs">
        <button class="d-tab-btn active px-1 py-3 text-sm font-semibold border-b-2 border-primary text-primary" data-target="tab-profile">Profile</button>
        <button class="d-tab-btn px-1 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 hidden" data-target="tab-ledger">Ledger & History</button>
        <button class="d-tab-btn px-1 py-3 text-sm font-semibold border-b-2 border-transparent text-gray-500 hover:text-gray-700 hidden" data-target="tab-notes">Notes</button>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <form id="dealer-form" class="space-y-6">
          <input type="hidden" id="d-id">
          
          <!-- TAB: PROFILE -->
          <div id="tab-profile" class="d-tab-content space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div class="bg-white p-5 rounded-xl border border-border shadow-sm">
                <h4 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="building-2" class="w-4 h-4 text-primary"></i> Company Details</h4>
                <div class="space-y-4">
                  <div><label class="block text-xs font-semibold text-gray-600 mb-1">Company / Shop Name *</label><input type="text" id="d-company" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                  <div><label class="block text-xs font-semibold text-gray-600 mb-1">Contact Person (Name) *</label><input type="text" id="d-name" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                  <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-xs font-semibold text-gray-600 mb-1">GST Number</label><input type="text" id="d-gst" class="w-full px-3 py-2 border rounded-lg text-sm uppercase focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                    <div><label class="block text-xs font-semibold text-gray-600 mb-1">PAN Number</label><input type="text" id="d-pan" class="w-full px-3 py-2 border rounded-lg text-sm uppercase focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                  </div>
                </div>
              </div>
              
              <div class="bg-white p-5 rounded-xl border border-border shadow-sm">
                <h4 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="map-pin" class="w-4 h-4 text-primary"></i> Contact & Address</h4>
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-xs font-semibold text-gray-600 mb-1">Phone *</label><input type="tel" id="d-phone" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                    <div><label class="block text-xs font-semibold text-gray-600 mb-1">Email</label><input type="email" id="d-email" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                  </div>
                  <div><label class="block text-xs font-semibold text-gray-600 mb-1">Billing Address</label><input type="text" id="d-address" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                  <div class="grid grid-cols-3 gap-4">
                    <div><label class="block text-xs font-semibold text-gray-600 mb-1">City</label><input type="text" id="d-city" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                    <div><label class="block text-xs font-semibold text-gray-600 mb-1">State</label><input type="text" id="d-state" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                    <div><label class="block text-xs font-semibold text-gray-600 mb-1">PIN</label><input type="text" id="d-pin" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                  </div>
                </div>
              </div>
              
              <div class="bg-white p-5 rounded-xl border border-border shadow-sm md:col-span-2">
                <h4 class="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><i data-lucide="briefcase" class="w-4 h-4 text-primary"></i> Commercial Terms</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="space-y-4">
                    <div><label class="block text-xs font-semibold text-gray-600 mb-1">Sales Rep</label><input type="text" id="d-salesrep" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                    <div><label class="block text-xs font-semibold text-gray-600 mb-1">Collection Agent</label><input type="text" id="d-collection" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                  </div>
                  <div class="space-y-4">
                    <div><label class="block text-xs font-semibold text-gray-600 mb-1">Credit Limit (₹)</label><input type="number" id="d-credit-limit" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"></div>
                    <div>
                      <label class="block text-xs font-semibold text-gray-600 mb-1">Payment Terms</label>
                      <select id="d-payment-terms" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary">
                        <option value="Net 0">Immediate (Net 0)</option>
                        <option value="Net 15">Net 15 Days</option>
                        <option value="Net 30">Net 30 Days</option>
                        <option value="Net 45">Net 45 Days</option>
                        <option value="Net 60">Net 60 Days</option>
                      </select>
                    </div>
                  </div>
                  <div class="space-y-4">
                    <div class="h-full flex flex-col">
                      <label class="block text-xs font-semibold text-gray-600 mb-1">Bank Account Details</label>
                      <textarea id="d-bank" class="w-full flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" placeholder="Bank Name, A/C No, IFSC..."></textarea>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          <!-- TAB: LEDGER & HISTORY -->
          <div id="tab-ledger" class="d-tab-content hidden space-y-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="p-4 bg-white border border-border rounded-xl shadow-sm"><p class="text-xs text-gray-500 font-medium">Total Purchased</p><p class="text-xl font-bold text-text mt-1" id="lbl-total-purchased">₹0</p></div>
              <div class="p-4 bg-red-50 border border-red-100 rounded-xl shadow-sm"><p class="text-xs text-danger font-medium">Payable Amount</p><p class="text-xl font-bold text-danger mt-1" id="lbl-payable">₹0</p></div>
              <div class="p-4 bg-white border border-border rounded-xl shadow-sm"><p class="text-xs text-gray-500 font-medium">Total Payments</p><p class="text-xl font-bold text-gray-700 mt-1" id="lbl-total-paid">₹0</p></div>
              <div class="p-4 bg-orange-50 border border-orange-100 rounded-xl shadow-sm"><p class="text-xs text-orange-600 font-medium">Pending Deliveries</p><p class="text-xl font-bold text-orange-700 mt-1">0</p></div>
            </div>
            
            <div class="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <div class="px-5 py-3 bg-gray-50 border-b border-border flex justify-between items-center">
                <h4 class="font-bold text-sm text-gray-700">Purchase Invoices</h4>
              </div>
              <div class="max-h-64 overflow-y-auto">
                <table class="w-full text-sm">
                  <thead class="bg-white sticky top-0 shadow-sm"><tr><th class="p-3 text-left">Date</th><th class="p-3 text-left">Invoice No</th><th class="p-3 text-left">Status</th><th class="p-3 text-right">Amount</th></tr></thead>
                  <tbody id="dealer-history-tbody"></tbody>
                </table>
              </div>
            </div>

            <div class="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <div class="px-5 py-3 bg-gray-50 border-b border-border flex justify-between items-center">
                <h4 class="font-bold text-sm text-gray-700">Payment History</h4>
              </div>
              <div class="p-6 text-center text-gray-500 text-sm">
                <i data-lucide="receipt" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                No payments recorded yet.
              </div>
            </div>
          </div>

          <!-- TAB: NOTES -->
          <div id="tab-notes" class="d-tab-content hidden h-full">
            <div class="bg-white p-5 rounded-xl border border-border shadow-sm h-full flex flex-col">
              <h4 class="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><i data-lucide="sticky-note" class="w-4 h-4 text-primary"></i> Internal Notes</h4>
              <textarea id="d-notes" class="w-full flex-1 min-h-[300px] px-4 py-3 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-yellow-50/30" placeholder="Type internal remarks, agreements, or issues regarding this dealer here..."></textarea>
            </div>
          </div>

        </form>
      </div>
      
      <div class="p-5 bg-white border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-end gap-3 z-10">
        <button type="button" class="close-dealer-drawer px-5 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
        <button id="save-d-btn" type="button" class="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
          <i data-lucide="save" class="w-4 h-4"></i> Save Dealer Profile
        </button>
      </div>
    </aside>
  `;
}

export function onMount() {
  if (window.lucide) window.lucide.createIcons();

  // --- SEARCH & FILTER WIRING (DL-001) ---
  const allDealers = DataProvider.getDealers() || [];
  const dealerSearch = document.getElementById('dealer-search');
  const dealerStatusFilter = document.getElementById('dealer-status-filter');
  const dealersTbody = document.getElementById('dealers-tbody');
  const dealerCountLabel = document.getElementById('dealer-count-label');

  const applyDealerFilter = () => {
    const q = (dealerSearch?.value || '').toLowerCase();
    const status = dealerStatusFilter?.value || '';
    const filtered = allDealers.filter(d => {
      if (q && !(d.companyName || '').toLowerCase().includes(q) && !(d.name || '').toLowerCase().includes(q) && !(d.phone || '').includes(q) && !(d.gst || '').toLowerCase().includes(q)) return false;
      if (status === 'Active' && d.status !== 'Active') return false;
      if (status === 'outstanding' && !(d.outstanding > 0)) return false;
      return true;
    });
    if (dealerCountLabel) dealerCountLabel.textContent = `Showing ${filtered.length} of ${allDealers.length} dealers`;
    if (dealersTbody) {
      if (filtered.length === 0) {
        dealersTbody.innerHTML = '<tr><td colspan="8" class="px-4 py-12 text-center text-gray-400 text-sm">No dealers match your search</td></tr>';
      } else {
        dealersTbody.innerHTML = filtered.map(d => `
          <tr class="row-hover cursor-pointer" data-dealer-row="${escapeHtml(d.id)}">
            <td class="px-4 py-3.5"><input type="checkbox" class="w-4 h-4 rounded border-gray-300"></td>
            <td class="px-4 py-3.5"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">${escapeHtml((d.companyName || d.name || 'D').substring(0, 2).toUpperCase())}</div><div><p class="text-sm font-semibold text-text">${escapeHtml(d.companyName || d.name)}</p><p class="text-[10px] text-gray-500">${escapeHtml(d.contactPerson || d.name)}${d.gst ? ` • ${escapeHtml(d.gst)}` : ''}</p></div></div></td>
            <td class="px-4 py-3.5 text-sm font-medium text-text">${escapeHtml(d.phone || '-')}</td>
            <td class="px-4 py-3.5 text-right font-bold text-text">₹${(d.totalPurchased || 0).toLocaleString('en-IN')}</td>
            <td class="px-4 py-3.5 text-right"><span class="font-bold ${d.outstanding > 0 ? 'text-danger' : 'text-success'}">₹${(d.outstanding || 0).toLocaleString('en-IN')}</span></td>
            <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(d.latestPurchase || 'Never')}</td>
            <td class="px-4 py-3.5 text-center"><span class="status-badge ${d.status === 'Active' ? 'status-success' : 'status-gray'}">${escapeHtml(d.status || 'Active')}</span></td>
            <td class="px-4 py-3.5 text-center"><button class="dealer-delete-btn p-1.5 rounded-lg text-gray-400 hover:text-danger" data-dealer-id="${escapeHtml(d.id)}" title="Delete Dealer"><i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i></button></td>
          </tr>`).join('');
        if (window.lucide) window.lucide.createIcons({ nodes: [dealersTbody] });
      }
    }
  };
  if (dealerSearch) dealerSearch.addEventListener('input', applyDealerFilter);
  if (dealerStatusFilter) dealerStatusFilter.addEventListener('change', applyDealerFilter);

  const overlay = document.getElementById('dealer-overlay');
  const drawer = document.getElementById('dealer-drawer');
  
  const closeAll = () => {
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    drawer.classList.remove('drawer-enter-active');
    drawer.classList.add('drawer-exit-active');
  };

  // Tab switching logic
  const tabBtns = document.querySelectorAll('.d-tab-btn');
  const tabContents = document.querySelectorAll('.d-tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-target');
      
      tabBtns.forEach(b => {
        b.classList.remove('active', 'border-primary', 'text-primary');
        b.classList.add('border-transparent', 'text-gray-500');
      });
      btn.classList.add('active', 'border-primary', 'text-primary');
      btn.classList.remove('border-transparent', 'text-gray-500');
      
      tabContents.forEach(c => c.classList.add('hidden'));
      document.getElementById(target).classList.remove('hidden');
    });
  });

  const openForm = (id = null) => {
    const title = document.getElementById('drawer-title');
    const form = document.getElementById('dealer-form');
    form.reset();
    document.getElementById('d-id').value = '';
    
    // Reset tabs to profile
    document.querySelector('.d-tab-btn[data-target="tab-profile"]').click();
    
    const ledgerTabBtns = document.querySelectorAll('.d-tab-btn[data-target="tab-ledger"], .d-tab-btn[data-target="tab-notes"]');
    
    if (id) {
      title.textContent = 'Edit Dealer Profile';
      ledgerTabBtns.forEach(b => b.classList.remove('hidden'));
      
      import('../services/dataProvider.js').then(({ DataProvider }) => {
        const d = DataProvider.getDealerById(id);
        if (d) {
          document.getElementById('d-id').value = d.id;
          document.getElementById('d-name').value = d.contactPerson || d.name || '';
          document.getElementById('d-company').value = d.companyName || d.name || '';
          document.getElementById('d-gst').value = d.gst || '';
          document.getElementById('d-pan').value = d.pan || '';
          document.getElementById('d-phone').value = d.phone || '';
          document.getElementById('d-email').value = d.email || '';
          document.getElementById('d-address').value = d.address || '';
          document.getElementById('d-city').value = d.city || '';
          document.getElementById('d-state').value = d.state || '';
          document.getElementById('d-pin').value = d.pin || '';
          document.getElementById('d-salesrep').value = d.salesRep || '';
          document.getElementById('d-collection').value = d.collectionAgent || '';
          document.getElementById('d-credit-limit').value = d.creditLimit || '';
          document.getElementById('d-payment-terms').value = d.paymentTerms || 'Net 0';
          document.getElementById('d-bank').value = d.bankDetails || '';
          document.getElementById('d-notes').value = d.notes || '';
          
          document.getElementById('lbl-total-purchased').textContent = '₹' + (d.totalPurchased || 0).toLocaleString('en-IN', {minimumFractionDigits:2});
          document.getElementById('lbl-payable').textContent = '₹' + (d.outstanding || 0).toLocaleString('en-IN', {minimumFractionDigits:2});
          document.getElementById('lbl-total-paid').textContent = '₹' + ((d.totalPurchased || 0) - (d.outstanding || 0)).toLocaleString('en-IN', {minimumFractionDigits:2});
          
          const invoices = DataProvider.getPurchaseInvoices().filter(inv => inv.dealerId === d.id);
          const tbody = document.getElementById('dealer-history-tbody');
          tbody.innerHTML = invoices.map(i => `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
              <td class="p-3 font-medium text-gray-700">${escapeHtml(i.date.split('T')[0])}</td>
              <td class="p-3 text-primary font-bold">#${escapeHtml(i.id)}</td>
              <td class="p-3"><span class="status-badge ${i.status === 'Paid' ? 'status-success' : 'status-warning'}">${escapeHtml(i.status || 'Pending')}</span></td>
              <td class="p-3 text-right font-bold text-gray-800">₹${i.totalAmount.toLocaleString('en-IN', {minimumFractionDigits:2})}</td>
            </tr>
          `).join('') || '<tr><td colspan="4" class="p-6 text-center text-gray-400">No purchase history available.</td></tr>';
        }
      });
    } else {
      title.textContent = 'New Dealer Profile';
      ledgerTabBtns.forEach(b => b.classList.add('hidden'));
    }
    
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    drawer.classList.remove('drawer-exit-active', 'drawer-exit');
    drawer.classList.add('drawer-enter-active');
  };

  const addBtn = document.getElementById('add-new-dealer');
  if (addBtn) addBtn.addEventListener('click', () => openForm());
  
  const handleOpenDealer = (e) => openForm(e.detail);
  window.addEventListener('openDealerDrawer', handleOpenDealer);

  const handleDeleteDealer = (e) => {
    if (!window.confirm('Delete this dealer? This cannot be undone.')) return;
    DataProvider.deleteDealer(e.detail);
    const row = document.querySelector(`#dealers-tbody tr[data-dealer-row="${e.detail}"]`);
    if (row) { row.style.transition = 'opacity 0.3s'; row.style.opacity = '0'; setTimeout(() => row.remove(), 300); }
    NotificationService.success('Dealer deleted');
  };
  window.addEventListener('deleteDealer', handleDeleteDealer);

  // Delegated table clicks (replaces inline onclick)
  const handleDealersTableClick = (e) => {
    const delBtn = e.target.closest('.dealer-delete-btn');
    if (delBtn) {
      e.stopPropagation();
      handleDeleteDealer({ detail: delBtn.getAttribute('data-dealer-id') });
      return;
    }
    const row = e.target.closest('[data-dealer-row]');
    if (row) openForm(row.getAttribute('data-dealer-row'));
  };
  dealersTbody.addEventListener('click', handleDealersTableClick);

  const closeBtns = document.querySelectorAll('.close-dealer-drawer');
  closeBtns.forEach(b => b.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);

  const saveBtn = document.getElementById('save-d-btn');
  if (saveBtn) {
    const formEl = document.getElementById('dealer-form');
    if (formEl) DraftManager.init('dealer', formEl);

    saveBtn.addEventListener('click', () => {
      const form = document.getElementById('dealer-form');
      if (!form.reportValidity()) return;
      
      const field = (id) => document.getElementById(id);
      const validationError = validateForm([
        { el: field('d-company'), check: (v) => rules.required(v, 'Company / shop name') || rules.maxLength(v, 100, 'Company / shop name') },
        { el: field('d-name'), check: (v) => rules.required(v, 'Contact person') || rules.maxLength(v, 100, 'Contact person') },
        { el: field('d-phone'), check: (v) => rules.required(v, 'Phone') || rules.phone(v, 'Phone') },
        { el: field('d-email'), check: (v) => rules.maxLength(v, 120, 'Email') },
        { el: field('d-gst'), check: (v) => rules.gstin(v) },
        { el: field('d-pan'), check: (v) => rules.pan(v) },
        { el: field('d-pin'), check: (v) => rules.pin(v) },
        { el: field('d-credit-limit'), check: (v) => rules.number(v, 'Credit limit') || rules.nonNegative(v, 'Credit limit') },
        { el: field('d-address'), check: (v) => rules.maxLength(v, 200, 'Billing address') },
        { el: field('d-bank'), check: (v) => rules.maxLength(v, 300, 'Bank details') },
        { el: field('d-notes'), check: (v) => rules.maxLength(v, 1000, 'Notes') }
      ]);
      if (validationError) {
        NotificationService.error(validationError);
        return;
      }
      
      const dealer = {
        id: document.getElementById('d-id').value || null,
        name: document.getElementById('d-name').value, // Contact Person
        contactPerson: document.getElementById('d-name').value,
        companyName: document.getElementById('d-company').value,
        gst: document.getElementById('d-gst').value,
        pan: document.getElementById('d-pan').value,
        phone: document.getElementById('d-phone').value,
        email: document.getElementById('d-email').value,
        address: document.getElementById('d-address').value,
        city: document.getElementById('d-city').value,
        state: document.getElementById('d-state').value,
        pin: document.getElementById('d-pin').value,
        salesRep: document.getElementById('d-salesrep').value,
        collectionAgent: document.getElementById('d-collection').value,
        creditLimit: Number(document.getElementById('d-credit-limit').value || 0),
        paymentTerms: document.getElementById('d-payment-terms').value,
        bankDetails: document.getElementById('d-bank').value,
        notes: document.getElementById('d-notes').value,
        status: 'Active'
      };
      
      try {
        DataProvider.saveDealer(dealer);
        DraftManager.clearDraft('dealer');
        closeAll();
        // In-place table refresh
        const freshDealers = DataProvider.getDealers();
        const tbody = document.getElementById('dealers-tbody');
        if (tbody) {
          tbody.innerHTML = freshDealers.length > 0
            ? freshDealers.map(d => {
                return `<tr class="row-hover cursor-pointer" data-dealer-row="${escapeHtml(d.id)}">
                  <td class="px-4 py-3.5"><input type="checkbox" class="w-4 h-4 rounded border-gray-300"></td>
                  <td class="px-4 py-3.5"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">${escapeHtml((d.companyName || d.name || 'D').substring(0,2).toUpperCase())}</div><div><p class="text-sm font-semibold text-text">${escapeHtml(d.companyName || d.name)}</p><p class="text-[10px] text-gray-500">${escapeHtml(d.contactPerson || d.name)}${d.gst ? ` • ${escapeHtml(d.gst)}` : ''}</p></div></div></td>
                  <td class="px-4 py-3.5 text-sm font-medium text-text">${escapeHtml(d.phone || '-')}</td>
                  <td class="px-4 py-3.5 text-right font-bold text-text">₹${(d.totalPurchased||0).toLocaleString('en-IN')}</td>
                  <td class="px-4 py-3.5 text-right"><span class="font-bold ${d.outstanding > 0 ? 'text-danger' : 'text-success'}">₹${(d.outstanding||0).toLocaleString('en-IN')}</span></td>
                  <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(d.latestPurchase || 'Never')}</td>
                  <td class="px-4 py-3.5 text-center"><span class="status-badge ${d.status === 'Active' ? 'status-success' : 'status-gray'}">${escapeHtml(d.status || 'Active')}</span></td>
                  <td class="px-4 py-3.5 text-center"><button class="dealer-delete-btn p-1.5 rounded-lg text-gray-400 hover:text-danger" data-dealer-id="${escapeHtml(d.id)}" title="Delete Dealer"><i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i></button></td>
                </tr>`;
              }).join('')
            : '<tr><td colspan="8" class="px-4 py-12 text-center text-gray-400">No dealers</td></tr>';
          if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
        }
        NotificationService.success('Dealer saved!');
      } catch (err) {
        NotificationService.error(err.message);
      }
    });
  }

  return function cleanup() {
    window.removeEventListener('openDealerDrawer', handleOpenDealer);
    window.removeEventListener('deleteDealer', handleDeleteDealer);
  };
}
