/**
 * Senthil Enterprises ERP - POS Billing Page Controller
 * Fixes: BUG-004 (no reload), BUG-005 (print receipt), BUG-010 (no alerts)
 */
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';

export async function render() {
  const productsData = DataProvider.getProducts().filter(p => p.isActive);
  const categories = ['All Products', ...new Set(productsData.map(p => p.category).filter(Boolean))];
  
  const categoryPills = categories.map((cat, i) => 
    `<button class="category-pill ${i === 0 ? 'active text-white border-primary bg-primary' : 'bg-white text-gray-600 border-border'} px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors" data-category="${cat}">${cat}</button>`
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
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">CGST</span>
                <span class="font-medium text-gray-500" id="summary-cgst">+ ₹0.00</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">SGST</span>
                <span class="font-medium text-gray-500" id="summary-sgst">+ ₹0.00</span>
              </div>
              <div class="flex items-center justify-between text-sm border-b border-border pb-2">
                <span class="text-gray-500 font-semibold">Total GST</span>
                <span class="font-medium text-text font-semibold" id="summary-tax">+ ₹0.00</span>
              </div>
              <div class="pt-1 flex items-center justify-between">
                <span class="text-base font-bold text-text">Grand Total</span>
                <span class="text-2xl font-extrabold text-primary" id="summary-total">₹0.00</span>
              </div>
            </div>

            <!-- Payment Mode -->
            <div class="mb-4">
              <p class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Payment Mode</p>
              <div class="grid grid-cols-3 gap-2" id="payment-modes">
                <button data-mode="Cash" class="payment-btn flex flex-col items-center justify-center p-2.5 rounded-lg border-2 border-primary bg-primary/5 active">
                  <i data-lucide="banknote" class="w-5 h-5 text-primary mb-1"></i>
                  <span class="text-[10px] font-bold text-primary">Cash</span>
                </button>
                <button data-mode="UPI" class="payment-btn flex flex-col items-center justify-center p-2.5 rounded-lg border border-border bg-white text-gray-500 hover:border-primary/50 transition-colors">
                  <i data-lucide="smartphone" class="w-5 h-5 mb-1"></i>
                  <span class="text-[10px] font-medium">UPI</span>
                </button>
                <button data-mode="Credit" class="payment-btn flex flex-col items-center justify-center p-2.5 rounded-lg border border-border bg-white text-gray-500 hover:border-primary/50 transition-colors">
                  <i data-lucide="credit-card" class="w-5 h-5 mb-1"></i>
                  <span class="text-[10px] font-medium">Credit</span>
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-2">
              <button id="btn-save-invoice" class="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                <i data-lucide="save" class="w-4 h-4"></i> Save (F2)
              </button>
              <button id="btn-print-last" class="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-border text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <i data-lucide="printer" class="w-4 h-4"></i> Print Last
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

    <!-- Print Receipt Area (Hidden, only shown during print) -->
    <div id="print-receipt-area" style="display:none;"></div>
  `;
}

export function onMount(rootElement) {
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
  let lastSavedInvoice = null;

  // Load data
  allProducts = DataProvider.getProducts().filter(p => p.isActive);
  allCustomers = DataProvider.getCustomers().filter(c => c.isActive !== false);

  const savePosDraft = () => {
    DraftManager.saveDraft('pos', {
      cart,
      selectedCustomer,
      paymentMode,
      activeCategory,
      searchQuery
    });
  };

  const draft = DraftManager.getDraft('pos');
  if (draft) {
    cart = draft.cart || [];
    selectedCustomer = draft.selectedCustomer || null;
    paymentMode = draft.paymentMode || 'Cash';
    activeCategory = draft.activeCategory || 'All Products';
    searchQuery = draft.searchQuery || '';
    if ((cart.length > 0 || selectedCustomer) && window.showToast) {
       setTimeout(() => window.showToast('POS draft restored automatically', 'info'), 500);
    }
  }

  // =====================
  // RENDER FUNCTIONS
  // =====================

  const renderProductCard = (p) => {
    const inCart = cart.find(c => c.id === p.id);
    const stockClass = p.stock <= 0 ? 'border-danger/30 bg-red-50/30' : (p.stock <= p.minStock ? 'border-orange-300' : 'border-border');
    const stockText = p.stock <= 0 ? '<span class="text-[9px] font-bold text-danger">OUT OF STOCK</span>' : `<span class="text-[9px] text-gray-400">${p.stock} ${p.unit || 'Nos'}</span>`;
    const cartBadge = inCart ? `<span class="absolute top-1 right-1 w-5 h-5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">${inCart.qty}</span>` : '';
    return `
      <div class="pos-product relative cursor-pointer bg-white border ${stockClass} rounded-xl p-3 hover:border-primary/50 hover:shadow-md transition-all group ${p.stock <= 0 ? 'opacity-60 cursor-not-allowed' : ''}" data-id="${p.id}">
        ${cartBadge}
        <div class="w-full aspect-square bg-gray-50 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
          ${p.image ? `<img src="${p.image}" class="w-full h-full object-cover rounded-lg" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
          <div style="display:none" class="w-full h-full flex items-center justify-center"><i data-lucide="package" class="w-8 h-8 text-gray-200"></i></div>` 
          : `<i data-lucide="package" class="w-8 h-8 text-gray-200 group-hover:text-primary/30 transition-colors"></i>`}
        </div>
        <p class="text-xs font-semibold text-text leading-tight truncate" title="${p.name}">${p.name}</p>
        <p class="text-[10px] text-gray-400 truncate">${p.brand || p.category || ''}</p>
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
          <span class="text-sm font-bold text-primary">${initials}</span>
        </div>
        <div>
          <p class="text-[10px] text-gray-400">Customer</p>
          <p class="text-sm font-semibold text-text">${selectedCustomer.name}</p>
        </div>
      </div>
      <div class="h-8 w-px bg-border hidden sm:block"></div>
      <div class="hidden sm:block">
        <p class="text-[10px] text-gray-400">Type</p>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">${selectedCustomer.type || 'Retail'}</span>
      </div>
      <div class="h-8 w-px bg-border hidden sm:block"></div>
      <div class="hidden sm:block">
        <p class="text-[10px] text-gray-400">Phone</p>
        <p class="text-sm font-medium">${selectedCustomer.phone || '-'}</p>
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
      const lineBase = item.price * item.qty;
      const lineDisc = lineBase * ((item.discountPercent || 0) / 100);
      const lineAfterDisc = lineBase - lineDisc;
      const lineTax = lineAfterDisc * ((item.taxRate || 0) / 100);
      
      subtotal += lineBase;
      totalDiscount += lineDisc;
      taxableAmount += lineAfterDisc;
      taxTotal += lineTax;
      cgstTotal += (lineTax / 2);
      sgstTotal += (lineTax / 2);
    });
    
    const grandTotal = taxableAmount + taxTotal;
    return { subtotal, totalDiscount, taxableAmount, taxTotal, cgstTotal, sgstTotal, grandTotal };
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
    savePosDraft();
  };

  const renderCart = () => {
    const container = rootElement.querySelector('#cart-container');
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
          <i data-lucide="shopping-cart" class="w-8 h-8 text-gray-200"></i>
          <span>Cart is empty. Click a product to add.</span>
        </div>`;
    } else {
      container.innerHTML = cart.map(item => {
        const lineBase = item.price * item.qty;
        const lineDisc = lineBase * ((item.discountPercent || 0) / 100);
        const itemTotal = (lineBase - lineDisc).toFixed(2);
        return `
          <div class="cart-item flex flex-col gap-2 px-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors" data-id="${item.id}">
            <div class="flex items-center justify-between">
               <div class="flex-1 min-w-0">
                 <p class="text-xs font-semibold text-text truncate">${item.name}</p>
                 <p class="text-[10px] text-gray-400">₹${item.price} @ ${item.taxRate || 0}% GST</p>
               </div>
               <button class="cart-del-btn text-gray-300 hover:text-danger transition-colors ml-1">
                 <i data-lucide="x" class="w-4 h-4 pointer-events-none"></i>
               </button>
            </div>
            
            <div class="flex items-center justify-between gap-2 mt-1">
              <div class="flex items-center gap-1 shrink-0">
                <span class="text-[10px] text-gray-400">Qty:</span>
                <input type="number" class="pos-qty-input w-12 h-6 px-1 text-center text-xs border border-border rounded bg-white focus:border-primary focus:outline-none" value="${item.qty}" min="1">
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <span class="text-[10px] text-gray-400">Disc %:</span>
                <input type="number" class="pos-disc-input w-12 h-6 px-1 text-center text-xs border border-border rounded bg-white focus:border-primary focus:outline-none" value="${item.discountPercent || 0}" min="0" max="100">
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-bold text-text row-total">₹${itemTotal}</p>
              </div>
            </div>
          </div>`;
      }).join('');
    }
    if (window.lucide) window.lucide.createIcons({ nodes: [container] });
    updateCartTotalsUI();
  };

  // Delegate input events without re-rendering to prevent cursor jump
  rootElement.querySelector('#cart-container').addEventListener('input', (e) => {
     const cartItemEl = e.target.closest('.cart-item');
     if (!cartItemEl) return;
     const id = cartItemEl.getAttribute('data-id');
     const item = cart.find(i => i.id === id);
     if (!item) return;

     if (e.target.classList.contains('pos-qty-input')) {
        item.qty = Number(e.target.value) || 1;
     } else if (e.target.classList.contains('pos-disc-input')) {
        item.discountPercent = Number(e.target.value) || 0;
     }

     // Update specific row total text
     const lineBase = item.price * item.qty;
     const lineDisc = lineBase * ((item.discountPercent || 0) / 100);
     const itemTotal = (lineBase - lineDisc).toFixed(2);
     cartItemEl.querySelector('.row-total').textContent = `₹${itemTotal}`;

     updateCartTotalsUI();
  });

  // =====================
  // CART ACTIONS
  // =====================

  const addToCart = (productId) => {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    if (product.stock <= 0) {
      window.showToast(`${product.name} is out of stock`, 'danger');
      return;
    }
    const existing = cart.find(item => item.id === productId);
    if (existing) {
      if (existing.qty >= product.stock) {
        window.showToast(`Only ${product.stock} ${product.unit || 'units'} available`, 'warning');
        return;
      }
      existing.qty += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        taxRate: product.gst || product.taxRate || 0,
        qty: 1
      });
    }
    renderCart();
    renderProducts(); // refresh cart badges
  };

  const updateCartQty = (productId, delta) => {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    if (delta > 0) {
      const product = allProducts.find(p => p.id === productId);
      if (product && item.qty >= product.stock) {
        window.showToast(`Only ${product.stock} ${product.unit || 'units'} available`, 'warning');
        return;
      }
    }
    
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== productId);
    renderCart();
    renderProducts();
  };

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
      <div class="p-3 border-b border-border hover:bg-primary/5 cursor-pointer flex justify-between items-center customer-select-row transition-colors" data-id="${c.id}">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span class="text-[10px] font-bold text-primary">${c.name.substring(0,2).toUpperCase()}</span>
          </div>
          <div>
            <p class="text-sm font-semibold text-text">${c.name}</p>
            <p class="text-[10px] text-gray-400">${c.phone || ''} ${c.type ? `· ${c.type}` : ''}</p>
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
    const settings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
    const shopName = settings.shopName || 'Senthil Enterprises';
    const shopAddress = settings.address || '';
    const shopPhone = settings.phone || '';
    const gstin = settings.gstin || '';
    const date = new Date(invoice.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const receiptArea = document.getElementById('print-receipt-area');
    receiptArea.innerHTML = `
      <div class="receipt-title">${shopName}</div>
      ${shopAddress ? `<div style="text-align:center;font-size:11px;">${shopAddress}</div>` : ''}
      ${shopPhone ? `<div style="text-align:center;font-size:11px;">Ph: ${shopPhone}</div>` : ''}
      ${gstin ? `<div style="text-align:center;font-size:11px;">GSTIN: ${gstin}</div>` : ''}
      <div class="receipt-divider"></div>
      <div style="font-size:11px;"><b>Invoice:</b> ${invoice.id}</div>
      <div style="font-size:11px;"><b>Date:</b> ${date}</div>
      <div style="font-size:11px;"><b>Customer:</b> ${invoice.customerName || 'Walk-in'}</div>
      <div style="font-size:11px;"><b>Payment:</b> ${invoice.paymentMode}</div>
      <div class="receipt-divider"></div>
      <table style="width: 100%; font-size: 10px;">
        <tr><th style="text-align:left">Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Total</th></tr>
        ${(invoice.items || []).map(item => {
           const disc = item.discountAmount > 0 ? `<br><small style="color:#666">(-₹${item.discountAmount.toFixed(2)})</small>` : '';
           return `
          <tr>
            <td style="font-size:10px;">${item.name}${disc}</td>
            <td style="text-align:center">${item.qty}</td>
            <td style="text-align:right">₹${item.price}</td>
            <td style="text-align:right">₹${item.total.toFixed(2)}</td>
          </tr>`;
        }).join('')}
      </table>
      <div class="receipt-divider"></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;"><span>Subtotal</span><span>₹${invoice.subtotal.toFixed(2)}</span></div>
      ${invoice.discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Item Discounts</span><span>- ₹${invoice.discount.toFixed(2)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;font-size:11px;"><span>Taxable Amount</span><span>₹${invoice.taxableAmount.toFixed(2)}</span></div>
      ${invoice.cgstTotal > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>CGST</span><span>+ ₹${invoice.cgstTotal.toFixed(2)}</span></div>` : ''}
      ${invoice.sgstTotal > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>SGST</span><span>+ ₹${invoice.sgstTotal.toFixed(2)}</span></div>` : ''}
      <div class="receipt-divider"></div>
      <div class="receipt-total" style="display:flex;justify-content:space-between;"><span>GRAND TOTAL</span><span>₹${invoice.totalAmount.toFixed(2)}</span></div>
      <div class="receipt-divider"></div>
      <div style="text-align:center;font-size:10px;margin-top:8px;">Thank you for shopping with us!</div>
      <div style="text-align:center;font-size:10px;">Please visit again.</div>`;

    window.print();
  };

  // =====================
  // SAVE INVOICE
  // =====================

  const saveInvoice = () => {
    if (cart.length === 0) {
      window.showToast('Cart is empty! Add products first.', 'warning');
      return;
    }
    if (paymentMode === 'Credit' && !selectedCustomer) {
      window.showToast('Please select a customer for Credit sale!', 'warning');
      return;
    }

    const { subtotal, totalDiscount, taxableAmount, taxTotal, cgstTotal, sgstTotal, grandTotal } = getCartTotals();

    const invoice = {
      date: new Date().toISOString(),
      customerId: selectedCustomer ? selectedCustomer.id : null,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
      items: cart.map(i => {
         const lineBase = i.price * i.qty;
         const lineDisc = lineBase * ((i.discountPercent || 0) / 100);
         return {
           productId: i.id,
           name: i.name,
           qty: i.qty,
           price: i.price,
           taxRate: i.taxRate,
           discountPercent: i.discountPercent || 0,
           discountAmount: lineDisc,
           total: lineBase - lineDisc
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
      paymentStatus: paymentMode === 'Credit' ? 'Pending' : 'Paid Full',
      amountPaid: paymentMode === 'Credit' ? 0 : grandTotal,
      status: paymentMode === 'Credit' ? 'Pending' : 'Paid'
    };

    try {
      const saved = DataProvider.saveSalesInvoice(invoice);
      lastSavedInvoice = saved;
      DraftManager.clearDraft('pos');
      
      cart = [];    // Reset state in-place — NO page reload
      paymentMode = 'Cash';
      
      // Reset payment mode UI
      rootElement.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('border-2', 'border-primary', 'bg-primary/5', 'active');
        btn.classList.add('border', 'border-border', 'bg-white', 'text-gray-500');
        btn.querySelector('i')?.classList.remove('text-primary');
        btn.querySelector('span')?.classList.remove('text-primary', 'font-bold');
      });
      const cashBtn = rootElement.querySelector('.payment-btn[data-mode="Cash"]');
      if (cashBtn) {
        cashBtn.classList.remove('border', 'border-border', 'bg-white', 'text-gray-500');
        cashBtn.classList.add('border-2', 'border-primary', 'bg-primary/5', 'active');
        cashBtn.querySelector('i')?.classList.add('text-primary');
        cashBtn.querySelector('span')?.classList.add('text-primary', 'font-bold');
      }
      
      renderCart();
      renderProducts();
      
      window.showToast(`Invoice ${saved.id} saved successfully!`, 'success');
      
    } catch (err) {
      window.showToast(err.message, 'danger');
    }
  };

  // =====================
  // INITIALIZE
  // =====================

  renderCustomerBar();
  renderProducts();
  renderCart();

  // Search & Category
  rootElement.querySelector('#pos-search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    savePosDraft();
    renderProducts();
  });

  rootElement.querySelector('#pos-barcode-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const barcode = e.target.value.trim();
      if (!barcode) return;
      const product = allProducts.find(p => p.barcode === barcode || p.sku === barcode);
      if (product) {
        addToCart(product.id);
        e.target.value = '';
        window.showToast(`${product.name} added`, 'success');
      } else {
        window.showToast('Product not found for this barcode', 'warning');
      }
    }
  });

  rootElement.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
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

  // Product clicks
  rootElement.querySelector('#product-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.pos-product');
    if (card && !card.classList.contains('cursor-not-allowed')) {
      addToCart(card.getAttribute('data-id'));
    }
  });

  // Cart actions
  rootElement.querySelector('#cart-container').addEventListener('click', (e) => {
    const itemEl = e.target.closest('.cart-item');
    if (!itemEl) return;
    const id = itemEl.getAttribute('data-id');

    const deltaBtn = e.target.closest('.qty-btn');
    if (deltaBtn) {
      const delta = parseInt(deltaBtn.getAttribute('data-delta'));
      updateCartQty(id, delta);
      return;
    }
    if (e.target.closest('.cart-del-btn')) {
      cart = cart.filter(i => i.id !== id);
      savePosDraft();
      renderCart();
      renderProducts();
    }
  });

  rootElement.querySelector('#clear-cart-btn').addEventListener('click', () => {
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
    btn.addEventListener('click', (e) => {
      const b = e.target.closest('.payment-btn');
      rootElement.querySelectorAll('.payment-btn').forEach(x => {
        x.classList.remove('border-2', 'border-primary', 'bg-primary/5', 'active');
        x.classList.add('border-border', 'bg-white', 'text-gray-500');
        x.querySelector('span').classList.remove('text-primary');
        x.querySelector('span').classList.add('text-gray-500');
        x.querySelector('i').classList.remove('text-primary');
      });
      b.classList.remove('border-border', 'bg-white', 'text-gray-500');
      b.classList.add('border-2', 'border-primary', 'bg-primary/5', 'active');
      b.querySelector('span').classList.remove('text-gray-500');
      b.querySelector('span').classList.add('text-primary');
      b.querySelector('i').classList.add('text-primary');
      paymentMode = b.getAttribute('data-mode');
      savePosDraft();
    });
  });

  // Customer modal
  rootElement.querySelector('#btn-change-customer').addEventListener('click', openCustomerModal);
  rootElement.querySelector('#close-customer-modal').addEventListener('click', closeCustomerModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCustomerModal(); });

  rootElement.querySelector('#customer-search').addEventListener('input', (e) => {
    renderCustomerList(e.target.value);
  });

  rootElement.querySelector('#customer-list').addEventListener('click', (e) => {
    const row = e.target.closest('.customer-select-row');
    if (row) {
      selectedCustomer = allCustomers.find(c => c.id === row.getAttribute('data-id'));
      renderCustomerBar();
      closeCustomerModal();
    }
  });

  rootElement.querySelector('#btn-walkin-customer').addEventListener('click', () => {
    selectedCustomer = null;
    renderCustomerBar();
    closeCustomerModal();
  });

  // Save invoice
  rootElement.querySelector('#btn-save-invoice').addEventListener('click', saveInvoice);

  // Print Last Invoice
  rootElement.querySelector('#btn-print-last').addEventListener('click', () => {
    if (lastSavedInvoice) {
      printReceipt(lastSavedInvoice);
    } else {
      window.showToast('No invoice saved in this session.', 'warning');
    }
  });

  // Keyboard shortcuts
  const keyHandler = (e) => {
    if (e.key === 'F2') { e.preventDefault(); saveInvoice(); }
    if (e.key === 'Escape') closeCustomerModal();
  };
  window.addEventListener('keydown', keyHandler);

  if (window.lucide) window.lucide.createIcons();

  // Return cleanup
  return function cleanup() {
    window.removeEventListener('keydown', keyHandler);
  };
}
