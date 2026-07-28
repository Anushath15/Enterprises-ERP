/**
 * Senthil Enterprises ERP - POS Billing Page Controller
 * Fixes: BUG-004 (no reload), BUG-005 (print receipt), BUG-010 (no alerts)
 */
import { DataProvider } from '../services/dataProvider.js';

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

            <!-- Discount + Tax row -->
            <div class="px-4 py-3 border-t border-border bg-gray-50/50 space-y-2">
              <div class="flex items-center gap-3">
                <span class="text-xs font-medium text-gray-500 w-20">Discount</span>
                <div class="flex items-center gap-2 flex-1">
                  <input type="number" id="discount-val" value="0" min="0" class="w-16 px-2 py-1.5 text-xs border border-border rounded-lg bg-white text-center focus:outline-none focus:border-primary">
                  <select id="discount-type" class="text-xs border border-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-primary">
                    <option value="percent">%</option>
                    <option value="flat">₹ Flat</option>
                  </select>
                  <span class="text-xs text-success font-semibold ml-auto" id="cart-discount-text">- ₹0.00</span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs font-medium text-gray-500 w-20">GST (Tax)</span>
                <div class="flex items-center flex-1">
                  <span class="text-xs text-gray-500">Per item rate</span>
                  <span class="text-xs font-semibold text-text ml-auto" id="cart-tax-text">+ ₹0.00</span>
                </div>
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
                <span class="text-gray-500">Discount</span>
                <span class="font-medium text-success" id="summary-discount">- ₹0.00</span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">GST</span>
                <span class="font-medium text-text" id="summary-tax">+ ₹0.00</span>
              </div>
              <div class="border-t border-border pt-2 flex items-center justify-between">
                <span class="text-base font-bold text-text">Total Amount</span>
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
              <button id="btn-save-invoice" class="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm col-span-2">
                <i data-lucide="save" class="w-4 h-4"></i> Save & Print Invoice (F2)
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
        (p.barcode || '').includes(q)
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
  };

  const getCartTotals = () => {
    let subtotal = 0, taxTotal = 0;
    cart.forEach(item => {
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;
      taxTotal += itemTotal * ((item.taxRate || 0) / 100);
    });
    let discountAmount = discountType === 'percent' ? subtotal * (discountVal / 100) : Math.min(discountVal, subtotal);
    const grandTotal = subtotal - discountAmount + taxTotal;
    return { subtotal, taxTotal, discountAmount, grandTotal };
  };

  const renderCart = () => {
    const container = rootElement.querySelector('#cart-container');
    if (cart.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
          <i data-lucide="shopping-cart" class="w-8 h-8 text-gray-200"></i>
          <span>Cart is empty. Click a product to add.</span>
        </div>`;
      if (window.lucide) window.lucide.createIcons({ nodes: [container] });
    } else {
      container.innerHTML = cart.map(item => {
        const itemTotal = (item.price * item.qty).toFixed(2);
        return `
          <div class="cart-item flex items-center gap-3 px-4 py-3 border-b border-gray-100 hover:bg-gray-50/50 transition-colors" data-id="${item.id}">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-text truncate">${item.name}</p>
              <p class="text-[10px] text-gray-400">₹${item.price} × ${item.qty}</p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button class="qty-btn w-6 h-6 flex items-center justify-center rounded border border-border text-gray-500 hover:bg-gray-100 text-xs font-bold" data-delta="-1">−</button>
              <span class="w-7 text-center text-xs font-bold text-text">${item.qty}</span>
              <button class="qty-btn w-6 h-6 flex items-center justify-center rounded border border-border text-gray-500 hover:bg-gray-100 text-xs font-bold" data-delta="1">+</button>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-bold text-text">₹${itemTotal}</p>
            </div>
            <button class="cart-del-btn text-gray-300 hover:text-danger transition-colors ml-1">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>`;
      }).join('');
      if (window.lucide) window.lucide.createIcons({ nodes: [container] });
    }

    const { subtotal, taxTotal, discountAmount, grandTotal } = getCartTotals();
    rootElement.querySelector('#cart-count').textContent = `(${cart.length} item${cart.length !== 1 ? 's' : ''})`;
    rootElement.querySelector('#cart-discount-text').textContent = `- ₹${discountAmount.toFixed(2)}`;
    rootElement.querySelector('#cart-tax-text').textContent = `+ ₹${taxTotal.toFixed(2)}`;
    rootElement.querySelector('#summary-subtotal-label').textContent = `Subtotal (${cart.length} items)`;
    rootElement.querySelector('#summary-subtotal').textContent = `₹${subtotal.toFixed(2)}`;
    rootElement.querySelector('#summary-discount').textContent = `- ₹${discountAmount.toFixed(2)}`;
    rootElement.querySelector('#summary-tax').textContent = `+ ₹${taxTotal.toFixed(2)}`;
    rootElement.querySelector('#summary-total').textContent = `₹${grandTotal.toFixed(2)}`;
  };

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
      <table>
        <tr><th style="text-align:left">Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Total</th></tr>
        ${(invoice.items || []).map(item => `
          <tr>
            <td style="font-size:10px;">${item.name}</td>
            <td style="text-align:center">${item.qty}</td>
            <td style="text-align:right">₹${item.price}</td>
            <td style="text-align:right">₹${(item.qty * item.price).toFixed(2)}</td>
          </tr>`).join('')}
      </table>
      <div class="receipt-divider"></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;"><span>Subtotal</span><span>₹${invoice.subtotal.toFixed(2)}</span></div>
      ${invoice.discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>Discount</span><span>- ₹${invoice.discount.toFixed(2)}</span></div>` : ''}
      ${invoice.taxTotal > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;"><span>GST</span><span>+ ₹${invoice.taxTotal.toFixed(2)}</span></div>` : ''}
      <div class="receipt-divider"></div>
      <div class="receipt-total" style="display:flex;justify-content:space-between;"><span>TOTAL</span><span>₹${invoice.totalAmount.toFixed(2)}</span></div>
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

    const { subtotal, taxTotal, discountAmount, grandTotal } = getCartTotals();

    const invoice = {
      date: new Date().toISOString(),
      customerId: selectedCustomer ? selectedCustomer.id : null,
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
      items: cart.map(i => ({
        productId: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
        taxRate: i.taxRate,
        total: i.price * i.qty
      })),
      subtotal,
      discount: discountAmount,
      taxTotal,
      totalAmount: grandTotal,
      paymentMode,
      paymentStatus: paymentMode === 'Credit' ? 'Pending' : 'Paid Full',
      amountPaid: paymentMode === 'Credit' ? 0 : grandTotal,
      status: paymentMode === 'Credit' ? 'Pending' : 'Paid'
    };

    try {
      const saved = DataProvider.saveSalesInvoice(invoice);
      lastSavedInvoice = saved;
      
      // Reset state in-place — NO page reload
      cart = [];
      discountVal = 0;
      discountType = 'percent';
      paymentMode = 'Cash';
      
      rootElement.querySelector('#discount-val').value = 0;
      rootElement.querySelector('#discount-type').value = 'percent';
      
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
      
      // Print receipt
      setTimeout(() => printReceipt(saved), 300);
      
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
      renderCart();
      renderProducts();
    }
  });

  rootElement.querySelector('#clear-cart-btn').addEventListener('click', () => {
    if (cart.length === 0) return;
    cart = [];
    renderCart();
    renderProducts();
  });

  // Discount
  rootElement.querySelector('#discount-val').addEventListener('input', (e) => {
    discountVal = Math.max(0, Number(e.target.value) || 0);
    renderCart();
  });
  rootElement.querySelector('#discount-type').addEventListener('change', (e) => {
    discountType = e.target.value;
    renderCart();
  });

  // Payment mode
  rootElement.querySelectorAll('.payment-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      rootElement.querySelectorAll('.payment-btn').forEach(b => {
        b.classList.remove('border-2', 'border-primary', 'bg-primary/5', 'active');
        b.classList.add('border', 'border-border', 'bg-white', 'text-gray-500');
        b.querySelector('i')?.classList.remove('text-primary');
        b.querySelector('span')?.classList.remove('text-primary', 'font-bold');
      });
      const t = e.currentTarget;
      t.classList.remove('border', 'border-border', 'bg-white', 'text-gray-500');
      t.classList.add('border-2', 'border-primary', 'bg-primary/5', 'active');
      t.querySelector('i')?.classList.add('text-primary');
      t.querySelector('span')?.classList.add('text-primary', 'font-bold');
      paymentMode = t.getAttribute('data-mode');
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
