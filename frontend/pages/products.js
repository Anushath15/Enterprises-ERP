/**
 * Senthil Enterprises ERP - Products Page Controller
 */
import { PrimaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  let products = [];
  try {
    products = await DataProvider.getProducts();
  } catch (error) {
    console.error("Failed to load products", error);
  }

  const renderRow = (p) => {
    // Map backend model to UI
    const initials = p.name.substring(0,2).toUpperCase();
    const isInactive = !p.isActive;
    const initialsColor = isInactive ? 'gray-400' : 'primary';
    const statusBg = isInactive ? 'bg-gray-100 text-gray-500' : `bg-${p.statusBadge}/10 text-${p.statusBadge}`;
    const stockColor = p.statusBadge === 'danger' ? 'danger' : p.statusBadge === 'warning' ? 'warning' : 'text';
    const statusLabel = isInactive ? 'Inactive' : p.status;
    
    return `
    <tr class="row-hover cursor-pointer" onclick="window.dispatchEvent(new CustomEvent('openProductDrawer', {detail: '${p.id}'}))">
      <td class="px-4 py-3"><div class="w-9 h-9 rounded-lg ${initialsColor === 'gray-400' ? 'bg-gray-100 text-gray-400' : `bg-${initialsColor}/10 text-${initialsColor}`} flex items-center justify-center text-xs font-semibold">${initials}</div></td>
      <td class="px-4 py-3 font-medium text-text">${p.id}</td>
      <td class="px-4 py-3 text-gray-500 font-mono text-xs">${p.sku}</td>
      <td class="px-4 py-3 font-medium text-text">${p.name}</td>
      <td class="px-4 py-3 text-gray-500">${p.category}</td>
      <td class="px-4 py-3 text-gray-500">${p.brand}</td>
      <td class="px-4 py-3 text-gray-500">${p.unit}</td>
      <td class="px-4 py-3 text-right font-medium text-${stockColor}">${p.stock}</td>
      <td class="px-4 py-3 text-right text-text">₹${p.price}</td>
      <td class="px-4 py-3 text-right text-text">₹${(p.price * 0.95).toFixed(0)}</td>
      <td class="px-4 py-3 text-right text-text">₹${(p.price * 0.90).toFixed(0)}</td>
      <td class="px-4 py-3 text-right text-text">₹${(p.price * 0.92).toFixed(0)}</td>
      <td class="px-4 py-3 text-right text-text">₹${(p.price * 0.93).toFixed(0)}</td>
      <td class="px-4 py-3 text-right text-gray-500">${p.taxRate}%</td>
      <td class="px-4 py-3"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBg}">${statusLabel}</span></td>
      <td class="px-4 py-3 text-right">
        <button class="p-1.5 rounded-md hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('editProduct', {detail: '${p.id}'}))">
          <svg class="w-4 h-4 text-gray-400 hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"/></svg>
        </button>
        <button class="p-1.5 rounded-md hover:bg-gray-100" onclick="event.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteProduct', {detail: '${p.id}'}))">
          <svg class="w-4 h-4 text-gray-400 hover:text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
        </button>
      </td>
    </tr>
    `;
  };

  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <!-- Top Actions -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Products</h1>
          <p class="text-sm text-gray-400 mt-1">Manage every product available across all categories.</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="flex items-center gap-1.5 px-3.5 py-2 border border-border text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3v11.25"/></svg>
            Import Products
          </button>
          <button class="flex items-center gap-1.5 px-3.5 py-2 border border-border text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
            Export Products
          </button>
          <button id="btn-add-product" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors btn-primary">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Add Product
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        ${KPICard({ title: 'Total Products', value: products.length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>', color: 'primary' })}
        ${KPICard({ title: 'Active Products', value: products.filter(p => p.isActive).length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'success' })}
        ${KPICard({ title: 'Out of Stock', value: products.filter(p => p.stock <= 0).length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>', color: 'danger' })}
        ${KPICard({ title: 'Low Stock', value: products.filter(p => p.stock > 0 && p.stock <= p.minStock).length.toString(), iconSvg: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>', color: 'warning' })}
        <div class="stat-card bg-white rounded-xl border border-border p-5">
          <div class="flex items-start justify-between mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100">
              <div class="w-5 h-5 text-gray-500"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg></div>
            </div>
          </div>
          <p class="text-2xl font-bold text-text">${products.filter(p => !p.isActive).length}</p>
          <p class="text-xs text-gray-400 mt-1">Inactive Products</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-border p-4 mb-6">
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative flex-1 min-w-[220px]">
            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
            <input type="text" placeholder="Search product name, code..." class="search-input w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-primary transition-all">
          </div>
          <select class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary">
            <option>All Categories</option>
            <option>Electrical</option>
            <option>Plumbing / CPVC / UPVC</option>
            <option>Sanitary</option>
            <option>Hardware / Fasteners</option>
          </select>
          <select class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary">
            <option>All Brands</option>
            <option>Astral</option>
            <option>Havells</option>
            <option>Finolex</option>
          </select>
          <select class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary">
            <option>All Suppliers</option>
            <option>Vrindavan Traders</option>
            <option>Astral Pipes Dealer</option>
          </select>
          <select class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary">
            <option>All Stock Status</option>
            <option>In Stock</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
          <select class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary">
            <option>All GST Rates</option>
            <option>5%</option>
            <option>12%</option>
            <option>18%</option>
            <option>28%</option>
          </select>
        </div>
      </div>

      <!-- Product Table -->
      <div class="bg-white rounded-xl border border-border overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm min-w-[1700px]">
            <thead>
              <tr class="border-b border-border bg-gray-50/60 text-left">
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Image</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Code</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Barcode</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Product Name</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Category</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Brand</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Unit</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Stock</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Retail</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Project</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Contractor</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Electrician</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Plumber</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">GST</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Status</th>
                <th class="px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              ${products.map(p => renderRow(p)).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Drawer Overlay -->
    <div id="product-drawer-overlay" class="overlay fixed inset-0 bg-black/30 z-[60] opacity-0 pointer-events-none transition-opacity duration-200"></div>
    
    <!-- View Drawer -->
    <aside id="product-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[420px] bg-white border-l border-border z-[70] overflow-y-auto shadow-2xl transition-transform duration-250">
      <div class="flex items-center justify-between px-5 h-16 border-b border-border sticky top-0 bg-white z-10">
        <h3 class="text-base font-semibold text-text">Product Details</h3>
        <button id="close-product-drawer" class="p-1.5 rounded-md hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="p-5 space-y-5" id="product-drawer-content"></div>
    </aside>

    <!-- Add/Edit Drawer -->
    <aside id="product-form-drawer" class="drawer translate-x-full fixed top-0 right-0 h-screen w-[500px] bg-white border-l border-border z-[70] flex flex-col shadow-2xl transition-transform duration-250">
      <div class="flex items-center justify-between px-6 h-16 border-b border-border sticky top-0 bg-white z-10 flex-shrink-0">
        <h3 class="text-base font-semibold text-text" id="form-drawer-title">Add Product</h3>
        <button id="close-form-drawer" class="p-1.5 rounded-md hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div class="p-6 flex-1 overflow-y-auto space-y-5">
        <form id="product-form">
          <input type="hidden" id="p-id">
          
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">SKU *</label>
              <input type="text" id="p-sku" required class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Barcode</label>
              <input type="text" id="p-barcode" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>

          <div class="mb-4">
            <label class="text-xs font-medium text-gray-500 block mb-1.5">Product Name *</label>
            <input type="text" id="p-name" required class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Category *</label>
              <input type="text" id="p-category" required class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Brand</label>
              <input type="text" id="p-brand" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Base Price (₹) *</label>
              <input type="number" id="p-price" required min="0" step="0.01" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">GST Rate (%) *</label>
              <select id="p-taxRate" required class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Unit *</label>
              <input type="text" id="p-unit" required placeholder="e.g. Pcs, m" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Stock</label>
              <input type="number" id="p-stock" value="0" min="0" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Min Stock</label>
              <input type="number" id="p-minStock" value="0" min="0" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>
          
          <div class="mb-4">
            <label class="text-xs font-medium text-gray-500 flex items-center gap-2">
              <input type="checkbox" id="p-isActive" checked class="rounded border-gray-300 text-primary focus:ring-primary">
              Is Active
            </label>
          </div>
        </form>
      </div>
      
      <div class="p-4 border-t border-border bg-gray-50 flex items-center justify-end gap-3 sticky bottom-0">
        <button id="cancel-form-btn" class="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-border rounded-lg hover:bg-gray-50">Cancel</button>
        <button id="save-product-btn" class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90">Save Product</button>
      </div>
    </aside>

  `;
}

export function onMount(rootElement) {
  document.getElementById('sidebar-root').style.display = 'flex';
  document.getElementById('navbar-root').style.display = 'flex';

  const overlay = rootElement.querySelector('#product-drawer-overlay');
  const viewDrawer = rootElement.querySelector('#product-drawer');
  const formDrawer = rootElement.querySelector('#product-form-drawer');
  
  const closeAllDrawers = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    viewDrawer.classList.add('translate-x-full');
    formDrawer.classList.add('translate-x-full');
  };

  overlay.addEventListener('click', closeAllDrawers);
  rootElement.querySelector('#close-product-drawer').addEventListener('click', closeAllDrawers);
  rootElement.querySelector('#close-form-drawer').addEventListener('click', closeAllDrawers);
  rootElement.querySelector('#cancel-form-btn').addEventListener('click', closeAllDrawers);

  // VIEW DRAWER
  window.addEventListener('openProductDrawer', (e) => {
    const productId = e.detail;
    import('../services/DataProvider.js').then(({ DataProvider }) => {
      const p = DataProvider.getProductById(productId);
      if (!p) return;
      
      const initials = p.name.substring(0,2).toUpperCase();
      const statusBg = !p.isActive ? 'bg-gray-100 text-gray-500' : `bg-${p.statusBadge}/10 text-${p.statusBadge}`;
      const statusLabel = !p.isActive ? 'Inactive' : p.status;

      rootElement.querySelector('#product-drawer-content').innerHTML = `
        <!-- Product Image + Basic Details -->
        <div class="flex items-start gap-4">
          <div class="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg font-semibold flex-shrink-0">${initials}</div>
          <div>
            <h4 class="text-sm font-semibold text-text">${p.name}</h4>
            <p class="text-xs text-gray-400 mt-0.5">${p.sku} · ${p.brand} · ${p.category}</p>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBg} mt-2">${statusLabel}</span>
          </div>
        </div>

        <!-- Current Stock -->
        <div class="bg-gray-50/60 rounded-xl border border-border p-4">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Current Stock</p>
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center">
              <p class="text-lg font-bold text-text">${p.stock}</p>
              <p class="text-[10px] text-gray-400">${p.unit}</p>
            </div>
            <div class="text-center">
              <p class="text-lg font-bold text-warning">${p.minStock}</p>
              <p class="text-[10px] text-gray-400">Reorder Level</p>
            </div>
          </div>
        </div>

        <!-- Pricing -->
        <div>
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Pricing</p>
          <div class="space-y-2">
            <div class="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50/50">
              <span class="text-xs text-gray-500">Retail Price</span>
              <span class="text-sm font-semibold text-text">₹${p.price}</span>
            </div>
          </div>
        </div>

        <div class="flex gap-2 pt-2 pb-4">
          <button class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors" onclick="window.dispatchEvent(new CustomEvent('editProduct', {detail: '${p.id}'}))">
            Edit Product
          </button>
        </div>
      `;

      closeAllDrawers();
      overlay.classList.remove('opacity-0', 'pointer-events-none');
      overlay.classList.add('opacity-100');
      viewDrawer.classList.remove('translate-x-full');
    });
  });

  // ADD / EDIT DRAWER
  const openFormDrawer = (productId = null) => {
    closeAllDrawers();
    const form = rootElement.querySelector('#product-form');
    form.reset();
    
    if (productId) {
      rootElement.querySelector('#form-drawer-title').textContent = 'Edit Product';
      import('../services/DataProvider.js').then(({ DataProvider }) => {
        const p = DataProvider.getProductById(productId);
        if (p) {
          rootElement.querySelector('#p-id').value = p.id;
          rootElement.querySelector('#p-sku').value = p.sku || '';
          rootElement.querySelector('#p-barcode').value = p.barcode || '';
          rootElement.querySelector('#p-name').value = p.name || '';
          rootElement.querySelector('#p-category').value = p.category || '';
          rootElement.querySelector('#p-brand').value = p.brand || '';
          rootElement.querySelector('#p-price').value = p.price || '';
          rootElement.querySelector('#p-taxRate').value = p.taxRate || '0';
          rootElement.querySelector('#p-unit').value = p.unit || '';
          rootElement.querySelector('#p-stock').value = p.stock || 0;
          rootElement.querySelector('#p-minStock').value = p.minStock || 0;
          rootElement.querySelector('#p-isActive').checked = p.isActive !== false;
        }
      });
    } else {
      rootElement.querySelector('#form-drawer-title').textContent = 'Add Product';
      rootElement.querySelector('#p-id').value = '';
    }

    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    formDrawer.classList.remove('translate-x-full');
  };

  rootElement.querySelector('#btn-add-product').addEventListener('click', () => openFormDrawer());
  
  window.addEventListener('editProduct', (e) => {
    openFormDrawer(e.detail);
  });

  window.addEventListener('deleteProduct', (e) => {
    if (confirm('Are you sure you want to delete this product?')) {
      import('../services/DataProvider.js').then(({ DataProvider }) => {
        DataProvider.deleteProduct(e.detail);
        window.location.reload();
      });
    }
  });

  // SAVE LOGIC
  rootElement.querySelector('#save-product-btn').addEventListener('click', () => {
    const form = rootElement.querySelector('#product-form');
    if (!form.reportValidity()) return;

    const productData = {
      id: rootElement.querySelector('#p-id').value || null,
      sku: rootElement.querySelector('#p-sku').value,
      barcode: rootElement.querySelector('#p-barcode').value,
      name: rootElement.querySelector('#p-name').value,
      category: rootElement.querySelector('#p-category').value,
      brand: rootElement.querySelector('#p-brand').value,
      price: Number(rootElement.querySelector('#p-price').value),
      taxRate: Number(rootElement.querySelector('#p-taxRate').value),
      unit: rootElement.querySelector('#p-unit').value,
      stock: Number(rootElement.querySelector('#p-stock').value),
      minStock: Number(rootElement.querySelector('#p-minStock').value),
      isActive: rootElement.querySelector('#p-isActive').checked,
    };

    import('../services/DataProvider.js').then(({ DataProvider }) => {
      try {
        DataProvider.saveProduct(productData);
        window.location.reload();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}
