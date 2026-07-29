/**
 * Senthil Enterprises ERP - Products Page Controller
 */
import { PrimaryButton, SecondaryButton } from '../components/ui/buttons.js';
import { KPICard } from '../components/ui/cards.js';
import { DataProvider } from '../services/dataProvider.js';

  const renderRow = window._productsRenderRow = (p) => {
    const isInactive = !p.isActive;
    const statusBg = isInactive ? 'bg-gray-100 text-gray-500' : `bg-${p.statusBadge}/10 text-${p.statusBadge}`;
    const stockColor = p.statusBadge === 'danger' ? 'danger' : p.statusBadge === 'warning' ? 'warning' : 'text';
    const statusLabel = isInactive ? 'Inactive' : p.status;
    
    return `
    <tr class="row-hover cursor-pointer" onclick="window.dispatchEvent(new CustomEvent('openProductDrawer', {detail: '${p.id}'}))">
      <td class="px-4 py-3.5 text-left" onclick="event.stopPropagation()">
        <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-primary">
      </td>
      <td class="px-4 py-3 font-medium text-text">${p.id}</td>
      <td class="px-4 py-3 text-gray-500 font-mono text-xs">${p.sku || '-'}</td>
      <td class="px-4 py-3 font-medium text-text">${p.name}</td>
      <td class="px-4 py-3 text-gray-500">${p.category || '-'}</td>
      <td class="px-4 py-3 text-gray-500">${p.brand || '-'}</td>
      <td class="px-4 py-3 text-right text-text font-medium text-${stockColor}">${p.stock} <span class="text-xs text-gray-400 font-normal">${p.unit || 'Nos'}</span></td>
      <td class="px-4 py-3 text-right text-text">₹${(p.avgCost || p.buyingPrice || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3 text-right font-medium text-primary">₹${(p.price || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3 text-right text-gray-500">${p.gst || 0}%</td>
      <td class="px-4 py-3 text-center"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBg}">${statusLabel}</span></td>
      <td class="px-4 py-3 text-center">
        <button class="delete-product-btn action-icon p-1.5 rounded-lg text-gray-400 hover:text-danger" data-id="${p.id}" onclick="event.stopPropagation()">
          <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>
    `;
  };

export async function render() {
  const products = DataProvider.getProducts();
  return `
    <div class="p-6 max-w-[1600px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Products &amp; Inventory</h1>
          <p class="text-sm text-gray-400 mt-0.5">Manage products, pricing, stock levels, and barcodes.</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="btn-import-excel" class="flex items-center gap-1.5 px-3.5 py-2 border border-border text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <i data-lucide="file-spreadsheet" class="w-4 h-4 text-success"></i> Import Excel
          </button>
          <button id="btn-add-product" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i> Add Product
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        ${KPICard({ title: 'Total Products', value: products.length.toString(), iconSvg: '<i data-lucide="package"></i>', color: 'primary' })}
        ${KPICard({ title: 'Active', value: products.filter(p => p.isActive !== false).length.toString(), iconSvg: '<i data-lucide="check-circle"></i>', color: 'success' })}
        ${KPICard({ title: 'Out of Stock', value: products.filter(p => p.stock <= 0).length.toString(), iconSvg: '<i data-lucide="alert-triangle"></i>', color: 'danger' })}
        ${KPICard({ title: 'Low Stock', value: products.filter(p => p.stock > 0 && p.stock <= p.minStock).length.toString(), iconSvg: '<i data-lucide="info"></i>', color: 'warning' })}
        <div class="bg-white rounded-xl border border-border p-5">
           <p class="text-xs text-gray-400">Total Stock Value</p>
           <p class="text-2xl font-bold text-text mt-1">₹${products.reduce((sum, p) => sum + (p.stock * (p.avgCost || p.buyingPrice || p.price || 0)), 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px] max-w-md">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="product-search" placeholder="Search by name, SKU, barcode, category..." 
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
        </div>
        <select id="product-category-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
          <option value="">All Categories</option>
          ${[...new Set(products.map(p => p.category).filter(Boolean))].sort().map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        </select>
        <select id="product-stock-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
          <option value="">All Stock Status</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <span id="product-count-label" class="text-xs text-gray-400 ml-auto">Showing ${products.length} products</span>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden fade-in fade-in-d3 shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border bg-gray-50/50">
                <th class="w-10 px-5 py-3"></th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">ID</th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">SKU</th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Product Name</th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Category</th>
                <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Brand</th>
                <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Stock</th>
                <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Avg Cost</th>
                <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Selling Price</th>
                <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">GST</th>
                <th class="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                <th class="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody id="products-tbody" class="divide-y divide-border">
              ${products.length ? products.map(p => renderRow(p)).join('') : '<tr><td colspan="12"><div class="empty-state"><i data-lucide="package"></i><p>No products found.</p></div></td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Product Drawer -->
    <div id="product-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 opacity-0 pointer-events-none transition-opacity duration-300"></div>
    <aside id="product-drawer" class="fixed top-0 right-0 h-screen w-full md:w-[800px] lg:w-[1000px] bg-gray-50 border-l border-border z-[60] transform translate-x-full transition-transform duration-300 flex flex-col shadow-2xl">
      <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-border">
        <h3 class="text-lg font-bold text-text" id="drawer-title">New Product</h3>
        <button class="close-product-drawer p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-danger/10">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        <form id="product-form" class="p-6 space-y-6">
          <input type="hidden" id="p-id">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-6">
              <div class="bg-white p-5 rounded-xl border border-border shadow-sm">
                <h4 class="text-sm font-semibold text-primary mb-3">Basic Details</h4>
                <div class="space-y-3">
                  <div><label class="block text-xs font-medium text-gray-500 mb-1">Product Name *</label><input type="text" id="p-name" required class="w-full px-3 py-2 border rounded-lg text-sm"></div>
                  <div class="grid grid-cols-2 gap-3">
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">SKU</label><input type="text" id="p-sku" class="w-full px-3 py-2 border rounded-lg text-sm uppercase"></div>
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">Barcode</label><input type="text" id="p-barcode" class="w-full px-3 py-2 border rounded-lg text-sm"></div>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium text-gray-500 mb-1">Category</label>
                      <select id="p-category" class="w-full px-3 py-2 border rounded-lg text-sm bg-white"></select>
                    </div>
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">Subcategory</label><input type="text" id="p-subcategory" class="w-full px-3 py-2 border rounded-lg text-sm"></div>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">Brand</label><input type="text" id="p-brand" class="w-full px-3 py-2 border rounded-lg text-sm"></div>
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">Unit (e.g. Nos, Kg, Mtr)</label><input type="text" id="p-unit" value="Nos" class="w-full px-3 py-2 border rounded-lg text-sm"></div>
                  </div>
                </div>
              </div>

              <div class="bg-white p-5 rounded-xl border border-border shadow-sm">
                <h4 class="text-sm font-semibold text-primary mb-3">Pricing & Taxation</h4>
                <div class="space-y-3">
                  <div class="grid grid-cols-3 gap-3">
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">Buying Price</label><input type="number" step="0.01" id="p-buying" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20"></div>
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">Average Cost</label><input type="number" step="0.01" id="p-avg-cost" readonly class="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500" title="Auto-calculated from purchase history"></div>
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">Latest Cost</label><input type="number" step="0.01" id="p-latest-cost" readonly class="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500" title="Cost of last purchase"></div>
                  </div>
                  <div class="grid grid-cols-2 gap-3 mt-3">
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">Selling Price *</label><input type="number" step="0.01" id="p-price" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20"></div>
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">MRP</label><input type="number" step="0.01" id="p-mrp" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20"></div>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">HSN Code</label><input type="text" id="p-hsn" class="w-full px-3 py-2 border rounded-lg text-sm"></div>
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">GST %</label><input type="number" id="p-gst" value="18" class="w-full px-3 py-2 border rounded-lg text-sm"></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-6">
              <div class="bg-white p-5 rounded-xl border border-border shadow-sm">
                <h4 class="text-sm font-semibold text-primary mb-3">Inventory Management</h4>
                <div class="space-y-3">
                  <div class="grid grid-cols-4 gap-3">
                    <div><label class="block text-[10px] font-bold text-gray-600 mb-1">Current Stock *</label><input type="number" id="p-stock" required class="w-full px-2 py-2 border rounded-lg text-sm font-bold text-primary bg-primary/5 focus:ring-2 focus:ring-primary/20"></div>
                    <div><label class="block text-[10px] font-bold text-gray-600 mb-1">Reserved (SO)</label><input type="number" id="p-reserved" value="0" readonly class="w-full px-2 py-2 border border-orange-200 rounded-lg text-sm text-orange-600 bg-orange-50/30"></div>
                    <div><label class="block text-[10px] font-bold text-gray-600 mb-1">Min Stock</label><input type="number" id="p-minstock" value="5" class="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20"></div>
                    <div><label class="block text-[10px] font-bold text-gray-600 mb-1">Max Stock</label><input type="number" id="p-maxstock" value="100" class="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20"></div>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">Rack / Bin</label><input type="text" id="p-rack" class="w-full px-3 py-2 border rounded-lg text-sm"></div>
                    <div><label class="block text-xs font-medium text-gray-500 mb-1">Shelf</label><input type="text" id="p-shelf" class="w-full px-3 py-2 border rounded-lg text-sm"></div>
                  </div>
                  <div><label class="block text-xs font-medium text-gray-500 mb-1">Primary Supplier</label><input type="text" id="p-supplier" class="w-full px-3 py-2 border rounded-lg text-sm"></div>
                </div>
              </div>

              <div class="bg-white p-5 rounded-xl border border-border shadow-sm">
                <h4 class="text-sm font-semibold text-primary mb-3">Additional Details</h4>
                <div class="space-y-3">
                  <div><label class="block text-xs font-medium text-gray-500 mb-1">Warranty Info</label><input type="text" id="p-warranty" class="w-full px-3 py-2 border rounded-lg text-sm"></div>
                  <div><label class="block text-xs font-medium text-gray-500 mb-1">Image URL</label><input type="url" id="p-image" class="w-full px-3 py-2 border rounded-lg text-sm"></div>
                  <div><label class="block text-xs font-medium text-gray-500 mb-1">Description</label><textarea id="p-desc" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm"></textarea></div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div class="p-5 bg-white border-t border-border flex justify-end gap-3">
        <button type="button" class="close-product-drawer px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button id="save-p-btn" type="button" class="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center gap-2">
          <i data-lucide="save" class="w-4 h-4"></i> Save Product
        </button>
      </div>
    </aside>

    <!-- Excel Import Modal -->
    <div id="import-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center hidden opacity-0 transition-opacity">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform scale-95 transition-transform" id="import-modal-content">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-text">Import Products</h3>
          <button id="close-import" class="text-gray-400 hover:text-danger"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <p class="text-sm text-gray-500 mb-4">Upload an Excel file (xlsx, xls, csv). The file must contain headers like: SKU, Name, Stock, BuyingPrice, SellingPrice, MRP, Category, Brand, GST.</p>
        
        <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors mb-4 relative">
          <input type="file" id="excel-file" accept=".xlsx, .xls, .csv" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
          <i data-lucide="upload-cloud" class="w-10 h-10 text-primary mx-auto mb-2"></i>
          <p class="text-sm font-medium text-gray-600" id="file-name-label">Click to select or drag and drop</p>
        </div>
        
        <button id="btn-process-import" class="w-full px-4 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50" disabled>
          Process Import
        </button>
      </div>
    </div>
  `;
}

export function onMount() {
  if (window.lucide) lucide.createIcons();
  
  const allProducts = DataProvider.getProducts();
  const overlay = document.getElementById('product-overlay');
  const drawer = document.getElementById('product-drawer');
  
  // =====================
  // SEARCH & FILTER
  // =====================
  const searchInput = document.getElementById('product-search');
  const categoryFilter = document.getElementById('product-category-filter');
  const stockFilter = document.getElementById('product-stock-filter');
  const tbody = document.getElementById('products-tbody');
  const countLabel = document.getElementById('product-count-label');

  const renderRow = window._productsRenderRow;

  if (searchInput && tbody) {
    const applyFilter = () => {
      const q = searchInput.value.toLowerCase().trim();
      const cat = categoryFilter?.value || '';
      const stock = stockFilter?.value || '';

      const filtered = allProducts.filter(p => {
        if (q && !p.name.toLowerCase().includes(q) && !(p.sku || '').toLowerCase().includes(q) && !(p.barcode || '').includes(q) && !(p.category || '').toLowerCase().includes(q) && !(p.brand || '').toLowerCase().includes(q)) return false;
        if (cat && p.category !== cat) return false;
        if (stock === 'in' && !(p.stock > p.minStock)) return false;
        if (stock === 'low' && !(p.stock > 0 && p.stock <= p.minStock)) return false;
        if (stock === 'out' && p.stock > 0) return false;
        return true;
      });

      if (countLabel) countLabel.textContent = `Showing ${filtered.length} of ${allProducts.length} products`;
      tbody.innerHTML = filtered.length > 0 
        ? filtered.map(renderRow).join('') 
        : '<tr><td colspan="12"><div class="empty-state"><i data-lucide="package"></i><p>No products match your filters</p></div></td></tr>';
      if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
      
      // Re-attach delete listener
      tbody.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
      });
    };

    searchInput.addEventListener('input', applyFilter);
    categoryFilter?.addEventListener('change', applyFilter);
    stockFilter?.addEventListener('change', applyFilter);
  }

  // Delete handler
  const handleDelete = (e) => {
    const id = e.currentTarget.getAttribute('data-id');
    const row = e.currentTarget.closest('tr');
    if (!row) return;

    const div = document.createElement('div');
    div.className = 'fixed inset-0 bg-black/50 z-[100] flex items-center justify-center';
    div.innerHTML = `
      <div class="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
        <h3 class="text-lg font-bold text-text mb-2">Delete Product?</h3>
        <p class="text-sm text-gray-500 mb-6">This cannot be undone.</p>
        <div class="flex justify-end gap-3">
          <button id="cancel-del" class="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
          <button id="confirm-del" class="px-4 py-2 text-sm text-white bg-danger rounded-lg">Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    div.querySelector('#cancel-del').onclick = () => div.remove();
    div.querySelector('#confirm-del').onclick = () => {
      DataProvider.deleteProduct(id);
      row.style.transition = 'opacity 0.3s';
      row.style.opacity = '0';
      setTimeout(() => row.remove(), 300);
      window.showToast('Product deleted', 'success');
      div.remove();
    };
  };

  // Attach initial delete listeners
  document.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', handleDelete);
  });

  const closeAll = () => {
    overlay.classList.remove('opacity-100');
    overlay.classList.add('opacity-0', 'pointer-events-none');
    drawer.classList.add('translate-x-full');
  };

  const openForm = (id = null) => {
    const title = document.getElementById('drawer-title');
    const form = document.getElementById('product-form');
    form.reset();
    document.getElementById('p-id').value = '';
    
    if (id) {
      title.textContent = 'Edit Product';
      import('../services/dataProvider.js').then(({ DataProvider }) => {
        const p = DataProvider.getProductById(id);
        const categories = DataProvider.getCategories() || [];
        const catSelect = document.getElementById('p-category');
        catSelect.innerHTML = '<option value="">Select Category</option>' + 
          categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

        if (p) {
          document.getElementById('p-id').value = p.id;
          document.getElementById('p-name').value = p.name || '';
          document.getElementById('p-sku').value = p.sku || '';
          document.getElementById('p-barcode').value = p.barcode || '';
          document.getElementById('p-category').value = p.category || '';
          document.getElementById('p-subcategory').value = p.subCategory || '';
          document.getElementById('p-brand').value = p.brand || '';
          document.getElementById('p-unit').value = p.unit || 'Nos';
          
          document.getElementById('p-buying').value = p.buyingPrice || p.avgCost || 0;
          document.getElementById('p-avg-cost').value = p.avgCost || p.buyingPrice || 0;
          document.getElementById('p-latest-cost').value = p.latestCost || p.buyingPrice || 0;
          document.getElementById('p-price').value = p.price || 0;
          document.getElementById('p-mrp').value = p.mrp || '';
          document.getElementById('p-hsn').value = p.hsn || '';
          document.getElementById('p-gst').value = p.gst || 18;
          
          document.getElementById('p-stock').value = p.stock || 0;
          document.getElementById('p-reserved').value = p.reservedStock || 0;
          document.getElementById('p-minstock').value = p.minStock || 5;
          document.getElementById('p-maxstock').value = p.maxStock || 100;
          document.getElementById('p-rack').value = p.rack || '';
          document.getElementById('p-shelf').value = p.shelf || '';
          document.getElementById('p-supplier').value = p.supplier || '';
          
          document.getElementById('p-warranty').value = p.warranty || '';
          document.getElementById('p-image').value = p.image || '';
          document.getElementById('p-desc').value = p.description || '';
        }
      });
    } else {
      title.textContent = 'New Product';
      import('../services/dataProvider.js').then(({ DataProvider }) => {
        const categories = DataProvider.getCategories() || [];
        const catSelect = document.getElementById('p-category');
        catSelect.innerHTML = '<option value="">Select Category</option>' + 
          categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
      });
    }
    
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    drawer.classList.remove('translate-x-full');
  };

  const addBtn = document.getElementById('btn-add-product');
  if (addBtn) addBtn.addEventListener('click', () => openForm());
  
  window.addEventListener('openProductDrawer', (e) => openForm(e.detail));
  
  // Legacy deleteProduct event - now handled via delete-product-btn click directly


  const closeBtns = document.querySelectorAll('.close-product-drawer');
  closeBtns.forEach(b => b.addEventListener('click', closeAll));
  overlay.addEventListener('click', closeAll);

  const saveBtn = document.getElementById('save-p-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const form = document.getElementById('product-form');
      if (!form.reportValidity()) return;
      
      const product = {
        id: document.getElementById('p-id').value || null,
        name: document.getElementById('p-name').value,
        sku: document.getElementById('p-sku').value,
        barcode: document.getElementById('p-barcode').value,
        category: document.getElementById('p-category').value,
        subCategory: document.getElementById('p-subcategory').value,
        brand: document.getElementById('p-brand').value,
        unit: document.getElementById('p-unit').value,
        buyingPrice: Number(document.getElementById('p-buying').value || 0),
        avgCost: Number(document.getElementById('p-avg-cost').value || 0),
        latestCost: Number(document.getElementById('p-latest-cost').value || 0),
        price: Number(document.getElementById('p-price').value || 0),
        mrp: Number(document.getElementById('p-mrp').value || 0),
        hsn: document.getElementById('p-hsn').value,
        gst: Number(document.getElementById('p-gst').value || 18),
        stock: Number(document.getElementById('p-stock').value || 0),
        reservedStock: Number(document.getElementById('p-reserved').value || 0),
        minStock: Number(document.getElementById('p-minstock').value || 0),
        maxStock: Number(document.getElementById('p-maxstock').value || 0),
        rack: document.getElementById('p-rack').value,
        shelf: document.getElementById('p-shelf').value,
        supplier: document.getElementById('p-supplier').value,
        warranty: document.getElementById('p-warranty').value,
        image: document.getElementById('p-image').value,
        description: document.getElementById('p-desc').value,
        isActive: true
      };
      
      import('../services/dataProvider.js').then(({ DataProvider }) => {
        try {
          DataProvider.saveProduct(product);
          closeAll();
          // In-place reload of tbody
          const fresh = DataProvider.getProducts();
          const tbody2 = document.getElementById('products-tbody');
          if (tbody2) {
            tbody2.innerHTML = fresh.length > 0 ? fresh.map(renderRow).join('') : '<tr><td colspan="12"><div class="empty-state"><i data-lucide="package"></i><p>No products found.</p></div></td></tr>';
            if (window.lucide) window.lucide.createIcons({ nodes: [tbody2] });
            tbody2.querySelectorAll('.delete-product-btn').forEach(btn => btn.addEventListener('click', handleDelete));
          }
          window.showToast('Product saved successfully!', 'success');
        } catch (err) {
          window.showToast(err.message, 'danger');
        }
      });
    });
  }

  // EXCEL IMPORT LOGIC
  const importModal = document.getElementById('import-modal');
  const importContent = document.getElementById('import-modal-content');
  const btnImportExcel = document.getElementById('btn-import-excel');
  const closeImport = document.getElementById('close-import');
  const fileInput = document.getElementById('excel-file');
  const processBtn = document.getElementById('btn-process-import');
  const fileNameLabel = document.getElementById('file-name-label');
  
  if (btnImportExcel) {
    btnImportExcel.addEventListener('click', () => {
      importModal.classList.remove('hidden');
      setTimeout(() => {
        importModal.classList.remove('opacity-0');
        importContent.classList.remove('scale-95');
      }, 10);
    });
  }
  
  const hideImport = () => {
    importModal.classList.add('opacity-0');
    importContent.classList.add('scale-95');
    setTimeout(() => importModal.classList.add('hidden'), 300);
  };
  
  if (closeImport) closeImport.addEventListener('click', hideImport);
  
  let workbookData = null;
  
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      fileNameLabel.textContent = file.name;
      
      const reader = new FileReader();
      reader.onload = function(e) {
        if (!window.XLSX) {
          alert('SheetJS (XLSX) library not loaded. Ensure internet connection.');
          return;
        }
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.SheetNames[0];
        workbookData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
        processBtn.disabled = false;
      };
      reader.readAsArrayBuffer(file);
    });
  }
  
  if (processBtn) {
    processBtn.addEventListener('click', () => {
      if (!workbookData || !workbookData.length) return;
      import('../services/dataProvider.js').then(({ DataProvider }) => {
          let imported = 0, updated = 0;
          const products = DataProvider.getProducts();
          
          workbookData.forEach(row => {
            const sku = row.SKU || row.sku;
            const name = row.Name || row.name;
            if (!name) return;
            
            let existing = null;
            if (sku) existing = products.find(p => p.sku === sku);
            if (!existing) existing = products.find(p => p.name.toLowerCase() === name.toLowerCase());
            
            const newProduct = {
              ...(existing || {}),
              id: existing ? existing.id : null,
              name: name,
              sku: sku || (existing ? existing.sku : ''),
              barcode: row.Barcode || row.barcode || (existing ? existing.barcode : ''),
              category: row.Category || row.category || (existing ? existing.category : ''),
              brand: row.Brand || row.brand || (existing ? existing.brand : ''),
              unit: row.Unit || row.unit || (existing ? existing.unit : 'Nos'),
              buyingPrice: Number(row.BuyingPrice || row.buyingPrice || row.Cost || (existing ? existing.buyingPrice : 0)),
              purchasePrice: Number(row.BuyingPrice || row.buyingPrice || row.Cost || (existing ? existing.purchasePrice : 0)),
              price: Number(row.SellingPrice || row.sellingPrice || row.Price || (existing ? existing.price : 0)),
              mrp: Number(row.MRP || row.mrp || (existing ? existing.mrp : 0)),
              gst: Number(row.GST || row.gst || (existing ? existing.gst : 18)),
              stock: Number(row.Stock || row.stock || row.Qty || (existing ? existing.stock : 0)),
              isActive: true
            };
            
            if (newProduct.category) {
              const cats = DataProvider.getCategories() || [];
              if (!cats.find(c => c.name.toLowerCase() === newProduct.category.toLowerCase())) {
                DataProvider.saveCategory({ name: newProduct.category, isActive: true });
              }
            }

            DataProvider.saveProduct(newProduct);
            if (existing) updated++; else imported++;
          });
          
          window.showToast(`Import Complete! Added: ${imported}, Updated: ${updated}`, 'success');
          hideImport();
          // Refresh table in-place
          const fresh = DataProvider.getProducts();
          const tbody2 = document.getElementById('products-tbody');
          if (tbody2) {
            tbody2.innerHTML = fresh.length > 0 ? fresh.map(renderRow).join('') : '<tr><td colspan="12"><div class="empty-state"><i data-lucide="package"></i><p>No products found.</p></div></td></tr>';
            if (window.lucide) window.lucide.createIcons({ nodes: [tbody2] });
            tbody2.querySelectorAll('.delete-product-btn').forEach(btn => btn.addEventListener('click', handleDelete));
          }
        });
    });
  }

  return function cleanup() {
    window.removeEventListener('openProductDrawer', openForm);
  };
}
