import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - POS Billing Page Controller
 * Fixes: BUG-004 (no reload), BUG-005 (print receipt), BUG-010 (no alerts)
 */
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export async function render() {
  const productsData = DataProvider.getProducts().filter(p => p.isActive);
  const categories = ['All Products', ...new Set(productsData.map(p => p.category).filter(Boolean))];
  
  const categoryPills = categories.map((cat, i) => 
    `<button class="category-pill ${i === 0 ? 'active text-white border-primary bg-primary' : 'bg-white text-gray-600 border-border'} px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`
  ).join('');

  return `
    <div class="p-5 max-w-[1600px] mx-auto">
      <!-- Customer Bar -->
      <div class="bg-white rounded-xl border border-border p-4 mb-5 flex items-center justify-between fade-in shadow-sm">
        <div class="flex items-center gap-6" id="active-customer-info">
          <span class="text-sm text-gray-400">Loading customer...</span>
        </div>
        <button id="btn-change-customer" class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
          <i data-lucide="user-cog" class="w-4 h-4"></i>
          Select Customer
        </button>
      </div>

      <!-- Main POS Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5" style="height: calc(100vh - 230px); min-height: 580px;">

        <!-- LEFT: Product Catalog (3 cols) -->
        <div class="lg:col-span-3 flex flex-col gap-4 h-full">
          <!-- Search + Category -->
          <div class="bg-white rounded-xl border border-border p-4 shadow-sm">
            <div class="flex items-center gap-3 mb-3">
              <div class="relative flex-1">
                <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" id="pos-search-input" placeholder="Search by product name, SKU, barcode..." class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text placeholder-gray-400 focus:outline-none focus:border-primary transition-all">
              </div>
              <div class="relative w-44">
                <i data-lucide="scan-barcode" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input type="text" id="pos-barcode-input" placeholder="Scan barcode..." class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text placeholder-gray-400 focus:outline-none focus:border-primary transition-all">
              </div>
            </div>
            <div class="flex items-center gap-2 overflow-x-auto pb-1" id="category-pills-container">
              ${categoryPills}
            </div>
          </div>

          <!-- Product Grid -->
          <div class="bg-white rounded-xl border border-border p-4 flex-1 overflow-hidden flex flex-col shadow-sm">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-text">Products</h3>
              <span class="text-xs text-gray-400" id="product-count">Showing ${productsData.length}</span>
            </div>
            <div class="grid grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-1" id="product-grid">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>

        <!-- RIGHT: Cart + Summary (2 cols) -->
        <div class="lg:col-span-2 flex flex-col gap-4 h-full">
          <!-- Cart -->
          <div class="bg-white rounded-xl border border-border flex-1 flex flex-col overflow-hidden shadow-sm">
            <div class="px-4 py-3 border-b border-border flex items-center justify-between bg-gray-50/50">
              <div class="flex items-center gap-2">
                <i data-lucide="shopping-cart" class="w-4 h-4 text-primary"></i>
                <h3 class="text-sm font-semibold text-text">Current Bill</h3>
                <span class="text-xs text-gray-400" id="cart-count">(0 items)</span>
              </div>
              <button id="clear-cart-btn" class="text-xs text-danger hover:text-danger/80 font-medium transition-colors flex items-center gap-1">
                <i data-lucide="trash-2" class="w-3 h-3"></i> Clear
              </button>
            </div>

            <div class="flex-1 overflow-y-auto" id="cart-container">
              <div class="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                <i data-lucide="shopping-cart" class="w-8 h-8 text-gray-200"></i>
                <span>Cart is empty. Click a product to add.</span>
              </div>
            </div>

          </div>

          <!-- Invoice Summary -->
          <div class="bg-white rounded-xl border border-border p-4 shadow-sm">
            <div class="space-y-2 mb-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500" id="summary-subtotal-label">Subtotal (0 items)</span>
                <span class="font-medium text-text" id="summary-subtotal">₹0.00</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Item Discounts</span>
                <span class="font-medium text-success" id="summary-discount">- ₹0.00</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Taxable Amount</span>
                <span class="font-medium text-text" id="summary-taxable">₹0.00</span>
              </div>
              
              <div class="pt-1 flex items-center justify-between">
                <span class="text-base font-bold text-text">Grand Total</span>
                <span class="text-2xl font-extrabold text-primary" id="summary-total">₹0.00</span>
              </div>
            </div>
            
            <div class="mb-4">
              <label class="text-xs font-semibold text-gray-500 mb-2 uppercase block">Estimation Status</label>
              <select id="estimation-status" class="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Converted">Converted</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <!-- Payment Mode -->
            <!-- Action Buttons -->
            <div class="grid grid-cols-3 gap-2">
              <button id="btn-save-estimation" class="flex items-center justify-center gap-1.5 px-2 py-2.5 bg-white border border-border text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm" title="Save (F2 or Ctrl+S)">
                <i data-lucide="save" class="w-4 h-4"></i> Save
              </button>
              <button id="btn-save-print" class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
    <i data-lucide="printer" class="w-4 h-4"></i> Save & Print
  </button>
  <button id="btn-convert-invoice" class="flex items-center justify-center gap-1.5 px-3 py-3 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors shadow-sm hidden" title="Convert to Invoice">
    <i data-lucide="file-check-2" class="w-4 h-4"></i> Convert To Invoice
  </button>
              <button id="btn-print-preview" class="flex items-center justify-center gap-1.5 px-2 py-2.5 bg-white border border-border text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm" title="Print Preview (Ctrl+P)">
                <i data-lucide="eye" class="w-4 h-4"></i> Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer Select Modal -->
    <div id="customer-modal-overlay" class="fixed inset-0 bg-black/40 z-[60] opacity-0 pointer-events-none transition-opacity duration-200 flex items-center justify-center">
      <div class="bg-white rounded-xl shadow-2xl w-[420px] max-w-[92vw] transform transition-all scale-95 opacity-0" id="customer-modal">
        <div class="p-4 border-b border-border flex items-center justify-between">
          <h3 class="text-base font-semibold text-text flex items-center gap-2">
            <i data-lucide="users" class="w-4 h-4 text-primary"></i> Select Customer
          </h3>
          <button id="close-customer-modal" class="text-gray-400 hover:text-danger hover:bg-danger/10 p-1 rounded transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <div class="p-3 border-b border-border">
          <div class="relative">
            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input type="text" id="customer-search" placeholder="Search by name or phone..." class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
          </div>
        </div>
        <div class="max-h-[320px] overflow-y-auto" id="customer-list">
          <!-- Customers rendered here -->
        </div>
        <div class="p-3 border-t border-border">
          <button id="btn-walkin-customer" class="w-full px-3 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <i data-lucide="user-x" class="w-4 h-4"></i> Walk-in Customer (Cash Sale)
          </button>
        </div>
      </div>
    </div>

    <!-- Print Preview Modal -->
    <div id="print-preview-modal-overlay" class="fixed inset-0 bg-black/40 z-[70] opacity-0 pointer-events-none transition-opacity duration-200 flex items-center justify-center">
      <div class="bg-white rounded-xl shadow-2xl w-[400px] max-w-[92vw] transform transition-all scale-95 opacity-0 flex flex-col max-h-[90vh]" id="print-preview-modal">
        <div class="p-4 border-b border-border flex items-center justify-between shrink-0">
          <h3 class="text-base font-semibold text-text flex items-center gap-2">
            <i data-lucide="printer" class="w-4 h-4 text-primary"></i> Print Preview
          </h3>
          <button id="close-preview-modal" class="text-gray-400 hover:text-danger hover:bg-danger/10 p-1 rounded transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <div class="p-4 overflow-y-auto bg-gray-50 flex-1 flex justify-center">
           <div id="preview-receipt-content" class="bg-white p-4 shadow-sm border border-gray-200" style="width: 300px; min-height: 400px;">
              <!-- Receipt rendered here -->
           </div>
        </div>
        <div class="p-4 border-t border-border flex items-center justify-between gap-2 shrink-0 bg-white rounded-b-xl">
           <button id="btn-preview-download" class="flex-1 px-3 py-2 text-sm text-gray-700 bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium">
             <i data-lucide="download" class="w-4 h-4"></i> Download PDF
           </button>
           <button id="btn-preview-print" class="flex-1 px-3 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium">
             <i data-lucide="printer" class="w-4 h-4"></i> Print Receipt
           </button>
        </div>
      </div>
    </div>

    <!-- Print Receipt Area (Hidden, only shown during print) -->
    <div id="print-receipt-area" style="display:none;"></div>
  `;
}


export function onMount(rootElement) {
  // Logic for convert to invoice
  const convertBtn = rootElement.querySelector('#btn-convert-invoice');
  const statusSelect = rootElement.querySelector('#estimation-status');
  
  if(statusSelect && convertBtn) {
    statusSelect.addEventListener('change', (e) => {
      if (e.target.value === 'Confirmed') {
        convertBtn.classList.remove('hidden');
      } else {
        convertBtn.classList.add('hidden');
      }
    });
    
    convertBtn.addEventListener('click', () => {
      if (statusSelect.value === 'Confirmed' && lastSavedEstimation) {
        window.location.hash = '#/pos?estimateId=' + lastSavedEstimation.id;
      } else {
         NotificationService.warning('Please save the estimation as Confirmed before converting.');
      }
    });
  }

  const __listeners = [];
  const addListener = (el, evt, handler, options = false) => {
    if (!el) return;
    el.addEventListener(evt, handler, options);
    __listeners.push({el, evt, handler, options});
  };

  // --- STATE ---
  let cart = [];
  let selectedCustomer = null;
  let paymentMode = 'Cash';
  let discountVal = 0;
  let discountType = 'percent';
  let allProducts = [];
  let allCustomers = [];
  let activeCategory = 'All Products';
  let searchQuery = '';
  let lastSavedEstimation = null;

  // Load data
  allProducts = DataProvider.getProducts().filter(p => p.isActive);
  allCustomers = DataProvider.getCustomers().filter(c => c.isActive !== false);
  // AUDIT-H01: precompute product lookup for fast stock checks in cart qty edits
  const productById = new Map(allProducts.map(p => [p.id, p]));

  const savePosDraft = () => {
    DraftManager.saveDraft('estimation', {
      cart,
      selectedCustomer,
      paymentMode,
      activeCategory,
      searchQuery
    });
  };

  const draft = DraftManager.getDraft('estimation');
  if (draft) {
    cart = draft.cart || [];
    selectedCustomer = draft.selectedCustomer || null;
    paymentMode = draft.paymentMode || 'Cash';
    activeCategory = draft.activeCategory || 'All Products';
    searchQuery = draft.searchQuery || '';
    if ((cart.length > 0 || selectedCustomer) && window.showToast) {
       setTimeout(() => NotificationService.info('Draft restored — previous bill loaded.'), 500);
    }
  }

  // =====================
  // RENDER FUNCTIONS
  // =====================

  const renderProductCard = (p) => {
    const inCart = cart.find(c => c.id === p.id);
    const stockClass = p.stock <= 0 ? 'border-danger/30 bg-red-50/30' : (p.stock <= p.minStock ? 'border-orange-300' : 'border-border');
    const stockText = p.stock <= 0 ? '<span class="text-[9px] font-bold text-danger">OUT OF STOCK</span>' : `<span class="text-[9px] text-gray-400">${escapeHtml(p.stock)} ${escapeHtml(p.unit || 'Nos')}</span>`;
    const cartBadge = inCart ? `<span class="absolute top-1 right-1 w-5 h-5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">${escapeHtml(inCart.qty)}</span>` : '';
    return `
      <div class="pos-product relative cursor-pointer bg-white border ${stockClass} rounded-xl p-3 hover:border-primary/50 hover:shadow-md transition-all group ${p.stock <= 0 ? 'opacity-60 cursor-not-allowed' : ''}" data-id="${escapeHtml(p.id)}">
        ${cartBadge}
        <div class="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
          ${p.image ? `<img src="${escapeHtml(p.image)}" class="pos-product-img w-full h-full object-cover rounded-lg">
          <div style="display:none" class="w-full h-full flex items-center justify-center"><i data-lucide="package" class="w-8 h-8 text-gray-200"></i></div>` 
          : `<i data-lucide="package" class="w-8 h-8 text-gray-200 group-hover:text-primary/30 transition-colors"></i>`}
        </div>
        <p class="text-xs font-semibold text-text leading-tight truncate" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</p>
        <p class="text-[10px] text-gray-400 truncate">${escapeHtml(p.brand || p.category || '')}</p>
        <div class="flex items-center justify-between mt-1">
          <p class="text-sm font-bold text-primary">₹${(p.price || 0).toLocaleString('en-IN')}</p>
          ${stockText}
        </div>
      </div>`;
  };

  const renderProducts = () => {
    const grid = rootElement.querySelector('#product-grid');
    let filtered = allProducts;
    if (activeCategory !== 'All Products') filtered = filtered.filter(p => p.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.sku || '').toLowerCase().includes(q) ||
        (p.barcode || '').includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    }
    rootElement.querySelector('#product-count').textContent = `Showing ${filtered.length}`;
    grid.innerHTML = filtered.length > 0 
      ? filtered.map(renderProductCard).join('')
      : `<div class="col-span-4 text-center py-8 text-gray-400 text-sm">No products found</div>`;
    if (window.lucide) window.lucide.createIcons({ nodes: [grid] });
  };

  const renderCustomerBar = () => {
    const container = rootElement.querySelector('#active-customer-info');
    if (!selectedCustomer) {
      container.innerHTML = `
        <div class="flex items-center gap-2 text-gray-500">
          <i data-lucide="user-x" class="w-5 h-5"></i>
          <span class="text-sm font-medium">Walk-in Customer (Cash Sale)</span>
        </div>`;
      if (window.lucide) window.lucide.createIcons({ nodes: [container] });
      return;
    }
    const initials = selectedCustomer.name.substring(0, 2).toUpperCase();
    const hasOutstanding = (selectedCustomer.outstanding || 0) > 0;
    container.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span class="text-sm font-bold text-primary">${escapeHtml(initials)}</span>
        </div>
        <div>
          <p class="text-[10px] text-gray-400">Customer</p>
          <p class="text-sm font-semibold text-text">${escapeHtml(selectedCustomer.name)}</p>
        </div>
      </div>
      <div class="h-8 w-px bg-border hidden sm:block"></div>
      <div class="hidden sm:block">
        <p class="text-[10px] text-gray-400">Type</p>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">${escapeHtml(selectedCustomer.type || 'Retail')}</span>
      </div>
      <div class="h-8 w-px bg-border hidden sm:block"></div>
      <div class="hidden sm:block">
        <p class="text-[10px] text-gray-400">Phone</p>
        <p class="text-sm font-medium">${escapeHtml(selectedCustomer.phone || '-')}</p>
      </div>
      <div class="h-8 w-px bg-border hidden md:block"></div>
      <div class="hidden md:block">
        <p class="text-[10px] text-gray-400">Outstanding</p>
        <p class="text-sm font-bold ${hasOutstanding ? 'text-danger' : 'text-success'}">
          ${hasOutstanding ? `₹${(selectedCustomer.outstanding).toLocaleString('en-IN')} due` : 'Clear'}
        </p>
      </div>
      ${hasOutstanding ? `<div class="hidden md:flex items-center gap-1 px-2 py-1 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-xs font-medium">
        <i data-lucide="alert-triangle" class="w-3 h-3"></i> Credit Pending
      </div>` : ''}`;
    if (window.lucide) window.lucide.createIcons({ nodes: [container] });
    savePosDraft();
  };

  const getCartTotals = () => {
    let subtotal = 0, taxTotal = 0, totalDiscount = 0, cgstTotal = 0, sgstTotal = 0, taxableAmount = 0;
    cart.forEach(item => {
      const mode = item.pricingMode || 'inclusive';
      const rawBase = item.price * item.qty;
      const rawDisc = rawBase * ((item.discountPercent || 0) / 100);
      const rawAfterDisc = rawBase - rawDisc;
      const gstFactor = 1 + ((item.taxRate || 0) / 100);

      let lineTaxable = 0;
      let lineTax = 0;
      let lineTaxableBeforeDisc = 0;
      let lineDiscTaxable = 0;

      if (mode === 'inclusive') {
        lineTaxableBeforeDisc = rawBase / gstFactor;
        lineDiscTaxable = rawDisc / gstFactor;
        lineTaxable = rawAfterDisc / gstFactor;
        lineTax = rawAfterDisc - lineTaxable;
      } else {
        lineTaxableBeforeDisc = rawBase;
        lineDiscTaxable = rawDisc;
        lineTaxable = rawAfterDisc;
        lineTax = lineTaxable * ((item.taxRate || 0) / 100);
      }
      
      subtotal += lineTaxableBeforeDisc;
      totalDiscount += lineDiscTaxable;
      taxableAmount += lineTaxable;
      taxTotal += lineTax;
      cgstTotal += (lineTax / 2);
      sgstTotal += (lineTax / 2);
    });
    
    const grandTotal = taxableAmount + taxTotal;
    return { 
      subtotal: Number(subtotal.toFixed(2)), 
      totalDiscount: Number(totalDiscount.toFixed(2)), 
      taxableAmount: Number(taxableAmount.toFixed(2)), 
      taxTotal: Number(taxTotal.toFixed(2)), 
      cgstTotal: Number(cgstTotal.toFixed(2)), 
      sgstTotal: Number(sgstTotal.toFixed(2)), 
      grandTotal: Math.round(grandTotal) // Grand Total rounded to nearest Rupee
    };
  };

  const updateCartTotalsUI = () => {
    const { subtotal, totalDiscount, taxableAmount, cgstTotal, sgstTotal, grandTotal, taxTotal } = getCartTotals();
    
    rootElement.querySelector('#cart-count').textContent = `(${cart.length} item${cart.length !== 1 ? 's' : ''})`;
    rootElement.querySelector('#summary-subtotal-label').textContent = `Subtotal (${cart.length} items)`;
    rootElement.querySelector('#summary-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    
    const discountEl = rootElement.querySelector('#summary-discount');
    if (discountEl) discountEl.textContent = `- ₹${totalDiscount.toFixed(2)}`;
    
    const taxableEl = rootElement.querySelector('#summary-taxable');
    if (taxableEl) taxableEl.textContent = `₹${taxableAmount.toFixed(2)}`;
    
    const cgstEl = rootElement.querySelector('#summary-cgst');
    if (cgstEl) cgstEl.textContent = `+ ₹${cgstTotal.toFixed(2)}`;
    
    const sgstEl = rootElement.querySelector('#summary-sgst');
    if (sgstEl) sgstEl.textContent = `+ ₹${sgstTotal.toFixed(2)}`;

    const taxEl = rootElement.querySelector('#summary-tax');
    if (taxEl) taxEl.textContent = `+ ₹${taxTotal.toFixed(2)}`;
    
    rootElement.querySelector('#summary-total').textContent = `₹${grandTotal.toFixed(2)}`;
    
    const splitInput = rootElement.querySelector('#split-amount-input');
    const splitCredit = rootElement.querySelector('#split-credit-amount');
    if (splitInput && splitCredit) {
      const received = Number(splitInput.value) || 0;
      const balance = Math.max(0, grandTotal - received);
      splitCredit.textContent = `₹${balance.toFixed(2)}`;
    }

    savePosDraft();
  };

  const renderCartItemHTML = (item) => {
    const mode = item.pricingMode || 'inclusive';
    const rawBase = item.price * item.qty;
    const rawDisc = rawBase * ((item.discountPercent || 0) / 100);
    const rawAfterDisc = rawBase - rawDisc;
    const gstFactor = 1 + ((item.taxRate || 0) / 100);
    
    let lineTaxable = 0, lineTax = 0;
    if (mode === 'inclusive') {
      lineTaxable = rawAfterDisc / gstFactor;
      lineTax = rawAfterDisc - lineTaxable;
    } else {
      lineTaxable = rawAfterDisc;
      lineTax = lineTaxable * ((item.taxRate || 0) / 100);
    }
    const itemTotal = (lineTaxable + lineTax).toFixed(2);

    return `
      <div class="cart-item flex flex-col gap-2 px-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors" data-id="${escapeHtml(item.id)}">
        <div class="flex items-center justify-between">
           <div class="flex-1 min-w-0">
             <p class="text-xs font-semibold text-text truncate">${escapeHtml(item.name)}</p>
             <p class="text-[10px] text-gray-400">₹${item.price} @ ${item.taxRate || 0}% GST (${mode})</p>
           </div>
           <button class="cart-del-btn text-gray-300 hover:text-danger transition-colors ml-1">
             <i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>
           </button>
        </div>
        
        <div class="flex items-center justify-between gap-2 mt-1">
          <div class="flex items-center gap-1 shrink-0">
            <span class="text-[10px] text-gray-400">Qty:</span>
            <input type="number" class="pos-qty-input w-12 h-6 px-1 text-center text-xs border border-border rounded bg-white focus:border-primary focus:outline-none" value="${escapeHtml(item.qty)}" min="1" max="${productById.get(item.id) ? productById.get(item.id).stock : ''}">
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <span class="text-[10px] text-gray-400">Disc %:</span>
            <input type="number" class="pos-disc-input w-12 h-6 px-1 text-center text-xs border border-border rounded bg-white focus:border-primary focus:outline-none" value="${escapeHtml(item.discountPercent || 0)}" min="0" max="100">
          </div>
          <div class="text-right shrink-0">
            <p class="text-sm font-bold text-text row-total">₹${itemTotal}</p>
          </div>
        </div>
      </div>`;
  };

  const renderCart = () => {
    const container = rootElement.querySelector('#cart-container');
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-3" id="empty-cart-msg">
          <div class="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-1">
             <i data-lucide="shopping-cart" class="w-8 h-8 text-gray-300"></i>
          </div>
          <span class="font-medium text-gray-500">Cart is empty</span>
          <span class="text-xs text-gray-400">Scan barcode or click a product to add.</span>
        </div>`;
    } else {
      container.innerHTML = cart.map(renderCartItemHTML).join('');
    }
    if (window.lucide) window.lucide.createIcons({ nodes: [container] });
    updateCartTotalsUI();
  };

  const updateProductBadgeDOM = (productId, qty) => {
    const productCard = rootElement.querySelector(`.pos-product[data-id="${productId}"]`);
    if (!productCard) return;
    let badge = productCard.querySelector('.cart-badge');
    if (qty > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'cart-badge absolute top-1 right-1 w-5 h-5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center';
        productCard.appendChild(badge);
      }
      badge.textContent = qty;
    } else if (badge) {
      badge.remove();
    }
  };

  const addCartItemDOM = (item) => {
    const container = rootElement.querySelector('#cart-container');
    const emptyMsg = container.querySelector('#empty-cart-msg');
    if (emptyMsg) emptyMsg.remove();
    container.insertAdjacentHTML('afterbegin', renderCartItemHTML(item));
    if (window.lucide) window.lucide.createIcons({ nodes: [container.firstElementChild] });
    updateCartTotalsUI();
    updateProductBadgeDOM(item.id, item.qty);
  };

  const updateCartItemDOM = (item) => {
    const container = rootElement.querySelector('#cart-container');
    const row = container.querySelector(`.cart-item[data-id="${item.id}"]`);
    if (row) {
      const qtyInput = row.querySelector('.pos-qty-input');
      if (qtyInput) qtyInput.value = item.qty;
      const lineBase = item.price * item.qty;
      const lineDisc = lineBase * ((item.discountPercent || 0) / 100);
      row.querySelector('.row-total').textContent = `₹${(lineBase - lineDisc).toFixed(2)}`;
    }
    updateCartTotalsUI();
    updateProductBadgeDOM(item.id, item.qty);
  };

  const removeCartItemDOM = (productId) => {
    const container = rootElement.querySelector('#cart-container');
    const row = container.querySelector(`.cart-item[data-id="${productId}"]`);
    if (row) row.remove();
    if (cart.length === 0) renderCart(); // show empty state
    else updateCartTotalsUI();
    updateProductBadgeDOM(productId, 0);
  };

  // Delegate input events without re-rendering to prevent cursor jump
  addListener(rootElement.querySelector('#cart-container'), 'input', (e) => {
     const cartItemEl = e.target.closest('.cart-item');
     if (!cartItemEl) return;
     const id = cartItemEl.getAttribute('data-id');
     const item = cart.find(i => i.id === id);
     if (!item) return;

     if (e.target.classList.contains('pos-qty-input')) {
        // AUDIT-H01: manual qty must never exceed available stock
        const product = productById.get(id);
        const maxQty = product ? Number(product.stock) : Infinity;
        let qty = Number(e.target.value) || 1;
        if (qty > maxQty) {
          qty = maxQty;
          e.target.value = maxQty;
          if (maxQty <= 0) {
            NotificationService.error(`${product?.name || 'Product'} is out of stock`);
          } else {
            NotificationService.warning(`Only ${maxQty} ${product?.unit || 'units'} available`);
          }
        }
        item.qty = qty;
     } else if (e.target.classList.contains('pos-disc-input')) {
        item.discountPercent = Number(e.target.value) || 0;
     }

     // Update specific row total text
     const mode = item.pricingMode || 'inclusive';
     const rawBase = item.price * item.qty;
     const rawDisc = rawBase * ((item.discountPercent || 0) / 100);
     const rawAfterDisc = rawBase - rawDisc;
     const gstFactor = 1 + ((item.taxRate || 0) / 100);
     
     let lineTaxable = 0, lineTax = 0;
     if (mode === 'inclusive') {
       lineTaxable = rawAfterDisc / gstFactor;
       lineTax = rawAfterDisc - lineTaxable;
     } else {
       lineTaxable = rawAfterDisc;
       lineTax = lineTaxable * ((item.taxRate || 0) / 100);
     }
     const itemTotal = (lineTaxable + lineTax).toFixed(2);
     cartItemEl.querySelector('.row-total').textContent = `₹${itemTotal}`;

     updateCartTotalsUI();
     updateProductBadgeDOM(item.id, item.qty);
  });

  // =====================
  // CART ACTIONS
  // =====================

  const addToCart = (productId) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    if (product.stock <= 0) {
      NotificationService.error(`${product.name} is out of stock`);
      return;
    }
    const existing = cart.find(item => item.id === productId);
    if (existing) {
      if (existing.qty >= product.stock) {
        NotificationService.warning(`Only ${product.stock} ${product.unit || 'units'} available`);
        return;
      }
      existing.qty += 1;
      updateCartItemDOM(existing);
    } else {
      const newItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        taxRate: product.gst || product.taxRate || 0,
        pricingMode: product.sellingPricingMode || 'inclusive',
        qty: 1,
        discountPercent: 0
      };
      cart.unshift(newItem); // use unshift to add to top so user sees it
      addCartItemDOM(newItem);
    }
  };

  const updateCartQty = (productId, delta) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    if (delta > 0) {
      const product = allProducts.find(p => p.id === productId);
      if (product && item.qty >= product.stock) {
        NotificationService.warning(`Only ${product.stock} ${product.unit || 'units'} available`);
        return;
      }
    }
    
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.id !== productId);
      removeCartItemDOM(productId);
    } else {
      updateCartItemDOM(item);
    }
  };

  // Delegate cart delete
  addListener(rootElement.querySelector('#cart-container'), 'click', (e) => {
    const delBtn = e.target.closest('.cart-del-btn');
    if (delBtn) {
      const row = delBtn.closest('.cart-item');
      if (row) {
        const id = row.getAttribute('data-id');
        cart = cart.filter(i => i.id !== id);
        removeCartItemDOM(id);
      }
    }
  });

  // Delegate add to cart click
  addListener(rootElement.querySelector('#product-grid'), 'click', (e) => {
    const card = e.target.closest('.pos-product');
    if (card && !card.classList.contains('cursor-not-allowed')) {
      addToCart(card.getAttribute('data-id'));
    }
  });

  // =====================
  // CUSTOMER MODAL
  // =====================

  const overlay = rootElement.querySelector('#customer-modal-overlay');
  const modal = rootElement.querySelector('#customer-modal');

  const openCustomerModal = () => {
    renderCustomerList('');
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    modal.classList.remove('scale-95', 'opacity-0');
    modal.classList.add('scale-100', 'opacity-100');
    setTimeout(() => rootElement.querySelector('#customer-search')?.focus(), 100);
  };

  const closeCustomerModal = () => {
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    modal.classList.remove('scale-100', 'opacity-100');
    modal.classList.add('scale-95', 'opacity-0');
  };

  const renderCustomerList = (query) => {
    const list = rootElement.querySelector('#customer-list');
    const filtered = query
      ? allCustomers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || (c.phone || '').includes(query))
      : allCustomers;

    if (filtered.length === 0) {
      list.innerHTML = `<div class="p-4 text-center text-sm text-gray-400">No customers found</div>`;
      return;
    }

    list.innerHTML = filtered.map(c => `
      <div class="p-3 border-b border-border hover:bg-primary/5 cursor-pointer flex justify-between items-center customer-select-row transition-colors" data-id="${escapeHtml(c.id)}">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span class="text-[10px] font-bold text-primary">${escapeHtml(c.name.substring(0,2).toUpperCase())}</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-text">${escapeHtml(c.name)}</p>
            <p class="text-[10px] text-gray-400">${escapeHtml(c.phone || '')} ${c.type ? `· ${escapeHtml(c.type)}` : ''}</p>
          </div>
        </div>
        <span class="text-xs font-bold shrink-0 ${(c.outstanding || 0) > 0 ? 'text-danger' : 'text-gray-300'}">
          ${(c.outstanding || 0) > 0 ? `₹${c.outstanding.toLocaleString('en-IN')}` : '✓'}
        </span>
      </div>`).join('');
  };

  // =====================
  // PRINT RECEIPT
  // =====================

  const printReceipt = (invoice) => {
    if (!invoice) return;
    // AUDIT-H02: legacy invoices may lack subtotal/taxableAmount/cgstTotal/sgstTotal.
    // Normalize every numeric read so a reprint never throws on undefined.
    const num = (v) => Number(v || 0);
    const settings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
    const shopName = settings.shopName || 'Senthil Enterprises';
    const shopAddress = settings.address || '';
    const shopPhone = settings.phone || '';
    const date = new Date(invoice.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const subtotal = num(invoice.subtotal);
    const discount = num(invoice.discount);
    const totalAmount = num(invoice.totalAmount || invoice.total);

    const receiptArea = document.getElementById('print-receipt-area');
    receiptArea.innerHTML = `
      <div class="receipt-title">${escapeHtml(shopName)}</div>
      ${shopAddress ? `<div style="text-align:center;font-size:11px;">${escapeHtml(shopAddress)}</div>` : ''}
      ${shopPhone ? `<div style="text-align:center;font-size:11px;">Ph: ${escapeHtml(shopPhone)}</div>` : ''}
      <div class="receipt-divider"></div>
      <div style="font-size:11px;"><b>Invoice:</b> ${escapeHtml(invoice.id)}</div>
      <div style="font-size:11px;"><b>Date:</b> ${escapeHtml(date)}</div>
      <div style="font-size:11px;"><b>Customer:</b> ${escapeHtml(invoice.customerName || 'Walk-in')}</div>
      <div style="font-size:11px;"><b>Payment:</b> ${escapeHtml(invoice.paymentMode)}</div>
      <div class="receipt-divider"></div>
      <table style="width: 100%; font-size: 10px;">
        <tr><th style="text-align:left">Item</th><th style="text-align:right">Rate</th><th style="text-align:center">Qty</th><th style="text-align:right">Amount</th></tr>
        ${(invoice.items || []).map(item => {
           const mode = item.pricingMode || 'inclusive';
           const qty = num(item.qty);
           const price = num(item.price);
           const gstPercent = num(item.taxRate);
           const gstFactor = 1 + (gstPercent / 100);
           const rawLineTotal = qty * price;
           const discountAmt = rawLineTotal * (num(item.discountPercent) / 100);
           const rawAfterDisc = rawLineTotal - discountAmt;
           let finalAmount = rawAfterDisc;
           
           return `<tr>
             <td style="text-align:left; padding: 2px 0;">${escapeHtml(item.name)}</td>
             <td style="text-align:right; padding: 2px 0;">${price.toFixed(2)}</td>
             <td style="text-align:center; padding: 2px 0;">${qty}</td>
             <td style="text-align:right; padding: 2px 0;">${finalAmount.toFixed(2)}</td>
           </tr>`;
        }).join('')}
      </table>
      <div class="receipt-divider"></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
      ${discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Item Discounts</span><span>- ₹${discount.toFixed(2)}</span></div>` : ''}
      <div class="receipt-divider"></div>
      <div class="receipt-total" style="display:flex;justify-content:space-between;"><span>GRAND TOTAL</span><span>₹${totalAmount.toFixed(2)}</span></div>
      <div class="receipt-divider"></div>
      <div style="text-align:center;font-size:10px;margin-top:8px;">Thank you for shopping with us!</div>
      <div style="text-align:center;font-size:10px;">Please visit again.</div>`;

    window.print();
  };

  const getReceiptHtml = (invoice) => {
    if (!invoice) return '';
    const num = (v) => Number(v || 0);
    const settings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
    const shopName = settings.shopName || 'Senthil Enterprises';
    const shopAddress = settings.address || '';
    const shopPhone = settings.phone || '';
    const date = new Date(invoice.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const subtotal = num(invoice.subtotal);
    const discount = num(invoice.discount);
    const totalAmount = num(invoice.totalAmount || invoice.total);
    
    // Fallback ID if not provided, though it shouldn't happen anymore
    const invoiceId = invoice.id || 'DRAFT';

    const showGstin = settings.showGstinOnInvoice !== false;
    const showHsn = settings.showHsnCodeOnInvoice !== false;
    const showPhone = settings.showCustomerPhoneOnInvoice !== false;
    const showPayMode = settings.showPaymentModeOnInvoice !== false;
    const showDiscount = settings.showDiscountOnInvoice !== false;

    let hsnHeader = showHsn ? '<th style="text-align:center; padding: 4px; border-bottom: 1px dashed #ccc;">HSN</th>' : '';

    const itemsHtml = (invoice.items || []).map((item, i) => {
        const mode = item.pricingMode || 'inclusive';
        const qty = num(item.qty);
        const price = num(item.price);
        const gstPercent = num(item.taxRate);
        const gstFactor = 1 + (gstPercent / 100);
        const rawLineTotal = qty * price;
        const discountAmt = rawLineTotal * (num(item.discountPercent) / 100);
        const rawAfterDisc = rawLineTotal - discountAmt;
        
        let itemTaxable = 0, lineTax = 0, finalAmount = 0;
        if (mode === 'inclusive') {
            itemTaxable = rawAfterDisc / gstFactor;
            lineTax = rawAfterDisc - itemTaxable;
            finalAmount = rawAfterDisc;
        } else {
            itemTaxable = rawAfterDisc;
            lineTax = itemTaxable * (gstPercent / 100);
            finalAmount = itemTaxable + lineTax;
        }
        
        const rate = qty > 0 ? (itemTaxable / qty) : 0;
        const discHtml = (showDiscount && discountAmt > 0) ? `<br><span style="font-size:9px;color:#555">(-₹${discountAmt.toFixed(2)})</span>` : '';
        const hsnCell = showHsn ? `<td style="text-align:center; padding: 4px; border-bottom: 1px dashed #eee;">${escapeHtml(item.hsnCode || '-')}</td>` : '';

        return `
        <tr>
            <td style="text-align:left; padding: 4px; border-bottom: 1px dashed #eee;">${i+1}</td>
            <td style="text-align:left; padding: 4px; border-bottom: 1px dashed #eee;">${escapeHtml(item.name)}${discHtml}</td>
            ${hsnCell}
            <td style="text-align:right; padding: 4px; border-bottom: 1px dashed #eee;">₹${rate.toFixed(2)}</td>
            <td style="text-align:center; padding: 4px; border-bottom: 1px dashed #eee;">${qty}</td>
            <td style="text-align:right; padding: 4px; border-bottom: 1px dashed #eee;">₹${finalAmount.toFixed(2)}</td>
        </tr>`;
    }).join('');

    return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 100%; margin: 0 auto; color: #000;">
        <!-- Header -->
        <div style="text-align:center; margin-bottom: 15px;">
            ${settings.showLogoOnInvoice && settings.logoUrl ? `<img src="${settings.logoUrl}" style="max-height:60px; margin-bottom:5px;" />` : ''}
            <h2 style="margin:0; font-size: 18px; font-weight: bold; text-transform: uppercase;">${escapeHtml(shopName)}</h2>
   <div style="font-size: 14px; font-weight: bold; margin-top: 5px;">ESTIMATION</div>
   <div style="font-size: 10px; font-weight: bold; margin-top: 2px;">( NOT A TAX INVOICE )</div>
            ${shopAddress ? `<div style="font-size: 12px; margin-top: 2px;">${escapeHtml(shopAddress)}</div>` : ''}
            ${shopPhone ? `<div style="font-size: 12px; margin-top: 2px;">Ph: ${escapeHtml(shopPhone)}</div>` : ''}
        </div>
        
        <div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin-bottom: 10px; font-size: 12px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="vertical-align: top; width: 50%;">
                        <div><b>Estimation No:</b> ${escapeHtml(invoiceId)}</div>
                        <div><b>Date:</b> ${escapeHtml(date)}</div>
                    </td>
                    <td style="vertical-align: top; width: 50%; text-align: right;">
                        <div><b>Customer:</b> ${escapeHtml(invoice.customerName || 'Walk-in')}</div>
                        ${(showPhone && invoice.customerPhone) ? `<div><b>Phone:</b> ${escapeHtml(invoice.customerPhone)}</div>` : ''}
                    </td>
                </tr>
            </table>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 10px;">
            <thead>
                <tr>
                    <th style="text-align:left; padding: 4px; border-bottom: 1px dashed #ccc;">S.No</th>
                    <th style="text-align:left; padding: 4px; border-bottom: 1px dashed #ccc;">Item Description</th>
                    ${hsnHeader}
                    <th style="text-align:right; padding: 4px; border-bottom: 1px dashed #ccc;">Rate</th>
                    <th style="text-align:center; padding: 4px; border-bottom: 1px dashed #ccc;">Qty</th>
                    <th style="text-align:right; padding: 4px; border-bottom: 1px dashed #ccc;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <!-- Totals -->
        <div style="border-top: 1px dashed #000; padding-top: 10px; font-size: 12px; margin-left: auto; width: 60%; min-width: 150px;">
            <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                <span>Subtotal:</span>
                <span>₹${subtotal.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `<div style="display:flex; justify-content:space-between; margin-bottom: 4px; color: #555;">
                <span>Discount:</span>
                <span>- ₹${discount.toFixed(2)}</span>
            </div>` : ''}
            
            <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                <span>Round Off:</span>
                <span>₹${(totalAmount - (subtotal - discount)).toFixed(2)}</span>
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-top: 5px; padding-top: 5px; border-top: 1px solid #000; font-weight: bold; font-size: 14px;">
                <span>Grand Total:</span>
                <span>₹${totalAmount.toFixed(2)}</span>
            </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; font-size: 11px; text-align: center;">
            ${showPayMode ? `<div style="margin-bottom: 5px;">Payment Mode: <b>${escapeHtml(invoice.paymentMode)}</b></div>` : ''}
            <div>Prepared By: <b>Cashier</b></div>
            ${settings.footerMessage ? `<div style="margin-top: 10px;">${escapeHtml(settings.footerMessage)}</div>` : ''}
            <div style="margin-top: 5px;">Thank You! Please visit again.</div>
        </div>
    </div>`;
  };

  
  const openPrintPreview = (invoiceToPreview = null) => {
    let invoice = invoiceToPreview;
    if (!invoice) {
       if (cart.length === 0) {
         NotificationService.warning('Cart is empty. Nothing to preview.');
         return;
       }
       invoice = buildEstimationObject(true);
    }
    const html = getReceiptHtml(invoice);
    const settings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
    
    if (window.electronAPI && window.electronAPI.printPreview) {
      window.electronAPI.printPreview(html, { paperSize: settings.paperSize || 'A4' });
    } else {
      // Fallback for browsers
      const win = window.open('', '_blank');
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
  };

  const closePrintPreview = () => { /* No-op, managed by electron */ };

  const handleSaveAndPrint = () => {
     const saved = saveEstimationBtn();
     if (saved) {
       openPrintPreview(saved);
     }
  };

  const reprintLastInvoice = () => {
    if (lastSavedEstimation) {
      openPrintPreview(lastSavedEstimation);
    } else {
      NotificationService.warning('No estimation saved in this session.');
    }
  };


  // =====================
  // SAVE INVOICE
  // =====================

  const buildEstimationObject = (isDraft = false) => {
    const state = JSON.parse(localStorage.getItem('erp_system_state') || '{}');
    const settings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
    const prefix = 'QT-';
    const nextCount = (state.lastQTNumber || 0) + 1;
    const mockId = `${prefix}${new Date().getFullYear()}-${String(nextCount).padStart(6, '0')}`;
    const { subtotal, totalDiscount, taxableAmount, taxTotal, cgstTotal, sgstTotal, grandTotal } = getCartTotals();

    let parsedAmountPaid = grandTotal;
    if (paymentMode !== 'Credit') {
      const isSplit = rootElement.querySelector('#enable-split-payment')?.checked;
      if (isSplit) {
        parsedAmountPaid = Number(rootElement.querySelector('#split-amount-input')?.value || 0);
      }
    }

    return {
      id: isDraft ? mockId : undefined,
      date: new Date().toISOString(),
      customerId: selectedCustomer ? selectedCustomer.id : null,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
      items: cart.map(i => {
         const mode = i.pricingMode || 'inclusive';
         const rawBase = i.price * i.qty;
         const rawDisc = rawBase * ((i.discountPercent || 0) / 100);
         const rawAfterDisc = rawBase - rawDisc;
         const gstFactor = 1 + ((i.taxRate || 0) / 100);
         let lineTaxable = 0, lineTax = 0;
         if (mode === 'inclusive') {
           lineTaxable = rawAfterDisc / gstFactor;
           lineTax = rawAfterDisc - lineTaxable;
         } else {
           lineTaxable = rawAfterDisc;
           lineTax = lineTaxable * ((i.taxRate || 0) / 100);
         }
         return {
           productId: i.id,
           name: i.name,
           qty: i.qty,
           price: i.price,
           taxRate: i.taxRate,
           pricingMode: i.pricingMode,
           discountPercent: i.discountPercent || 0,
           discountAmount: rawDisc,
           total: lineTaxable + lineTax
         };
      }),
      subtotal,
      discount: totalDiscount,
      taxableAmount,
      taxTotal,
      cgstTotal,
      sgstTotal,
      totalAmount: grandTotal,
      paymentMode,
      
      
      status: document.getElementById('estimation-status').value || 'Draft'
    };
  };

  const saveEstimationBtn = () => {
    if (cart.length === 0) {
      NotificationService.warning('Cart is empty! Add products first.');
      return null;
    }
    if (paymentMode === 'Credit' && !selectedCustomer) {
      NotificationService.warning('Please select a customer for Credit sale!');
      return null;
    }

    const { grandTotal } = getCartTotals();
    if (paymentMode !== 'Credit') {
      const isSplit = rootElement.querySelector('#enable-split-payment')?.checked;
      if (isSplit) {
        const parsedAmountPaid = Number(rootElement.querySelector('#split-amount-input')?.value || 0);
        if (parsedAmountPaid < grandTotal && !selectedCustomer) {
           NotificationService.warning('Please select a customer for Partial Payments!');
           return null;
        }
      }
    }

    const invalidItem = cart.find(i => Number(i.qty) < 1 || Number(i.discountPercent) < 0 || Number(i.discountPercent) > 100);
    if (invalidItem) {
      NotificationService.error(`Invalid quantity or discount for ${invalidItem.name}.`);
      return null;
    }

    // AUDIT-H01: final guard so a stale/forged qty can never sell more than stock
    const overStockItem = cart.find(i => {
      const product = productById.get(i.id);
      return product && Number(i.qty) > Number(product.stock);
    });
    if (overStockItem) {
      const available = productById.get(overStockItem.id)?.stock || 0;
      NotificationService.error(`Insufficient stock for ${overStockItem.name}. Available: ${available}.`);
      return null;
    }

    const estimation = buildEstimationObject(false);

    try {
      const saved = DataProvider.saveEstimation(estimation);
      lastSavedEstimation = saved;
      DraftManager.clearDraft('estimation');
      
      cart = [];    // Reset state in-place — NO page reload
      paymentMode = 'Cash';
      
      const splitCheckbox = rootElement.querySelector('#enable-split-payment');
      if (splitCheckbox) {
         splitCheckbox.checked = false;
         rootElement.querySelector('#split-amount-wrapper')?.classList.add('hidden');
         rootElement.querySelector('#split-amount-input').value = '';
      }
      
      // Reset payment mode UI
      rootElement.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('border-2', 'border-primary', 'bg-primary/5', 'active');
        btn.classList.add('border', 'border-border', 'bg-white', 'text-gray-500');
        btn.querySelector('span')?.classList.remove('text-primary', 'font-bold');
        const icon = btn.querySelector('i, svg');
        if (icon) icon.classList.remove('text-primary');
      });
      const cashBtn = rootElement.querySelector('.payment-btn[data-mode="Cash"]');
      if (cashBtn) {
        cashBtn.classList.remove('border', 'border-border', 'bg-white', 'text-gray-500');
        cashBtn.classList.add('border-2', 'border-primary', 'bg-primary/5', 'active');
        cashBtn.querySelector('span')?.classList.add('text-primary', 'font-bold');
        const cIcon = cashBtn.querySelector('i, svg');
        if (cIcon) cIcon.classList.add('text-primary');
      }
      
      renderCart();
      renderProducts();
      
      NotificationService.success(`Invoice ${saved.id} saved successfully!`);
      return saved;
    } catch (err) {
      NotificationService.error(err.message);
      return null;
    }
  };


  // =====================
  // INITIALIZE
  // =====================

  renderCustomerBar();
  renderProducts();
  renderCart();

  // Search & Category
  addListener(rootElement.querySelector('#pos-search-input'), 'input', (e) => {
    searchQuery = e.target.value.trim();
    savePosDraft();
    renderProducts();
  });

  addListener(rootElement.querySelector('#pos-barcode-input'), 'keydown', (e) => {
    if (e.key === 'Enter') {
      const barcode = e.target.value.trim();
      if (!barcode) return;
      const product = allProducts.find(p => p.barcode === barcode || p.sku === barcode);
      if (product) {
        addToCart(product.id);
        e.target.value = '';
        NotificationService.success(`${product.name} added`);
      } else {
        NotificationService.warning('Product not found for this barcode');
      }
    }
  });

  rootElement.querySelectorAll('.category-pill').forEach(pill => {
    addListener(pill, 'click', (e) => {
      rootElement.querySelectorAll('.category-pill').forEach(p => {
        p.classList.remove('active', 'text-white', 'border-primary', 'bg-primary');
        p.classList.add('bg-white', 'text-gray-600', 'border-border');
      });
      e.currentTarget.classList.remove('bg-white', 'text-gray-600', 'border-border');
      e.currentTarget.classList.add('active', 'text-white', 'border-primary', 'bg-primary');
      activeCategory = e.currentTarget.getAttribute('data-category');
      savePosDraft();
      renderProducts();
    });
  });


  addListener(rootElement.querySelector('#clear-cart-btn'), 'click', () => {
    if (cart.length === 0) return;
    cart = [];
    savePosDraft();
    renderCart();
    renderProducts();
  });

  // Payment mode
  rootElement.querySelectorAll('.payment-btn').forEach(btn => {
    if (btn.getAttribute('data-mode') === paymentMode) {
      btn.classList.add('border-2', 'border-primary', 'bg-primary/5', 'active');
      btn.classList.remove('border-border', 'bg-white', 'text-gray-500');
    } else {
      btn.classList.remove('border-2', 'border-primary', 'bg-primary/5', 'active');
      btn.classList.add('border-border', 'bg-white', 'text-gray-500');
    }
  });

  rootElement.querySelectorAll('.payment-btn').forEach(btn => {
    addListener(btn, 'click', (e) => {
      const b = e.target.closest('.payment-btn');
      rootElement.querySelectorAll('.payment-btn').forEach(x => {
        x.classList.remove('border-2', 'border-primary', 'bg-primary/5', 'active');
        x.classList.add('border-border', 'bg-white', 'text-gray-500');
        x.querySelector('span').classList.remove('text-primary');
        x.querySelector('span').classList.add('text-gray-500');
        const icon = x.querySelector('i, svg');
        if (icon) icon.classList.remove('text-primary');
      });
      b.classList.remove('border-border', 'bg-white', 'text-gray-500');
      b.classList.add('border-2', 'border-primary', 'bg-primary/5', 'active');
      b.querySelector('span').classList.remove('text-gray-500');
      b.querySelector('span').classList.add('text-primary');
      const bIcon = b.querySelector('i, svg');
      if (bIcon) bIcon.classList.add('text-primary');
      paymentMode = b.getAttribute('data-mode');
      
      const splitContainer = rootElement.querySelector('#split-payment-container');
      if (splitContainer) {
         if (paymentMode === 'Credit') splitContainer.classList.add('hidden', 'opacity-0');
         else splitContainer.classList.remove('hidden', 'opacity-0');
      }
      savePosDraft();
    });
  });

  addListener(rootElement.querySelector('#enable-split-payment'), 'change', (e) => {
     const wrapper = rootElement.querySelector('#split-amount-wrapper');
     if (e.target.checked) {
       wrapper.classList.remove('hidden');
       rootElement.querySelector('#split-amount-input')?.focus();
     } else {
       wrapper.classList.add('hidden');
     }
     updateCartTotalsUI();
  });
  
  addListener(rootElement.querySelector('#split-amount-input'), 'input', () => {
     updateCartTotalsUI();
  });

  // Customer modal
  addListener(rootElement.querySelector('#btn-change-customer'), 'click', openCustomerModal);
  addListener(rootElement.querySelector('#close-customer-modal'), 'click', closeCustomerModal);
  if (overlay) addListener(overlay, 'click', (e) => { if (e.target === overlay) closeCustomerModal(); });

  addListener(rootElement.querySelector('#customer-search'), 'input', (e) => {
    renderCustomerList(e.target.value);
  });

  addListener(rootElement.querySelector('#customer-list'), 'click', (e) => {
    const row = e.target.closest('.customer-select-row');
    if (row) {
      selectedCustomer = allCustomers.find(c => c.id === row.getAttribute('data-id'));
      renderCustomerBar();
      closeCustomerModal();
    }
  });

  addListener(rootElement.querySelector('#btn-walkin-customer'), 'click', () => {
    selectedCustomer = null;
    renderCustomerBar();
    closeCustomerModal();
  });

  // Save invoice
  addListener(rootElement.querySelector('#btn-save-estimation'), 'click', saveEstimationBtn);
  
  // Save & Print invoice
  addListener(rootElement.querySelector('#btn-save-print'), 'click', handleSaveAndPrint);

  // Print Preview
  addListener(rootElement.querySelector('#btn-print-preview'), 'click', () => openPrintPreview(null));

  const isInputFocused = () => {
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  };

  const isModalOpen = () => {
    const customerOverlay = rootElement.querySelector('#customer-modal-overlay');
    const previewOverlay = rootElement.querySelector('#print-preview-modal-overlay');
    return (!customerOverlay.classList.contains('pointer-events-none') || 
            !previewOverlay.classList.contains('pointer-events-none'));
  };

  // Keyboard shortcuts
  const keyHandler = (e) => {
    // Save: F2 or Ctrl+S
    if (e.key === 'F2' || (e.ctrlKey && e.key.toLowerCase() === 's')) { 
      e.preventDefault(); 
      saveEstimationBtn(); 
      return;
    }
    
    // Reprint Last Invoice: Ctrl+Shift+P
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      reprintLastInvoice();
      return;
    }

    // Print Preview: Ctrl+P
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      openPrintPreview();
      return;
    }

    // Save & Print: Enter
    if (e.key === 'Enter') {
      if (cart.length > 0 && !isInputFocused() && !isModalOpen()) {
        e.preventDefault();
        handleSaveAndPrint();
      }
    }

    if (e.key === 'Escape') {
      closeCustomerModal();
      if (typeof closePrintPreview === 'function') closePrintPreview();
    }
  };
  addListener(window, 'keydown', keyHandler);

  if (window.lucide) window.lucide.createIcons();

  // Return cleanup
  return function cleanup() {
    __listeners.forEach(l => {
      if (l.el) l.el.removeEventListener(l.evt, l.handler, l.options);
    });
    __listeners.length = 0;
  };
}
