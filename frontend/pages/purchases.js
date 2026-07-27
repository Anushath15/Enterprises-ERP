/**
 * Senthil Enterprises ERP - Purchases Page Controller
 */
import { PrimaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const purchases = DataProvider.getPurchaseInvoices();
  const dealers = DataProvider.getDealers();

  const renderPORow = (po) => {
    const dealer = DataProvider.getDealerById(po.dealerId) || { name: 'Unknown', phone: '' };
    const initials = dealer.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
    const dealerColor = 'primary'; 
    const statusColor = po.status === 'Pending' ? 'warning' : (po.status === 'Received' ? 'success' : 'danger');

    return \`
    <tr class="row-hover cursor-pointer" onclick="window.dispatchEvent(new CustomEvent('openPurchaseDrawer'))">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">\${po.invoiceNumber || po.id}</td>
      <td class="px-4 py-3.5">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-full bg-\${dealerColor}/10 flex items-center justify-center">
            <span class="text-[10px] font-bold text-\${dealerColor}">\${initials}</span>
          </div>
          <div>
            <p class="text-sm font-medium text-text">\${dealer.name}</p>
            <p class="text-[10px] text-gray-400">\${dealer.phone}</p>
          </div>
        </div>
      </td>
      <td class="px-4 py-3.5 text-sm \${statusColor === 'danger' ? 'text-danger font-medium' : 'text-gray-500'}">\${po.date}</td>
      <td class="px-4 py-3.5 text-sm text-gray-500">\${po.items ? po.items.length : 0} items</td>
      <td class="px-4 py-3.5 text-right text-sm font-semibold text-text">₹\${(po.totalAmount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-\${statusColor}/10 text-\${statusColor}">\${po.status}</span>
      </td>
      <td class="px-4 py-3.5 text-right">
        <div class="flex items-center justify-end gap-1">
          <button class="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('openPurchaseDrawer'))">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
          </button>
        </div>
      </td>
    </tr>
    \`;
  };

  return \`
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Purchase Management</h1>
          <p class="text-sm text-gray-400 mt-1">Track purchase orders, manage suppliers, and monitor deliveries.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="flex items-center gap-1.5 px-3.5 py-2 border border-border text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25"/></svg>
            Import
          </button>
          <button class="flex items-center gap-1.5 px-3.5 py-2 border border-border text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            Export
          </button>
          <button onclick="window.dispatchEvent(new CustomEvent('openPurchaseDrawer'))" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            New Purchase Order
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        \${KPICard({ title: 'Pending Orders', value: purchases.filter(p => p.status === 'Pending').length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'warning' })}
        \${KPICard({ title: 'Total Purchases', value: purchases.length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>', color: 'success' })}
        \${KPICard({ title: 'Purchase Value', value: '₹' + purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString('en-IN', {maximumFractionDigits:0}), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/>', color: 'primary' })}
        \${KPICard({ title: 'Awaiting Delivery', value: purchases.filter(p => p.status === 'Pending').length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'danger' })}
      </div>

      <div class="flex items-center gap-1 border-b border-border mb-6">
        <button class="px-4 py-3 text-sm font-medium text-primary border-b-2 border-primary">Purchase Orders</button>
        <button class="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-text">Goods Received</button>
        <button class="px-4 py-3 text-sm font-medium text-gray-500 border-b-2 border-transparent hover:text-text">Purchase History</button>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div class="xl:col-span-3 space-y-6">
          <div class="bg-white rounded-xl border border-border p-4">
            <div class="flex flex-wrap items-center gap-3">
              <div class="relative flex-1 min-w-[200px]">
                <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
                <input type="text" placeholder="Search PO, dealer..." class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-primary">
              </div>
              <select class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary">
                <option>All Status</option>
                <option>Pending</option>
                <option>Received</option>
                <option>Overdue</option>
              </select>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-border overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[1100px]">
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
                  \${purchases.length > 0 ? purchases.map(renderPORow).join('') : '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No purchases found.</td></tr>'}
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
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="p-6 space-y-5 flex-1 overflow-y-auto">
        <div>
          <label class="text-xs font-medium text-gray-500 block mb-1.5">Dealer / Supplier *</label>
          <select id="po-dealer" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
            <option value="">-- Select Dealer --</option>
            \${dealers.map(d => \`<option value="\${d.id}">\${d.name}</option>\`).join('')}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Purchase Date *</label>
            <input type="date" id="po-date" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Invoice Number</label>
            <input type="text" id="po-invoice-no" placeholder="INV-2026-001" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
          </div>
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
                  <th class="px-3 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wide">Product</th>
                  <th class="px-3 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wide w-20">Qty</th>
                  <th class="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wide w-24">Unit Price</th>
                  <th class="px-3 py-2 text-right text-[10px] font-medium text-gray-500 uppercase tracking-wide w-24">Total</th>
                  <th class="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody id="po-cart-items" class="divide-y divide-border">
                <tr><td colspan="5" class="text-center py-4 text-gray-500 text-sm">No items added</td></tr>
              </tbody>
              <tfoot class="bg-gray-50/60 border-t border-border">
                <tr>
                  <td colspan="3" class="px-3 py-2.5 text-right text-xs font-medium text-gray-500">Subtotal</td>
                  <td colspan="2" class="px-3 py-2.5 text-right text-xs font-semibold text-text" id="po-subtotal">₹0.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Discount (₹)</label>
            <input type="number" id="po-discount" value="0" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
          </div>
          <div>
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Tax Amount (₹)</label>
            <input type="number" id="po-tax" value="0" class="w-full px-3 py-2.5 bg-gray-50 border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary">
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
  \`;
}

export function onMount(rootElement) {
  document.getElementById('sidebar-root').style.display = 'flex';
  document.getElementById('navbar-root').style.display = 'flex';

  const overlay = rootElement.querySelector('#purchase-drawer-overlay');
  const formDrawer = rootElement.querySelector('#purchase-form-drawer');
  const closeBtns = rootElement.querySelectorAll('.close-purchase-drawer');

  // Set default date
  const today = new Date().toISOString().split('T')[0];
  rootElement.querySelector('#po-date').value = today;

  let cart = [];
  let products = [];
  
  import('../services/DataProvider.js').then(({ DataProvider }) => {
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
        searchResults.innerHTML = matches.map(p => \`
          <div class="p-2 border-b border-border hover:bg-gray-50 cursor-pointer po-search-item" data-id="\${p.id}">
            <div class="text-sm font-medium">\${p.name}</div>
            <div class="text-[10px] text-gray-500">\${p.sku} | ₹\${p.price}</div>
          </div>
        \`).join('');
        searchResults.classList.remove('hidden');
      } else {
        searchResults.innerHTML = '<div class="p-2 text-xs text-gray-500">No products found</div>';
        searchResults.classList.remove('hidden');
      }
    });

    // Close search results on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#po-product-search') && !e.target.closest('#po-product-results')) {
        searchResults.classList.add('hidden');
      }
    });

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
            cart.push({
              productId: product.id,
              name: product.name,
              qty: 1,
              price: product.price // Using current retail price as default purchase price for demo
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
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500 text-sm">No items added</td></tr>';
        updateTotals();
        return;
      }

      tbody.innerHTML = cart.map((item, index) => \`
        <tr data-index="\${index}">
          <td class="px-3 py-2.5 text-xs text-text">\${item.name}</td>
          <td class="px-3 py-2.5 text-center">
            <input type="number" value="\${item.qty}" min="1" class="po-qty-input w-14 px-2 py-1 text-xs border border-border rounded bg-white text-center focus:outline-none focus:border-primary">
          </td>
          <td class="px-3 py-2.5 text-right">
            <input type="number" value="\${item.price}" min="0" step="0.01" class="po-price-input w-20 px-2 py-1 text-xs border border-border rounded bg-white text-right focus:outline-none focus:border-primary">
          </td>
          <td class="px-3 py-2.5 text-right text-xs font-semibold text-text">₹\${(item.qty * item.price).toFixed(2)}</td>
          <td class="px-2 py-2.5 text-right">
            <button class="po-remove-btn text-gray-400 hover:text-danger">×</button>
          </td>
        </tr>
      \`).join('');
      updateTotals();
    };

    const updateTotals = () => {
      const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);
      const discount = Number(rootElement.querySelector('#po-discount').value) || 0;
      const tax = Number(rootElement.querySelector('#po-tax').value) || 0;
      
      const grandTotal = subtotal - discount + tax;
      
      rootElement.querySelector('#po-subtotal').textContent = \`₹\${subtotal.toFixed(2)}\`;
      rootElement.querySelector('#po-grand-total').textContent = \`₹\${grandTotal.toFixed(2)}\`;
    };

    // Listeners for cart inputs
    rootElement.querySelector('#po-cart-items').addEventListener('input', (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      const idx = tr.getAttribute('data-index');
      if (e.target.classList.contains('po-qty-input')) {
        cart[idx].qty = Number(e.target.value) || 1;
        renderCart();
      } else if (e.target.classList.contains('po-price-input')) {
        cart[idx].price = Number(e.target.value) || 0;
        renderCart();
      }
    });

    rootElement.querySelector('#po-cart-items').addEventListener('click', (e) => {
      if (e.target.classList.contains('po-remove-btn')) {
        const tr = e.target.closest('tr');
        if (tr) {
          cart.splice(tr.getAttribute('data-index'), 1);
          renderCart();
        }
      }
    });

    rootElement.querySelector('#po-discount').addEventListener('input', updateTotals);
    rootElement.querySelector('#po-tax').addEventListener('input', updateTotals);

    // Save PO
    rootElement.querySelector('#btn-save-po').addEventListener('click', () => {
      const dealerId = rootElement.querySelector('#po-dealer').value;
      if (!dealerId) { alert('Please select a dealer.'); return; }
      if (cart.length === 0) { alert('Please add items to purchase.'); return; }

      const subtotal = cart.reduce((sum, item) => sum + (item.qty * item.price), 0);
      const discount = Number(rootElement.querySelector('#po-discount').value) || 0;
      const taxTotal = Number(rootElement.querySelector('#po-tax').value) || 0;
      const totalAmount = subtotal - discount + taxTotal;
      const paymentStatus = rootElement.querySelector('#po-payment-status').value;

      const invoice = {
        dealerId,
        invoiceNumber: rootElement.querySelector('#po-invoice-no').value,
        date: rootElement.querySelector('#po-date').value,
        status: 'Received',
        items: cart,
        subtotal,
        discount,
        taxTotal,
        totalAmount,
        paymentStatus,
        amountPaid: paymentStatus === 'Paid Full' ? totalAmount : 0
      };

      try {
        DataProvider.savePurchaseInvoice(invoice);
        window.location.reload();
      } catch (e) {
        alert(e.message);
      }
    });

  });

  const closeAll = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    formDrawer.classList.add('translate-x-full');
  };

  const openForm = () => {
    closeAll();
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  window.addEventListener('openPurchaseDrawer', openForm);
  
  closeBtns.forEach(btn => btn.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);
}
