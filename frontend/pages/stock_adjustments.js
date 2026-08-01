import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Stock Adjustments
 */
import { DataProvider } from '../services/dataProvider.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export async function render() {
  const adjustments = DataProvider.getStockAdjustments() || [];

  const renderRow = (adj) => {
    const isAdd = ['Found', 'Manual Add'].includes(adj.type);
    const isNeutral = adj.type === 'Manual Correction';
    const typeColor = isAdd ? 'text-success bg-success/10' : (isNeutral ? 'text-blue-500 bg-blue-50' : 'text-danger bg-danger/10');
    const typeIcon = isAdd ? 'trending-up' : (isNeutral ? 'edit' : 'trending-down');
    const date = new Date(adj.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return `
    <tr class="row-hover">
      <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(adj.id)}</td>
      <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(date)}</td>
      <td class="px-4 py-3.5 font-medium text-text">${escapeHtml(adj.productName)}</td>
      <td class="px-4 py-3.5">
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${typeColor} uppercase tracking-wider">
          <i data-lucide="${typeIcon}" class="w-3 h-3"></i> ${escapeHtml(adj.type)}
        </span>
      </td>
      <td class="px-4 py-3.5 text-right font-bold ${isAdd ? 'text-success' : (isNeutral ? 'text-blue-500' : 'text-danger')}">${isAdd ? '+' : (isNeutral ? '' : '-')}${escapeHtml(adj.qty)}</td>
      <td class="px-4 py-3.5 text-gray-600 text-sm truncate max-w-xs" title="${escapeHtml(adj.reason)}">${escapeHtml(adj.reason)}</td>
      <td class="px-4 py-3.5 text-gray-500 text-xs text-right">${escapeHtml(adj.user || 'Admin')}</td>
    </tr>
    `;
  };

  return `
    <div class="p-6 max-w-[1200px] mx-auto fade-in pb-20">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-text">Stock Adjustments</h1>
          <p class="text-sm text-gray-400 mt-1">Log manual stock corrections, damages, and audits.</p>
        </div>
        <div class="flex items-center gap-2">
          <button data-open-adj class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
            <i data-lucide="plus" class="w-4 h-4"></i>
            New Adjustment
          </button>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-border p-4 mb-4 flex flex-wrap gap-3 items-center shadow-sm">
        <div class="relative flex-1 min-w-[200px]">
          <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="adj-search" placeholder="Search by product, reason, or ID..." class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
        </div>
        <span id="adj-count-label" class="text-xs text-gray-400">Showing ${adjustments.length} logs</span>
      </div>

      <div class="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border bg-gray-50/50">
              <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Log ID</th>
              <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Date</th>
              <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Product Name</th>
              <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Type</th>
              <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Qty Adjusted</th>
              <th class="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">Reason</th>
              <th class="text-right text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">User</th>
            </tr>
          </thead>
          <tbody id="adj-table-body" class="divide-y divide-border">
            ${adjustments.length > 0 ? adjustments.map(renderRow).join('') : '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400 text-sm">No adjustments found.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Adjustment Drawer -->
    <div id="adj-drawer-overlay" class="fixed inset-0 bg-black/40 z-[60] opacity-0 pointer-events-none transition-opacity duration-300"></div>
    <div id="adj-drawer" class="fixed right-0 top-0 h-full w-[450px] bg-white shadow-2xl z-[70] transform translate-x-full transition-transform duration-300 flex flex-col">
      <div class="px-6 py-4 border-b border-border flex justify-between items-center bg-gray-50/50">
        <h3 class="text-lg font-bold text-text flex items-center gap-2">
          <i data-lucide="sliders" class="w-5 h-5 text-primary"></i> New Stock Adjustment
        </h3>
        <button class="close-adj-drawer text-gray-400 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors">
          <i data-lucide="x" class="w-5 h-5 pointer-events-none"></i>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6 space-y-5">
        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Product <span class="text-danger">*</span></label>
          <select id="adj-product" class="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"></select>
          <p id="adj-current-stock" class="text-[10px] text-gray-500 mt-1 ml-1"></p>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Adjustment Type <span class="text-danger">*</span></label>
            <select id="adj-type" class="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
              <option value="Damaged">Damaged (Remove)</option>
              <option value="Broken">Broken (Remove)</option>
              <option value="Lost">Lost (Remove)</option>
              <option value="Expired">Expired (Remove)</option>
              <option value="Found">Found (Add)</option>
              <option value="Manual Add">Manual Add</option>
              <option value="Manual Correction">Manual Correction (Set Exact)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Quantity <span class="text-danger">*</span></label>
            <input type="number" id="adj-qty" min="1" value="1" class="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Reason / Remarks <span class="text-danger">*</span></label>
          <textarea id="adj-reason" rows="3" class="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g., Damaged during transit, Audit mismatch"></textarea>
        </div>
      </div>

      <div class="p-4 border-t border-border bg-gray-50/50 flex gap-3">
        <button class="close-adj-drawer flex-1 px-4 py-2 bg-white border border-border text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">Cancel</button>
        <button id="btn-save-adj" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2">
          <i data-lucide="check" class="w-4 h-4"></i> Apply Adjustment
        </button>
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();
  
  let allAdjustments = DataProvider.getStockAdjustments() || [];
  const allProducts = DataProvider.getProducts().filter(p => p.isActive) || [];

  const tbody = rootElement.querySelector('#adj-table-body');
  const searchInput = rootElement.querySelector('#adj-search');
  const countLabel = rootElement.querySelector('#adj-count-label');

  const renderTable = (data) => {
    countLabel.textContent = `Showing ${data.length} logs`;
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-400 text-sm">No adjustments found.</td></tr>';
    } else {
      tbody.innerHTML = data.map(adj => {
        const isAdd = ['Found', 'Manual Add'].includes(adj.type);
        const isNeutral = adj.type === 'Manual Correction';
        const typeColor = isAdd ? 'text-success bg-success/10' : (isNeutral ? 'text-blue-500 bg-blue-50' : 'text-danger bg-danger/10');
        const typeIcon = isAdd ? 'trending-up' : (isNeutral ? 'edit' : 'trending-down');
        const date = new Date(adj.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        return `
        <tr class="row-hover">
          <td class="px-4 py-3.5 font-semibold text-primary text-sm">${escapeHtml(adj.id)}</td>
          <td class="px-4 py-3.5 text-sm text-gray-500">${escapeHtml(date)}</td>
          <td class="px-4 py-3.5 font-medium text-text">${escapeHtml(adj.productName)}</td>
          <td class="px-4 py-3.5">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${typeColor} uppercase tracking-wider">
              <i data-lucide="${typeIcon}" class="w-3 h-3"></i> ${escapeHtml(adj.type)}
            </span>
          </td>
          <td class="px-4 py-3.5 text-right font-bold ${isAdd ? 'text-success' : (isNeutral ? 'text-blue-500' : 'text-danger')}">${isAdd ? '+' : (isNeutral ? '' : '-')}${escapeHtml(adj.qty)}</td>
          <td class="px-4 py-3.5 text-gray-600 text-sm truncate max-w-xs" title="${escapeHtml(adj.reason)}">${escapeHtml(adj.reason)}</td>
          <td class="px-4 py-3.5 text-gray-500 text-xs text-right">${escapeHtml(adj.user || 'Admin')}</td>
        </tr>
        `;
      }).join('');
    }
    if (window.lucide) window.lucide.createIcons();
  };

  const handleSearch = (e) => {
    const q = e.target.value.toLowerCase().trim();
    const filtered = allAdjustments.filter(a => 
      a.productName.toLowerCase().includes(q) || 
      a.reason.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q)
    );
    renderTable(filtered);
  };
  searchInput.addEventListener('input', handleSearch);

  // Drawer Logic
  const overlay = rootElement.querySelector('#adj-drawer-overlay');
  const drawer = rootElement.querySelector('#adj-drawer');
  const productSelect = rootElement.querySelector('#adj-product');
  const currentStockLabel = rootElement.querySelector('#adj-current-stock');
  
  const closeDrawer = () => {
    overlay.classList.add('opacity-0', 'pointer-events-none');
    overlay.classList.remove('opacity-100');
    drawer.classList.add('translate-x-full');
  };

  const closeBtns = rootElement.querySelectorAll('.close-adj-drawer');
  closeBtns.forEach(btn => btn.addEventListener('click', closeDrawer));
  overlay.addEventListener('click', closeDrawer);

  const openDrawer = () => {
    // Populate products
    productSelect.innerHTML = '<option value="">Select a Product</option>' + 
      allProducts.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} (${escapeHtml(p.sku || p.barcode || p.id)})</option>`).join('');
    
    rootElement.querySelector('#adj-qty').value = '1';
    rootElement.querySelector('#adj-reason').value = '';
    rootElement.querySelector('#adj-type').value = 'Damaged';
    currentStockLabel.textContent = '';
    
    overlay.classList.remove('opacity-0', 'pointer-events-none');
    overlay.classList.add('opacity-100');
    drawer.classList.remove('translate-x-full');
  };

  rootElement.querySelector('[data-open-adj]')?.addEventListener('click', openDrawer);

  const handleProductChange = (e) => {
    const p = allProducts.find(prod => prod.id === e.target.value);
    if (p) {
      currentStockLabel.textContent = `Current Stock: ${p.stock} ${p.unit || 'Nos'}`;
      // If we are removing, make sure max is stock
      const type = rootElement.querySelector('#adj-type').value;
      if (['Damaged', 'Broken', 'Lost', 'Expired'].includes(type)) {
        rootElement.querySelector('#adj-qty').max = p.stock;
      } else {
        rootElement.querySelector('#adj-qty').removeAttribute('max');
      }
    } else {
      currentStockLabel.textContent = '';
    }
  };
  productSelect.addEventListener('change', handleProductChange);

  window.addEventListener('openAdjDrawer', openDrawer);

  const handleSave = () => {
    const productId = productSelect.value;
    const type = rootElement.querySelector('#adj-type').value;
    const qty = Number(rootElement.querySelector('#adj-qty').value);
    const reason = rootElement.querySelector('#adj-reason').value.trim();

    if (!productId) { NotificationService.warning('Please select a product'); return; }
    if (!qty || qty <= 0) { NotificationService.warning('Quantity must be greater than 0'); return; }
    if (!reason) { NotificationService.warning('Please provide a reason'); return; }

    const product = allProducts.find(p => p.id === productId);
    if (['Damaged', 'Broken', 'Lost', 'Expired'].includes(type) && qty > product.stock) {
      NotificationService.error(`Cannot remove ${qty}. Current stock is only ${product.stock}.`);
      return;
    }

    try {
      DataProvider.saveStockAdjustment({
        productId,
        productName: product.name,
        type,
        qty,
        reason,
        date: new Date().toISOString(),
        user: 'Senthil Admin' // Placeholder
      });
      
      NotificationService.success('Stock adjusted successfully!');
      closeDrawer();
      allAdjustments = DataProvider.getStockAdjustments() || [];
      renderTable(allAdjustments);
      searchInput.value = '';
    } catch (err) {
      NotificationService.error(err.message);
    }
  };
  rootElement.querySelector('#btn-save-adj').addEventListener('click', handleSave);

  return function cleanup() {
    window.removeEventListener('openAdjDrawer', openDrawer);
    searchInput.removeEventListener('input', handleSearch);
    closeBtns.forEach(btn => btn.removeEventListener('click', closeDrawer));
    overlay.removeEventListener('click', closeDrawer);
    rootElement.querySelector('[data-open-adj]')?.removeEventListener('click', openDrawer);
    productSelect.removeEventListener('change', handleProductChange);
    rootElement.querySelector('#btn-save-adj').removeEventListener('click', handleSave);
  };
}
