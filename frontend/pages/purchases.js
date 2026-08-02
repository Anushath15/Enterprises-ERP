import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Purchases Page Controller
 */
import { PrimaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export async function render() {
  const purchases = DataProvider.getPurchaseInvoices();
  const dealers = DataProvider.getDealers();

  const renderPORow = (po) => {
    const dealer = DataProvider.getDealerById(po.dealerId) || { companyName: 'Unknown', phone: '' };
    const dealerName = dealer.companyName || dealer.name || 'Unknown';
    const initials = dealerName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    const dealerColor = 'primary'; 
    const statusColor = po.status === 'Pending' ? 'warning' : (po.status === 'Received' ? 'success' : 'danger');

    return `
    <tr class="row-hover cursor-pointer" data-id="${escapeHtml(po.id)}" data-open-po="${escapeHtml(po.id)}">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(po.invoiceNumber || po.id)}</td>
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-${dealerColor}/10 flex items-center justify-center">
            <span class="text-[10px] font-bold text-${dealerColor}">${escapeHtml(initials)}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-text">${escapeHtml(dealerName)}</p>
            <p class="text-[10px] text-gray-400">${escapeHtml(dealer.phone)}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5 text-sm ${statusColor === 'danger' ? 'text-danger font-medium' : 'text-gray-500'}">${escapeHtml(po.date)}</td>
      <td class="px-4 py-3.5 text-sm text-gray-500">${po.items ? po.items.length : 0} items</td>
      <td class="px-4 py-3.5 text-right text-sm font-semibold text-text">₹${(po.totalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      <td class="px-4 py-3.5">
        <span class="status-badge status-${statusColor}">${escapeHtml(po.status)}</span>
      </td>
      <td class="px-4 py-3.5 text-right">
        <div class="flex items-center justify-end gap-1">
          <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-open-po-new title="New Purchase Order">
            <i data-lucide="edit" class="w-4 h-4"></i>
          </button>
        </div>
      </td>
    </tr>
    `;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Purchase Management</h1>
          <p class="text-sm text-gray-400 mt-1">Track purchase orders, manage suppliers, and monitor deliveries.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="btn-new-po" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors btn-primary">
            <i data-lucide="plus" class="w-4 h-4"></i>
            New Purchase Order
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${KPICard({ title: 'Pending Orders', value: purchases.filter(p => p.status === 'Pending').length.toString(), iconSvg: '<i data-lucide="clock"></i>', color: 'warning' })}
        ${KPICard({ title: 'Total Purchases', value: purchases.length.toString(), iconSvg: '<i data-lucide="shopping-bag"></i>', color: 'success' })}
        ${KPICard({ title: 'Purchase Value', value: '₹' + purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString('en-IN', {maximumFractionDigits:0}), iconSvg: '<i data-lucide="indian-rupee"></i>', color: 'primary' })}
        ${KPICard({ title: 'Awaiting Delivery', value: purchases.filter(p => p.status === 'Pending').length.toString(), iconSvg: '<i data-lucide="truck"></i>', color: 'danger' })}
      </div>

      </div>

      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div class="xl:col-span-3 space-y-6">
          <div class="bg-white rounded-xl border border-border p-4">
            <div class="flex flex-wrap items-center gap-3">
              <div class="relative flex-1 min-w-[200px]">
                <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input id="po-search" type="text" placeholder="Search PO, dealer..." class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-primary">
              </div>
              <select id="po-status-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary">
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Received">Received</option>
                <option value="Overdue">Overdue</option>
              </select>
              <span id="po-count-label" class="text-xs text-gray-400">Showing ${purchases.length} orders</span>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-border overflow-hidden">
            <div class="overflow-x-auto">
              <table id="purchases-table" class="w-full text-sm min-w-[1100px]">
                <thead>
                  <tr class="border-b border-border bg-gray-50/60 text-left">
                    <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">PO #</th>
                    <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Dealer</th>
                    <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Expected Date</th>
                    <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Items</th>
                    <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Amount</th>
                    <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                    <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  ${purchases.length > 0 ? purchases.map(renderPORow).join('') : '<tr><td colspan="7"><div class="empty-state"><i data-lucide="shopping-cart"></i><p>No purchases found.</p></div></td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="xl:col-span-1 hidden xl:block">
          <div class="bg-white rounded-xl border border-border p-5 sticky top-24">
            <h3 class="text-sm font-bold text-text mb-4">Supplier Performance</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between border-b border-border pb-3">
                <span class="text-xs text-gray-500">On-Time Delivery</span>
                <span class="text-sm font-semibold text-success">94%</span>
              </div>
              <div class="flex items-center justify-between border-b border-border pb-3">
                <span class="text-xs text-gray-500">Return Rate</span>
                <span class="text-sm font-semibold text-danger">2.4%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Drawer Overlay -->
    <div id="purchase-drawer-overlay" class="overlay fixed inset-0 bg-black/30 z-[60] opacity-0 pointer-events-none transition-opacity duration-200"></div>
    
    <!-- New Purchase Order Drawer -->
    <aside id="purchase-form-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[600px] bg-white border-l border-border z-[70] overflow-y-auto shadow-2xl transition-transform duration-250 flex flex-col">
      <div class="flex items-center justify-between px-6 h-16 border-b border-border sticky top-0 bg-white z-10 shrink-0">
        <h3 class="text-base font-semibold text-text">New Purchase Order</h3>
        <button class="close-purchase-drawer p-1.5 rounded-md hover:bg-gray-100">
          <i data-lucide="x" class="w-5 h-5 text-gray-500"></i>
        </button>
      </div>

      <div class="p-6 space-y-5 flex-1 overflow-y-auto">
        <div>
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Dealer / Supplier *</label>
          <select id="po-dealer" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            <option value="">-- Select Dealer --</option>
            ${dealers.map(d => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.companyName || d.name)}</option>`).join('')}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Purchase Date *</label>
            <input type="date" id="po-date" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            <input type="hidden" id="po-id">
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Invoice Number</label>
            <input type="text" id="po-invoice-no" placeholder="INV-2026-001" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
          </div>
        </div>
        <div class="mb-4">
           <label class="text-xs font-medium text-gray-500 block mb-1.5">Status *</label>
           <select id="po-status" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
             <option value="Pending">Pending</option>
             <option value="Received">Received</option>
             <option value="Overdue">Overdue</option>
           </select>
        </div>

        <div>
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Product Search</label>
          <div class="relative">
            <input type="text" id="po-product-search" placeholder="Search product name or sku..." class="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary shadow-sm">
            <div id="po-product-results" class="absolute left-0 right-0 top-full mt-1 bg-white border border-border rounded-lg shadow-lg z-20 max-h-[200px] overflow-y-auto hidden"></div>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-medium text-gray-500">Products List</label>
          </div>
          <div class="border border-border rounded-xl overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-gray-50/60">
                <tr>
                  <th class="px-1 py-2 text-left text-[10px] font-medium text-gray-500 uppercase">Product</th>
                  <th class="px-1 py-2 text-center text-[10px] font-medium text-gray-500 uppercase w-12">Qty</th>
                  <th class="px-1 py-2 text-right text-[10px] font-medium text-gray-500 uppercase w-16">Inc GST</th>
                  <th class="px-1 py-2 text-right text-[10px] font-medium text-gray-500 uppercase w-12">GST%</th>
                  <th class="px-1 py-2 text-right text-[10px] font-medium text-gray-500 uppercase w-16">Ex GST</th>
                  <th class="px-1 py-2 text-right text-[10px] font-medium text-gray-500 uppercase w-12">Disc%</th>
                  <th class="px-1 py-2 text-right text-[10px] font-medium text-gray-500 uppercase w-16">Selling</th>
                  <th class="px-1 py-2 text-right text-[10px] font-medium text-gray-500 uppercase w-12">Margin%</th>
                  <th class="px-1 py-2 text-right text-[10px] font-medium text-gray-500 uppercase w-20">Total</th>
                  <th class="px-1 py-2 w-6"></th>
                </tr>
              </thead>
              <tbody id="po-cart-items" class="divide-y divide-border">
                <tr><td colspan="8" class="text-center py-4 text-gray-500 text-sm">No items added</td></tr>
              </tbody>
              <tfoot class="bg-gray-50/60 border-t border-border">
                <tr>
                  <td colspan="8" class="px-3 py-2.5 text-right text-xs font-medium text-gray-500">Subtotal</td>
                  <td colspan="2" class="px-3 py-2.5 text-right text-xs font-semibold text-text" id="po-subtotal">₹0.00</td>
                </tr>
                <tr>
                  <td colspan="8" class="px-3 py-2.5 text-right text-xs font-medium text-gray-500">Total GST</td>
                  <td colspan="2" class="px-3 py-2.5 text-right text-xs font-semibold text-text" id="po-tax">₹0.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <div class="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-border">
          <span class="text-base font-bold text-text">Grand Total</span>
          <span class="text-xl font-extrabold text-primary" id="po-grand-total">₹0.00</span>
        </div>
        
        <div>
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Payment Status</label>
          <select id="po-payment-status" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            <option value="Unpaid">Unpaid (Credit)</option>
            <option value="Paid Full">Paid Full</option>
          </select>
        </div>

        <div class="border-t border-border pt-4 flex gap-3 pb-6">
          <button id="btn-save-po" class="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            Save Purchase Order
          </button>
        </div>
      </div>
    </aside>
  `;
}

export function onMount(rootElement) {
  const overlay = rootElement.querySelector('#purchase-drawer-overlay');
  const formDrawer = rootElement.querySelector('#purchase-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-purchase-drawer');

  let removeDocumentClick = () => {};

  // Set default date
  const today = new Date().toISOString().split('T')[0];
  rootElement.querySelector('#po-date').value = today;

  // Initialize Draft Recovery
  if (formDrawer) {
    DraftManager.init('purchase', formDrawer, (draft) => {
       for (const [id, value] of Object.entries(draft)) {
         const el = formDrawer.querySelector(`#${id}`);
         if (el) {
           if (el.type === 'checkbox') el.checked = value;
           else el.value = value;
         }
       }
    });
  }

  // --- SEARCH & FILTER WIRING (PU-003) ---
  const allPurchases = DataProvider.getPurchaseInvoices();
  const poSearch = rootElement.querySelector('#po-search');
  const poStatusFilter = rootElement.querySelector('#po-status-filter');
  const mainTbody = rootElement.querySelector('#purchases-table tbody');
  const poCountLabel = rootElement.querySelector('#po-count-label');

  const buildRow = (po) => {
    const dealer = DataProvider.getDealerById(po.dealerId) || { name: 'Unknown', companyName: 'Unknown', phone: '' };
    const dealerName = dealer.companyName || dealer.name || 'Unknown';
    const sc = po.status === 'Pending' ? 'warning' : (po.status === 'Received' ? 'success' : 'danger');
    return `<tr class="row-hover cursor-pointer" data-id="${escapeHtml(po.id)}" data-open-po="${escapeHtml(po.id)}"><td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(po.invoiceNumber || po.id)}</td><td class="px-4 py-3.5 text-sm font-medium text-text">${escapeHtml(dealerName)}</td><td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(po.date)}</td><td class="px-4 py-3.5 text-sm text-gray-500">${po.items ? po.items.length : 0} items</td><td class="px-4 py-3.5 text-right font-semibold">₹${(po.totalAmount || 0).toLocaleString('en-IN')}</td><td class="px-4 py-3.5"><span class="status-badge status-${sc}">${escapeHtml(po.status)}</span></td><td class="px-4 py-3.5"></td></tr>`;
  };

  const applyPoFilter = () => {
    const q = (poSearch?.value || '').toLowerCase();
    const status = poStatusFilter?.value || '';
    const filtered = allPurchases.filter(po => {
      const dealer = DataProvider.getDealerById(po.dealerId) || {};
      const dealerName = (dealer.companyName || dealer.name || '').toLowerCase();
      if (q && !(po.invoiceNumber || po.id || '').toLowerCase().includes(q) && !dealerName.includes(q)) return false;
      if (status && po.status !== status) return false;
      return true;
    });
    if (poCountLabel) poCountLabel.textContent = `Showing ${filtered.length} of ${allPurchases.length} orders`;
    if (mainTbody) {
      mainTbody.innerHTML = filtered.length > 0 ? filtered.map(buildRow).join('') : '<tr><td colspan="7"><div class="empty-state"><i data-lucide="shopping-cart"></i><p>No purchases match your search</p></div></td></tr>';
    }
  };
  if (poSearch) poSearch.addEventListener('input', applyPoFilter);
  if (poStatusFilter) poStatusFilter.addEventListener('change', applyPoFilter);

  let cart = [];
  let products = [];
  
  import('../services/dataProvider.js').then(({ DataProvider }) => {
    products = DataProvider.getProducts();
    
    // Auto complete search
    const searchInput = rootElement.querySelector('#po-product-search');
    const searchResults = rootElement.querySelector('#po-product-results');
    
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      if (!q) {
        searchResults.classList.add('hidden');
        return;
      }
      const matches = products.filter(p => p.isActive && (p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q))).slice(0, 5);
      
      if (matches.length > 0) {
        searchResults.innerHTML = matches.map(p => `
          <div class="p-2 border-b border-border hover:bg-gray-50 cursor-pointer po-search-item" data-id="${escapeHtml(p.id)}">
            <div class="text-sm font-medium">${escapeHtml(p.name)}</div>
            <div class="text-[10px] text-gray-500">${escapeHtml(p.sku)} | ₹${p.price}</div>
          </div>
        `).join('');
        searchResults.classList.remove('hidden');
      } else {
        searchResults.innerHTML = '<div class="p-2 text-xs text-gray-500">No products found</div>';
        searchResults.classList.remove('hidden');
      }
    });

    // Close search results on click outside
    const handleDocumentClick = (e) => {
      if (!e.target.closest('#po-product-search') && !e.target.closest('#po-product-results')) {
        searchResults.classList.add('hidden');
      }
    };
    document.addEventListener('click', handleDocumentClick);
    removeDocumentClick = () => document.removeEventListener('click', handleDocumentClick);

    // Add product to cart
    searchResults.addEventListener('click', (e) => {
      const itemEl = e.target.closest('.po-search-item');
      if (itemEl) {
        const pId = itemEl.getAttribute('data-id');
        const product = products.find(p => p.id === pId);
        if (product) {
          const existing = cart.find(c => c.productId === product.id);
          if (existing) {
            existing.qty += 1;
          } else {
            const exGst = product.purchasePrice || product.avgCost || (product.price * 0.8) || 0;
            const gst = product.gst || 18;
            const incGst = exGst * (1 + (gst / 100));
            cart.push({
              productId: product.id,
              name: product.name,
              qty: 1,
              incGst: incGst,
              exGst: exGst,
              gst: gst,
              discount: 0,
              sellingPrice: product.price || 0
            });
          }
          renderCart();
          searchInput.value = '';
          searchResults.classList.add('hidden');
        }
      }
    });

    const renderCart = () => {
      const tbody = rootElement.querySelector('#po-cart-items');
      if (cart.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500 text-sm">No items added</td></tr>';
        updateTotals();
        return;
      }

      tbody.innerHTML = cart.map((item, index) => {
        item.incGst = item.incGst || 0;
        item.exGst = item.exGst || 0;
        item.gst = item.gst || 0;
        item.discount = item.discount || 0;
        item.sellingPrice = item.sellingPrice || 0;
        
        const costAfterDiscountExGst = item.exGst * (1 - (item.discount / 100));
        const costAfterDiscountIncGst = item.incGst * (1 - (item.discount / 100));

        let margin = 0;
        if (costAfterDiscountIncGst > 0) {
           margin = ((item.sellingPrice - costAfterDiscountIncGst) / costAfterDiscountIncGst) * 100;
        }

        return `
        <tr data-index="${index}">
          <td class="px-1 py-2.5 text-xs text-text truncate max-w-[150px]">${item.name}</td>
          <td class="px-1 py-2.5 text-center">
            <input type="number" value="${item.qty}" min="1" class="po-qty-input w-12 px-1 py-1 text-xs border border-border rounded bg-white text-center focus:outline-none focus:border-primary">
          </td>
          <td class="px-1 py-2.5 text-right">
            <input type="number" value="${item.incGst.toFixed(2)}" min="0" step="0.01" class="po-inc-gst-input w-16 px-1 py-1 text-xs border border-border rounded bg-white text-right focus:outline-none focus:border-primary">
          </td>
          <td class="px-1 py-2.5 text-right">
            <input type="number" value="${item.gst}" min="0" step="0.1" class="po-gst-input w-12 px-1 py-1 text-xs border border-border rounded bg-white text-right focus:outline-none focus:border-primary">
          </td>
          <td class="px-1 py-2.5 text-right">
            <input type="number" value="${item.exGst.toFixed(2)}" min="0" step="0.01" class="po-ex-gst-input w-16 px-1 py-1 text-xs border border-border rounded bg-white text-right focus:outline-none focus:border-primary">
          </td>
          <td class="px-1 py-2.5 text-right">
            <input type="number" value="${item.discount}" min="0" step="0.1" class="po-disc-input w-12 px-1 py-1 text-xs border border-border rounded bg-white text-right focus:outline-none focus:border-primary">
          </td>
          <td class="px-1 py-2.5 text-right">
             <input type="number" value="${item.sellingPrice.toFixed(2)}" min="0" step="0.01" class="po-selling-input w-16 px-1 py-1 text-xs border border-border rounded bg-white text-right focus:outline-none focus:border-primary">
          </td>
          <td class="px-1 py-2.5 text-right text-xs ${margin < 0 ? 'text-danger' : 'text-success'} font-medium po-margin-td">
             ${margin.toFixed(1)}%
          </td>
          <td class="px-1 py-2.5 text-right text-xs font-semibold text-text po-total-td">₹${(item.qty * costAfterDiscountExGst).toFixed(2)}</td>
          <td class="px-1 py-2.5 text-right">
            <button class="po-remove-btn text-gray-400 hover:text-danger">
              <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
            </button>
          </td>
        </tr>
      `}).join('');
      updateTotals();
      if (window.lucide) window.lucide.createIcons();
    };
    
    // EXPOSE renderCart so it can be called from openForm when editing
    window._renderCart = renderCart;

    const updateTotals = () => {
      let subtotal = 0;
      let totalGst = 0;

      cart.forEach(item => {
         const costAfterDiscountExGst = (item.exGst || 0) * (1 - ((item.discount || 0) / 100));
         const rowSub = (item.qty || 1) * costAfterDiscountExGst;
         const rowGst = rowSub * ((item.gst || 0) / 100);
         subtotal += rowSub;
         totalGst += rowGst;
      });
      
      const grandTotal = subtotal + totalGst;
      
      rootElement.querySelector('#po-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
      rootElement.querySelector('#po-tax').textContent = `₹${totalGst.toFixed(2)}`;
      rootElement.querySelector('#po-grand-total').textContent = `₹${grandTotal.toFixed(2)}`;
    };

    // Listeners for cart inputs
    rootElement.querySelector('#po-cart-items').addEventListener('input', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      const idx = parseInt(tr.getAttribute('data-index'), 10);
      const item = cart[idx];
      if (!item) return;
      
      let recomputeIncGst = false;
      let recomputeExGst = false;

      if (e.target.classList.contains('po-qty-input')) {
        item.qty = Number(e.target.value) || 1;
      } else if (e.target.classList.contains('po-inc-gst-input')) {
        item.incGst = Number(e.target.value) || 0;
        recomputeExGst = true;
      } else if (e.target.classList.contains('po-ex-gst-input')) {
        item.exGst = Number(e.target.value) || 0;
        recomputeIncGst = true;
      } else if (e.target.classList.contains('po-gst-input')) {
        item.gst = Number(e.target.value) || 0;
        recomputeIncGst = true; 
      } else if (e.target.classList.contains('po-disc-input')) {
        item.discount = Number(e.target.value) || 0;
      } else if (e.target.classList.contains('po-selling-input')) {
        item.sellingPrice = Number(e.target.value) || 0;
      }

      if (recomputeExGst) {
         item.exGst = item.incGst / (1 + (item.gst / 100));
         const input = tr.querySelector('.po-ex-gst-input');
         if (input && input !== e.target) input.value = item.exGst.toFixed(2);
      }
      if (recomputeIncGst) {
         item.incGst = item.exGst * (1 + (item.gst / 100));
         const input = tr.querySelector('.po-inc-gst-input');
         if (input && input !== e.target) input.value = item.incGst.toFixed(2);
      }

      // Update row UI (Total & Margin)
      const costAfterDiscountExGst = item.exGst * (1 - ((item.discount || 0) / 100));
      const costAfterDiscountIncGst = item.incGst * (1 - ((item.discount || 0) / 100));

      let margin = 0;
      if (costAfterDiscountIncGst > 0) {
         margin = ((item.sellingPrice - costAfterDiscountIncGst) / costAfterDiscountIncGst) * 100;
      }
      
      const marginTd = tr.querySelector('.po-margin-td');
      if (marginTd) {
         marginTd.textContent = `${margin.toFixed(1)}%`;
         marginTd.className = `px-1 py-2.5 text-right text-xs ${margin < 0 ? 'text-danger' : 'text-success'} font-medium po-margin-td`;
      }
      
      const rowTotalTd = tr.querySelector('.po-total-td');
      if (rowTotalTd) {
         rowTotalTd.textContent = `₹${(item.qty * costAfterDiscountExGst).toFixed(2)}`;
      }

      updateTotals();
    });

    rootElement.querySelector('#po-cart-items').addEventListener('click', (e) => {
      if (e.target.closest('.po-remove-btn')) {
        const tr = e.target.closest('tr');
        if (tr) {
          cart.splice(tr.getAttribute('data-index'), 1);
          renderCart();
        }
      }
    });

    // Save PO
    rootElement.querySelector('#btn-save-po').addEventListener('click', () => {
      const dealerId = rootElement.querySelector('#po-dealer').value;
      if (!dealerId) { NotificationService.warning('Please select a dealer.'); return; }
      if (cart.length === 0) { NotificationService.warning('Please add at least one product.'); return; }
      if (!rootElement.querySelector('#po-date').value) { NotificationService.warning('Please select a purchase date.'); return; }
      const badItem = cart.find(it =>
        Number(it.qty) < 1 ||
        Number(it.exGst) < 0 ||
        Number(it.incGst) < 0 ||
        Number(it.gst) < 0 || Number(it.gst) > 100 ||
        Number(it.discount) < 0 || Number(it.discount) > 100 ||
        Number(it.sellingPrice) < 0
      );
      if (badItem) { NotificationService.error(`Invalid quantity, price, GST or discount in row for ${badItem.name}.`); return; }

      let subtotal = 0;
      let totalGst = 0;

      const items = cart.map(item => {
         const costAfterDiscountExGst = (item.exGst || 0) * (1 - ((item.discount || 0) / 100));
         const rowSub = (item.qty || 1) * costAfterDiscountExGst;
         const rowGst = rowSub * ((item.gst || 0) / 100);
         subtotal += rowSub;
         totalGst += rowGst;

         return {
           productId: item.productId || item.id,
           name: item.name,
           qty: item.qty,
           purchasePrice: item.exGst, // Base ex-GST price preserved
           incGst: item.incGst,
           sellingPrice: item.sellingPrice,
           discount: item.discount || 0,
           gst: item.gst,
           cgst: item.gst / 2,
           sgst: item.gst / 2,
           total: rowSub + rowGst
         };
      });

      const totalAmount = subtotal + totalGst;
      const paymentStatus = rootElement.querySelector('#po-payment-status').value;
      const status = rootElement.querySelector('#po-status').value || 'Received';

      const invoice = {
        id: rootElement.querySelector('#po-id').value || null,
        dealerId,
        invoiceNumber: rootElement.querySelector('#po-invoice-no').value,
        date: rootElement.querySelector('#po-date').value,
        status: status,
        items: items,
        subtotal,
        discount: 0,
        taxTotal: totalGst,
        cgstTotal: totalGst / 2,
        sgstTotal: totalGst / 2,
        cgst: totalGst / 2,
        sgst: totalGst / 2,
        totalAmount,
        paymentStatus,
        amountPaid: paymentStatus === 'Paid Full' ? totalAmount : 0
      };

      try {
        const saved = DataProvider.savePurchaseInvoice(invoice);

        // If Received, log price changes to historical table
        if (saved.status === 'Received') {
           saved.items.forEach(it => {
              const prod = DataProvider.getProductById(it.productId);
              if (prod) {
                  if (prod.purchasePrice !== it.purchasePrice || prod.price !== it.sellingPrice) {
                      DataProvider.logProductPriceChange({
                          productId: it.productId,
                          oldPurchasePrice: prod.purchasePrice || 0,
                          newPurchasePrice: it.purchasePrice,
                          oldSellingPrice: prod.price || 0,
                          newSellingPrice: it.sellingPrice,
                          dealerId: saved.dealerId,
                          invoiceId: saved.id,
                          date: new Date().toISOString()
                      });
                  }
                  // Update master product file
                  prod.purchasePrice = it.purchasePrice;
                  prod.price = it.sellingPrice;
                  DataProvider.saveProduct(prod);
              }
           });
        }

        DraftManager.clearDraft('purchase');
        closeAll();
        // Refresh table in-place
        const freshPurchases = DataProvider.getPurchaseInvoices();
        const tbody = document.querySelector('#purchases-table tbody');
        if (tbody) {
          const dealers = DataProvider.getDealers();
          tbody.innerHTML = freshPurchases.length > 0 
            ? freshPurchases.map(po => {
                // Using renderPORow logic
                const dealer = dealers.find(d => d.id === po.dealerId) || { companyName: 'Unknown', phone: '' };
                const dealerName = dealer.companyName || dealer.name || 'Unknown';
                const initials = dealerName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
                const dealerColor = 'primary'; 
                const statusColor = po.status === 'Pending' ? 'warning' : (po.status === 'Received' ? 'success' : 'danger');

                return `
                <tr class="row-hover cursor-pointer" data-id="${escapeHtml(po.id)}" data-open-po="${escapeHtml(po.id)}">
                  <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(po.invoiceNumber || po.id)}</td>
                  <td class="px-4 py-3.5">
                    <div class="flex items-center gap-2.5">
                      <div class="w-7 h-7 rounded-full bg-${dealerColor}/10 flex items-center justify-center">
                        <span class="text-[10px] font-bold text-${dealerColor}">${escapeHtml(initials)}</span>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-text">${escapeHtml(dealerName)}</p>
                        <p class="text-[10px] text-gray-400">${escapeHtml(dealer.phone)}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3.5 text-sm ${statusColor === 'danger' ? 'text-danger font-medium' : 'text-gray-500'}">${escapeHtml(po.date)}</td>
                  <td class="px-4 py-3.5 text-sm text-gray-500">${po.items ? po.items.length : 0} items</td>
                  <td class="px-4 py-3.5 text-right text-sm font-semibold text-text">₹${(po.totalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
                  <td class="px-4 py-3.5">
                    <span class="status-badge status-${statusColor}">${escapeHtml(po.status)}</span>
                  </td>
                  <td class="px-4 py-3.5 text-right">
                    <div class="flex items-center justify-end gap-1">
                      <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" data-open-po-new title="New Purchase Order">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </td>
                </tr>
                `;
            }).join('')
            : '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400">No purchases yet</td></tr>';
          if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
        }
        NotificationService.success(`Purchase ${saved.id} saved!`);
      } catch (e) {
        NotificationService.error(e.message);
      }
    });

  });

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  const openForm = (e) => {
    const id = e?.detail;
    
    // Reset Form
    rootElement.querySelector('#po-dealer').value = '';
    rootElement.querySelector('#po-id').value = '';
    rootElement.querySelector('#po-invoice-no').value = '';
    rootElement.querySelector('#po-date').value = new Date().toISOString().split('T')[0];
    rootElement.querySelector('#po-status').value = 'Pending';
    rootElement.querySelector('#po-payment-status').value = 'Unpaid';
    cart = [];
    if (window._renderCart) window._renderCart();

    if (id) {
       const po = DataProvider.getPurchaseInvoices().find(p => p.id === id);
       if (po) {
         rootElement.querySelector('#po-dealer').value = po.dealerId || '';
         rootElement.querySelector('#po-id').value = po.id;
         rootElement.querySelector('#po-invoice-no').value = po.invoiceNumber || '';
         rootElement.querySelector('#po-date').value = po.date || new Date().toISOString().split('T')[0];
         rootElement.querySelector('#po-status').value = po.status || 'Pending';
         rootElement.querySelector('#po-payment-status').value = po.paymentStatus || 'Unpaid';
         cart = po.items ? JSON.parse(JSON.stringify(po.items)) : [];
         if (window._renderCart) window._renderCart();
       }
    }

    closeAll();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  window.addEventListener('openPurchaseDrawer', openForm);

  // Delegated row clicks (replaces inline onclick)
  const handleTableClick = (e) => {
    const row = e.target.closest('[data-open-po]');
    const newBtn = e.target.closest('[data-open-po-new]');
    if (newBtn) {
      e.stopPropagation();
      openForm();
      return;
    }
    if (row) openForm({ detail: row.getAttribute('data-open-po') });
  };
  mainTbody.addEventListener('click', handleTableClick);

  const newPoBtn = rootElement.querySelector('#btn-new-po');
  if (newPoBtn) newPoBtn.addEventListener('click', () => openForm());

  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);
  
  // Pending purchase redirect hook
  setTimeout(() => {
    const pendingId = localStorage.getItem('erp_pending_purchase_product');
    if (pendingId) {
      localStorage.removeItem('erp_pending_purchase_product');
      openForm();
      const p = DataProvider.getProductById(pendingId);
      if (p) {
        const exGst = p.purchasePrice || p.avgCost || (p.price * 0.8) || 0;
        const gst = p.gst || 18;
        const incGst = exGst * (1 + (gst / 100));
        cart = [{
          productId: p.id,
          name: p.name,
          sku: p.sku || '',
          qty: 1,
          incGst: incGst,
          exGst: exGst,
          gst: gst,
          discount: 0,
          sellingPrice: p.price || 0
        }];
        if (window._renderCart) window._renderCart();
        NotificationService.success(`${p.name} added to purchase`);
      }
    }
  }, 300);

  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Cleanup: prevent duplicate listeners on back-navigation
  return function cleanup() {
    window.removeEventListener('openPurchaseDrawer', openForm);
    removeDocumentClick();
  };
}

