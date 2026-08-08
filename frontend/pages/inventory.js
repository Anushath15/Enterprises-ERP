import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Inventory Management
 */
import { KPICard } from '../components/ui/cards.js';
import { 
  Container, Section, PageHeader, Toolbar, 
  KPIGrid, TableWrapper, EmptyState, Inline 
} from '../components/ui/designSystem.js';
import { DataProvider } from '../services/dataProvider.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export async function render() {
  const products = DataProvider.getProducts().filter(p => p.isActive !== false);
  
  const renderRow = (p) => {
    const stockColor = p.statusBadge === 'danger' ? 'danger' : p.statusBadge === 'warning' ? 'warning' : 'text';
    
    return `
    <tr class="row-hover">
      <td class="px-4 py-3 font-medium text-text">${escapeHtml(p.id)}</td>
      <td class="px-4 py-3 font-medium text-text">${escapeHtml(p.name)}</td>
      <td class="px-4 py-3 text-gray-500">${escapeHtml(p.category || '-')}</td>
      <td class="px-4 py-3 text-right text-text font-bold text-${stockColor}">${p.stock} <span class="text-xs text-gray-400 font-normal">${escapeHtml(p.unit || 'Nos')}</span></td>
      <td class="px-4 py-3 text-right text-gray-500 font-mono">${escapeHtml(p.rack || '-')} / ${escapeHtml(p.shelf || '-')}</td>
      <td class="px-4 py-3 text-right text-text">₹${(p.avgCost || p.buyingPrice || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3 text-right text-text">₹${(p.price || 0).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3 text-right font-bold text-primary">₹${((p.stock || 0) * (p.avgCost || p.buyingPrice || p.price || 0)).toLocaleString('en-IN')}</td>
      <td class="px-4 py-3 text-center flex items-center justify-center gap-1">
        <button class="purchase-stock-btn action-icon p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors" data-id="${escapeHtml(p.id)}" title="Purchase Stock">
          <i data-lucide="shopping-cart" class="w-4 h-4 pointer-events-none"></i>
        </button>
        <button class="print-barcode-btn action-icon p-1.5 rounded-lg text-gray-400 hover:text-primary transition-colors" data-id="${escapeHtml(p.id)}" title="Print Barcode">
          <i data-lucide="printer" class="w-4 h-4 pointer-events-none"></i>
        </button>
      </td>
    </tr>
    `;
  };

  window._inventoryRenderRow = renderRow;

  return Container({
    children: `
      ${Section({
        children: PageHeader({
          title: 'Inventory Dashboard',
          subtitle: 'Real-time stock levels, valuations, and low stock alerts.',
          actionsHtml: `
            <button id="btn-export-excel" class="flex items-center gap-1.5 px-3.5 py-2 border border-border text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-success"></i> Export Excel
            </button>
            <a href="#/stock-adjustments" class="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
              <i data-lucide="sliders" class="w-4 h-4"></i> Adjust Stock
            </a>
          `
        })
      })}

      ${Section({
        children: KPIGrid({
          children: `
            ${KPICard({ title: 'Total Active Products', value: products.length.toString(), iconSvg: '<i data-lucide="package"></i>', color: 'primary' })}
            ${KPICard({ title: 'Low Stock Alerts', value: products.filter(p => p.stock > 0 && p.stock <= p.minStock).length.toString(), iconSvg: '<i data-lucide="alert-triangle"></i>', color: 'warning' })}
            ${KPICard({ title: 'Out of Stock', value: products.filter(p => p.stock <= 0).length.toString(), iconSvg: '<i data-lucide="x-circle"></i>', color: 'danger' })}
            <div class="bg-white rounded-[var(--radius-md)] border border-border p-[var(--spacing-md)] shadow-sm h-full flex flex-col justify-center">
               <p class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Total Stock Value</p>
               <p class="text-2xl font-bold text-text mt-1">₹${products.reduce((sum, p) => sum + (p.stock * (p.avgCost || p.buyingPrice || p.price || 0)), 0).toLocaleString('en-IN')}</p>
            </div>
          `
        })
      })}

      ${Section({
        children: Toolbar({
          children: `
            <div class="relative flex-1 min-w-[200px] max-w-md">
              <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input type="text" id="inv-search" placeholder="Search by name, SKU, barcode..." 
                class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
            </div>
            ${Inline({
              children: `
                <select id="inv-category-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
                  <option value="">All Categories</option>
                  ${[...new Set(products.map(p => p.category).filter(Boolean))].sort().map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('')}
                </select>
                <select id="inv-stock-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
                  <option value="">All Stock Status</option>
                  <option value="in">In Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="out">Out of Stock</option>
                </select>
              `
            })}
            <span id="inv-count-label" class="text-xs text-gray-400 ml-auto">Showing ${products.length} products</span>
          `
        })
      })}

      ${Section({
        children: TableWrapper({
          headers: ['ID', 'Product Name', 'Category', 'Current Stock', 'Location (Rack/Shelf)', 'Avg Cost', 'Selling Price', 'Total Value', 'Actions'],
          tbodyId: 'inv-tbody',
          rowsHtml: products.length ? products.slice(0, 50).map(renderRow).join('') : `<tr><td colspan="9">${EmptyState({icon: 'package', title: 'No products found', subtitle: 'Try adjusting your filters'})}</td></tr>`
        })
      })}
    `
  });
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();
  
  const __listeners = [];
  const addListener = (el, evt, handler) => {
    if (!el) return;
    el.addEventListener(evt, handler);
    __listeners.push({el, evt, handler});
  };
  
  const allProducts = DataProvider.getProducts().filter(p => p.isActive !== false);
  const searchInput = rootElement.querySelector('#inv-search');
  const categoryFilter = rootElement.querySelector('#inv-category-filter');
  const stockFilter = rootElement.querySelector('#inv-stock-filter');
  const tbody = rootElement.querySelector('#inv-tbody');
  const countLabel = rootElement.querySelector('#inv-count-label');

  const renderRow = window._inventoryRenderRow;

  if (searchInput && tbody) {
    let renderQueue = [];
    let isRendering = false;

    const processRenderQueue = () => {
      if (renderQueue.length === 0) {
        isRendering = false;
        if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
        return;
      }
      const chunk = renderQueue.splice(0, 50);
      tbody.insertAdjacentHTML('beforeend', chunk.map(renderRow).join(''));
      requestAnimationFrame(processRenderQueue);
    };

    const applyFilter = () => {
      const q = searchInput.value.toLowerCase().trim();
      const cat = categoryFilter?.value || '';
      const stock = stockFilter?.value || '';

      const filtered = allProducts.filter(p => {
        if (q && !p.name.toLowerCase().includes(q) && !(p.sku || '').toLowerCase().includes(q) && !(p.barcode || '').includes(q) && !(p.category || '').toLowerCase().includes(q)) return false;
        if (cat && p.category !== cat) return false;
        if (stock === 'in' && !(p.stock > p.minStock)) return false;
        if (stock === 'low' && !(p.stock > 0 && p.stock <= p.minStock)) return false;
        if (stock === 'out' && p.stock > 0) return false;
        return true;
      });

      if (countLabel) countLabel.textContent = `Showing ${filtered.length} products`;
      
      tbody.innerHTML = ''; // clear existing
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9">${EmptyState({icon: 'package', title: 'No products match your filters', subtitle: 'Try adjusting your search query'})}</td></tr>`;
        renderQueue = [];
        isRendering = false;
      } else {
        renderQueue = [...filtered];
        if (!isRendering) {
          isRendering = true;
          processRenderQueue();
        }
      }
    };

    addListener(searchInput, 'input', applyFilter);
    if (categoryFilter) addListener(categoryFilter, 'change', applyFilter);
    if (stockFilter) addListener(stockFilter, 'change', applyFilter);
  }

  // Actions
  if (tbody) addListener(tbody, 'click', (e) => {
    const purchaseBtn = e.target.closest('.purchase-stock-btn');
    if (purchaseBtn) {
      const id = purchaseBtn.getAttribute('data-id');
      localStorage.setItem('erp_pending_purchase_product', id);
      window.location.hash = '#/purchases';
    }

    const printBtn = e.target.closest('.print-barcode-btn');
    if (printBtn) {
      const id = printBtn.getAttribute('data-id');
      const p = allProducts.find(prod => prod.id === id);
      if (!p) return;
      const barcodeStr = p.barcode || p.sku || p.id;
      
      if (window.JsBarcode) {
        window.JsBarcode("#barcode", barcodeStr, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: false
        });
        document.getElementById('barcode-text').textContent = p.name + " - " + barcodeStr + " - MRP " + (p.mrp || p.price);
        window.print();
      } else {
        NotificationService.warning('Barcode library not loaded yet.');
      }
    }
  });

  const btnExportExcel = rootElement.querySelector('#btn-export-excel');
  if (btnExportExcel) {
    addListener(btnExportExcel, 'click', () => {
      if (!window.XLSX) {
        NotificationService.warning('SheetJS (XLSX) library not loaded.');
        return;
      }
      
      const exportData = allProducts.map(p => ({
        ID: p.id,
        Name: p.name,
        Category: p.category,
        Stock: p.stock,
        Unit: p.unit || 'Nos',
        MinStock: p.minStock,
        Rack: p.rack || '',
        Shelf: p.shelf || '',
        AvgCost: p.avgCost || p.buyingPrice || 0,
        SellingPrice: p.price || 0,
        TotalValue: (p.stock || 0) * (p.avgCost || p.buyingPrice || p.price || 0)
      }));

      const ws = window.XLSX.utils.json_to_sheet(exportData);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Inventory");
      window.XLSX.writeFile(wb, `Inventory_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }

  return function cleanup() {
    __listeners.forEach(l => {
      if (l.el) l.el.removeEventListener(l.evt, l.handler);
    });
    __listeners.length = 0;
  };
}
