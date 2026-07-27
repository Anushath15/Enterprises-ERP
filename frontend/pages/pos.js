/**
 * Senthil Enterprises ERP - POS Billing Page Controller
 */
import { ProductCard } from '../components/business/productCard.js';
import { CartItem } from '../components/business/cartItem.js';
import { PrimaryButton } from '../components/ui/buttons.js';
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const productsData = DataProvider.getProducts().filter(p => p.isActive);
  const categories = ['All Products', ...new Set(productsData.map(p => p.category))];
  
  const categoryPills = categories.map((cat, i) => 
    \`<button class="category-pill \${i === 0 ? 'active text-white border-primary bg-primary' : 'bg-white text-gray-600 border-border'} px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap" data-category="\${cat}">\${cat}</button>\`
  ).join('');

  return \`
    <div class="p-5 max-w-[1600px] mx-auto">
      <!-- Customer Bar -->
      <div class="bg-white rounded-xl border border-border p-4 mb-5 flex items-center justify-between fade-in">
        <div class="flex items-center gap-6" id="active-customer-info">
          <!-- Will be rendered dynamically -->
        </div>
        <button id="btn-change-customer" class="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors action-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
          Change Customer
        </button>
      </div>

      <!-- Main POS Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-5 h-[calc(100vh-200px)] min-h-[600px]">

        <!-- LEFT: Product Catalog (3 cols) -->
        <div class="lg:col-span-3 flex flex-col gap-4 h-full">
          <!-- Search + Barcode + Category -->
          <div class="bg-white rounded-xl border border-border p-4">
            <div class="flex items-center gap-3 mb-3">
              <div class="relative flex-1">
                <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                <input type="text" id="pos-search-input" placeholder="Search by product name, code..." class="search-input w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text placeholder-gray-400 focus:outline-none focus:border-primary transition-all">
              </div>
              <div class="relative w-48">
                <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/></svg>
                <input type="text" id="pos-barcode-input" placeholder="Scan barcode..." class="search-input w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text placeholder-gray-400 focus:outline-none focus:border-primary transition-all">
              </div>
            </div>
            <div class="flex items-center gap-2 overflow-x-auto pb-1" id="category-pills-container">
              \${categoryPills}
            </div>
          </div>

          <!-- Product Grid -->
          <div class="bg-white rounded-xl border border-border p-4 flex-1 overflow-hidden flex flex-col">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-text">Products</h3>
              <span class="text-xs text-gray-400" id="product-count">Showing \${productsData.length} of \${productsData.length}</span>
            </div>
            <div class="grid grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-1" style="max-height: calc(100% - 32px);" id="product-grid">
              <!-- Rendered dynamically -->
            </div>
          </div>
        </div>

        <!-- RIGHT: Cart + Summary (2 cols) -->
        <div class="lg:col-span-2 flex flex-col gap-4 h-full">
          <!-- Cart -->
          <div class="bg-white rounded-xl border border-border flex-1 flex flex-col overflow-hidden">
            <div class="px-4 py-3 border-b border-border flex items-center justify-between bg-gray-50/50">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
                <h3 class="text-sm font-semibold text-text">Cart</h3>
                <span class="text-xs text-gray-400" id="cart-count">(0 items)</span>
              </div>
              <button id="clear-cart-btn" class="text-xs text-danger hover:text-danger/80 font-medium transition-colors">Clear All</button>
            </div>

            <div class="flex-1 overflow-y-auto" id="cart-container">
              <div class="p-4 text-center text-gray-500 text-sm">Cart is empty</div>
            </div>

            <!-- Cart Footer: Discount + Tax -->
            <div class="px-4 py-3 border-t border-border bg-gray-50/50 space-y-2">
              <div class="flex items-center gap-3">
                <span class="text-xs font-medium text-gray-500 w-20">Discount</span>
                <div class="flex items-center gap-2 flex-1">
                  <input type="number" id="discount-val" value="0" class="w-14 px-2 py-1 text-xs border border-border rounded bg-white text-center focus:outline-none focus:border-primary">
                  <select id="discount-type" class="text-xs border border-border rounded px-2 py-1 bg-white focus:outline-none focus:border-primary">
                    <option value="percent">%</option>
                    <option value="flat">Rs.</option>
                  </select>
                  <span class="text-xs text-success font-medium ml-auto" id="cart-discount-text">- ₹0.00</span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-xs font-medium text-gray-500 w-20">Tax (GST)</span>
                <div class="flex items-center gap-2 flex-1">
                  <span class="text-xs text-gray-600">Calculated per item</span>
                  <span class="text-xs text-text font-medium ml-auto" id="cart-tax-text">+ ₹0.00</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Invoice Summary -->
          <div class="bg-white rounded-xl border border-border p-4">
            <h3 class="text-sm font-semibold text-text mb-3">Invoice Summary</h3>

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
                <span class="text-gray-500">Tax (GST)</span>
                <span class="font-medium text-text" id="summary-tax">+ ₹0.00</span>
              </div>
              <div class="border-t border-border pt-2 flex items-center justify-between">
                <span class="text-base font-bold text-text">Total Amount</span>
                <span class="text-2xl font-extrabold text-primary" id="summary-total">₹0.00</span>
              </div>
            </div>

            <!-- Payment Mode -->
            <div class="mb-4">
              <p class="text-xs font-medium text-gray-500 mb-2">Payment Mode</p>
              <div class="grid grid-cols-3 gap-2" id="payment-modes">
                <button data-mode="Cash" class="payment-btn flex flex-col items-center justify-center p-2 rounded border-2 border-primary bg-primary/5 active">
                  <svg class="w-5 h-5 text-primary mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg>
                  <span class="text-[10px] font-bold text-primary">Cash</span>
                </button>
                <button data-mode="UPI" class="payment-btn flex flex-col items-center justify-center p-2 rounded border border-border bg-white text-gray-500 hover:border-primary/50">
                  <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"/></svg>
                  <span class="text-[10px] font-medium">UPI</span>
                </button>
                <button data-mode="Credit" class="payment-btn flex flex-col items-center justify-center p-2 rounded border border-border bg-white text-gray-500 hover:border-primary/50">
                  <svg class="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>
                  <span class="text-[10px] font-medium">Credit</span>
                </button>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-3 mb-3">
              <button class="py-2.5 rounded-lg border border-border bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-colors">Hold Bill</button>
              <button class="py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors">Print Draft</button>
            </div>
            <div id="btn-save-invoice">
              \${PrimaryButton({ label: 'Save & Print Invoice (F2)', fullWidth: true })}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer Select Modal -->
    <div id="customer-modal-overlay" class="overlay fixed inset-0 bg-black/30 z-[60] opacity-0 pointer-events-none transition-opacity duration-200 flex items-center justify-center">
      <div class="bg-white rounded-xl shadow-2xl w-[400px] max-w-[90vw] transform transition-transform scale-95 opacity-0" id="customer-modal">
        <div class="p-4 border-b border-border flex items-center justify-between">
          <h3 class="text-base font-semibold text-text">Select Customer</h3>
          <button id="close-customer-modal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="p-4 border-b border-border">
          <input type="text" id="customer-search" placeholder="Search customer..." class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
        </div>
        <div class="max-h-[300px] overflow-y-auto p-2" id="customer-list">
          <!-- Customers rendered here -->
        </div>
      </div>
    </div>
  \`;
}

export function onMount(rootElement) {
  document.getElementById('sidebar-root').style.display = 'flex';
  document.getElementById('navbar-root').style.display = 'flex';

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

  import('../components/business/productCard.js').then(({ ProductCard }) => {
    import('../components/business/cartItem.js').then(({ CartItem }) => {
      import('../services/DataProvider.js').then(({ DataProvider }) => {
        allProducts = DataProvider.getProducts().filter(p => p.isActive);
        allCustomers = DataProvider.getCustomers().filter(c => c.isActive);

        // Set default customer
        if (allCustomers.length > 0) {
          selectedCustomer = allCustomers[0];
        }

        const renderProducts = () => {
          const grid = rootElement.querySelector('#product-grid');
          let filtered = allProducts;
          
          if (activeCategory !== 'All Products') {
            filtered = filtered.filter(p => p.category === activeCategory);
          }
          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
          }

          rootElement.querySelector('#product-count').textContent = \`Showing \${filtered.length} of \${allProducts.length}\`;
          
          grid.innerHTML = filtered.map(p => {
            const uiProduct = {
              id: p.id,
              title: p.name,
              subtitle: \`\${p.brand} | \${p.category}\`,
              price: \`₹\${p.price}\`,
              stock: \`\${p.stock} \${p.unit}\`,
              stockStatus: p.stock <= 0 ? 'critical' : (p.stock <= p.minStock ? 'low' : '')
            };
            return \`<div class="pos-product" data-id="\${p.id}">\${ProductCard(uiProduct)}</div>\`;
          }).join('');
        };

        const renderCustomerBar = () => {
          const container = rootElement.querySelector('#active-customer-info');
          if (!selectedCustomer) {
            container.innerHTML = \`<div class="text-sm font-medium text-gray-500">No Customer Selected (Cash Sale)</div>\`;
            return;
          }
          const initials = selectedCustomer.name.substring(0,2).toUpperCase();
          container.innerHTML = \`
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span class="text-sm font-bold text-primary">\${initials}</span>
              </div>
              <div>
                <p class="text-xs text-gray-400">Customer</p>
                <p class="text-sm font-semibold text-text">\${selectedCustomer.name}</p>
              </div>
            </div>
            <div class="h-8 w-px bg-border hidden sm:block"></div>
            <div class="hidden sm:block">
              <p class="text-xs text-gray-400">Type</p>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">\${selectedCustomer.type || 'Retail'}</span>
            </div>
            <div class="h-8 w-px bg-border hidden sm:block"></div>
            <div class="hidden sm:block">
              <p class="text-xs text-gray-400">Phone</p>
              <p class="text-sm font-medium text-text">\${selectedCustomer.phone || 'N/A'}</p>
            </div>
            <div class="h-8 w-px bg-border hidden md:block"></div>
            <div class="hidden md:block">
              <p class="text-xs text-gray-400">Credit Balance</p>
              <p class="text-sm font-semibold \${selectedCustomer.outstanding > 0 ? 'text-danger' : 'text-success'}">
                ₹\${selectedCustomer.outstanding || 0} \${selectedCustomer.outstanding > 0 ? 'pending' : ''}
              </p>
            </div>
          \`;
        };

        const renderCart = () => {
          const container = rootElement.querySelector('#cart-container');
          
          let subtotal = 0;
          let taxTotal = 0;

          if (cart.length === 0) {
            container.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">Cart is empty</div>';
          } else {
            container.innerHTML = cart.map(item => {
              const itemTotal = item.price * item.qty;
              subtotal += itemTotal;
              
              // Tax is inclusive or exclusive? Let's assume price is base price, tax is added
              const itemTax = itemTotal * (item.taxRate / 100);
              taxTotal += itemTax;

              return CartItem({
                id: item.id,
                title: item.name,
                calculation: \`₹\${item.price} x \${item.qty}\`,
                quantity: item.qty,
                total: \`₹\${itemTotal.toFixed(2)}\`
              });
            }).join('');
          }

          let discountAmount = 0;
          if (discountType === 'percent') {
            discountAmount = subtotal * (discountVal / 100);
          } else {
            discountAmount = discountVal;
          }

          const grandTotal = subtotal - discountAmount + taxTotal;

          rootElement.querySelector('#cart-count').textContent = \`(\${cart.length} items)\`;
          rootElement.querySelector('#cart-discount-text').textContent = \`- ₹\${discountAmount.toFixed(2)}\`;
          rootElement.querySelector('#cart-tax-text').textContent = \`+ ₹\${taxTotal.toFixed(2)}\`;
          
          rootElement.querySelector('#summary-subtotal-label').textContent = \`Subtotal (\${cart.length} items)\`;
          rootElement.querySelector('#summary-subtotal').textContent = \`₹\${subtotal.toFixed(2)}\`;
          rootElement.querySelector('#summary-discount').textContent = \`- ₹\${discountAmount.toFixed(2)}\`;
          rootElement.querySelector('#summary-tax').textContent = \`+ ₹\${taxTotal.toFixed(2)}\`;
          rootElement.querySelector('#summary-total').textContent = \`₹\${grandTotal.toFixed(2)}\`;
        };

        const addToCart = (productId) => {
          const product = allProducts.find(p => p.id === productId);
          if (!product) return;
          
          const existing = cart.find(item => item.id === productId);
          if (existing) {
            existing.qty += 1;
          } else {
            cart.push({
              id: product.id,
              name: product.name,
              price: product.price,
              taxRate: product.taxRate || 0,
              qty: 1
            });
          }
          renderCart();
        };

        const updateCartQty = (productId, delta) => {
          const item = cart.find(i => i.id === productId);
          if (!item) return;
          item.qty += delta;
          if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== productId);
          }
          renderCart();
        };

        // Initialize UI
        renderCustomerBar();
        renderProducts();
        renderCart();

        // Event Listeners: Search & Category
        rootElement.querySelector('#pos-search-input').addEventListener('input', (e) => {
          searchQuery = e.target.value;
          renderProducts();
        });

        rootElement.querySelectorAll('.category-pill').forEach(pill => {
          pill.addEventListener('click', (e) => {
            rootElement.querySelectorAll('.category-pill').forEach(p => {
              p.classList.remove('active', 'text-white', 'border-primary', 'bg-primary');
              p.classList.add('bg-white', 'text-gray-600', 'border-border');
            });
            const t = e.currentTarget;
            t.classList.remove('bg-white', 'text-gray-600', 'border-border');
            t.classList.add('active', 'text-white', 'border-primary', 'bg-primary');
            activeCategory = t.getAttribute('data-category');
            renderProducts();
          });
        });

        // Event Listeners: Product Clicks
        rootElement.querySelector('#product-grid').addEventListener('click', (e) => {
          const card = e.target.closest('.pos-product');
          if (card) {
            addToCart(card.getAttribute('data-id'));
          }
        });

        // Event Listeners: Cart Actions
        rootElement.querySelector('#cart-container').addEventListener('click', (e) => {
          const itemEl = e.target.closest('.cart-item');
          if (!itemEl) return;
          const id = itemEl.getAttribute('data-id');

          if (e.target.closest('.qty-btn')) {
            const btn = e.target.closest('.qty-btn');
            if (btn.textContent === '+') {
              updateCartQty(id, 1);
            } else if (btn.textContent === '-') {
              updateCartQty(id, -1);
            }
          } else if (e.target.closest('button.text-gray-400')) {
            // Delete button (has svg)
            cart = cart.filter(i => i.id !== id);
            renderCart();
          }
        });

        rootElement.querySelector('#clear-cart-btn').addEventListener('click', () => {
          cart = [];
          renderCart();
        });

        // Discount changes
        rootElement.querySelector('#discount-val').addEventListener('input', (e) => {
          discountVal = Number(e.target.value) || 0;
          renderCart();
        });
        rootElement.querySelector('#discount-type').addEventListener('change', (e) => {
          discountType = e.target.value;
          renderCart();
        });

        // Payment Mode
        rootElement.querySelectorAll('.payment-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            rootElement.querySelectorAll('.payment-btn').forEach(b => {
              b.classList.remove('border-2', 'border-primary', 'bg-primary/5', 'active');
              b.classList.add('border-border', 'bg-white', 'text-gray-500');
              b.querySelector('span').classList.remove('text-primary');
              b.querySelector('svg').classList.remove('text-primary');
            });
            const t = e.currentTarget;
            t.classList.remove('border-border', 'bg-white', 'text-gray-500');
            t.classList.add('border-2', 'border-primary', 'bg-primary/5', 'active');
            t.querySelector('span').classList.add('text-primary');
            t.querySelector('svg').classList.add('text-primary');
            paymentMode = t.getAttribute('data-mode');
          });
        });

        // Customer Modal
        const overlay = rootElement.querySelector('#customer-modal-overlay');
        const modal = rootElement.querySelector('#customer-modal');
        const openCustomerModal = () => {
          overlay.classList.remove('opacity-0', 'pointer-events-none');
          overlay.classList.add('opacity-100');
          modal.classList.remove('scale-95', 'opacity-0');
          modal.classList.add('scale-100', 'opacity-100');
          
          const list = rootElement.querySelector('#customer-list');
          list.innerHTML = allCustomers.map(c => \`
            <div class="p-3 border-b border-border hover:bg-gray-50 cursor-pointer flex justify-between items-center customer-select-row" data-id="\${c.id}">
              <div>
                <p class="text-sm font-semibold text-text">\${c.name}</p>
                <p class="text-xs text-gray-500">\${c.phone || ''}</p>
              </div>
              <span class="text-xs font-bold \${c.outstanding > 0 ? 'text-danger' : 'text-gray-400'}">₹\${c.outstanding || 0}</span>
            </div>
          \`).join('');
        };

        const closeCustomerModal = () => {
          overlay.classList.remove('opacity-100');
          overlay.classList.add('opacity-0', 'pointer-events-none');
          modal.classList.remove('scale-100', 'opacity-100');
          modal.classList.add('scale-95', 'opacity-0');
        };

        rootElement.querySelector('#btn-change-customer').addEventListener('click', openCustomerModal);
        rootElement.querySelector('#close-customer-modal').addEventListener('click', closeCustomerModal);
        
        rootElement.querySelector('#customer-list').addEventListener('click', (e) => {
          const row = e.target.closest('.customer-select-row');
          if (row) {
            const id = row.getAttribute('data-id');
            selectedCustomer = allCustomers.find(c => c.id === id);
            renderCustomerBar();
            closeCustomerModal();
          }
        });

        // SAVE INVOICE
        rootElement.querySelector('#btn-save-invoice').addEventListener('click', () => {
          if (cart.length === 0) {
            alert('Cart is empty!');
            return;
          }
          if (paymentMode === 'Credit' && !selectedCustomer) {
            alert('Please select a customer for Credit sale!');
            return;
          }

          let subtotal = 0;
          let taxTotal = 0;
          cart.forEach(item => {
            const itemTotal = item.price * item.qty;
            subtotal += itemTotal;
            taxTotal += itemTotal * (item.taxRate / 100);
          });
          
          let discountAmount = discountType === 'percent' ? subtotal * (discountVal / 100) : discountVal;
          const grandTotal = subtotal - discountAmount + taxTotal;

          const invoice = {
            date: new Date().toISOString(),
            customerId: selectedCustomer ? selectedCustomer.id : null,
            customerName: selectedCustomer ? selectedCustomer.name : 'Cash Customer',
            items: cart.map(i => ({ productId: i.id, name: i.name, qty: i.qty, price: i.price, taxRate: i.taxRate })),
            subtotal: subtotal,
            discount: discountAmount,
            taxTotal: taxTotal,
            totalAmount: grandTotal,
            paymentMode: paymentMode,
            paymentStatus: paymentMode === 'Credit' ? 'Pending' : 'Paid Full',
            amountPaid: paymentMode === 'Credit' ? 0 : grandTotal
          };

          try {
            const saved = DataProvider.saveSalesInvoice(invoice);
            // alert(\`Invoice \${saved.id} generated successfully!\`);
            // Reset cart
            cart = [];
            discountVal = 0;
            rootElement.querySelector('#discount-val').value = 0;
            paymentMode = 'Cash';
            renderCart();
            // Just refresh
            window.location.reload();
          } catch (err) {
            alert(err.message);
          }
        });

        // F2 Shortcut
        window.addEventListener('keydown', (e) => {
          if (e.key === 'F2') {
            e.preventDefault();
            rootElement.querySelector('#btn-save-invoice').click();
          }
        });
      });
    });
  });
}
