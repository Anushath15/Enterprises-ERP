import { NotificationService } from '../services/notificationService.js';
/**
 * Senthil Enterprises ERP - Products Page Controller (CRUD ONLY)
 */
import { 
  Container, Section, PageHeader, Toolbar, 
  TableWrapper, ModalShell, FormGrid, EmptyState, Inline, Stack
} from '../components/ui/designSystem.js';
import { DataProvider } from '../services/dataProvider.js';
import { DraftManager } from '../services/draftManager.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { validateForm, rules } from '../utils/validate.js';

const badgeClasses = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger'
};

const renderRow = window._productsRenderRow = (p) => {
  const isInactive = !p.isActive;
  const statusBg = isInactive ? 'bg-gray-100 text-gray-500' : (badgeClasses[p.statusBadge] || 'bg-gray-100 text-gray-500');
  const stockColor = p.statusBadge === 'danger' ? 'danger' : p.statusBadge === 'warning' ? 'warning' : 'text';
  const statusLabel = isInactive ? 'Inactive' : p.status;
  const escId = escapeHtml(p.id);
  
  return `
  <tr class="row-hover cursor-pointer" data-product-row="${escId}">
    <td class="px-4 py-3 font-medium text-text">${escapeHtml(p.id)}</td>
    <td class="px-4 py-3 text-gray-500 font-mono text-xs">${escapeHtml(p.sku || '-')}</td>
    <td class="px-4 py-3 font-medium text-text">${escapeHtml(p.name)}</td>
    <td class="px-4 py-3 text-gray-500">${escapeHtml(p.category || '-')}</td>
    <td class="px-4 py-3 text-gray-500">${escapeHtml(p.brand || '-')}</td>
    <td class="px-4 py-3 text-right text-text font-medium text-${stockColor}">${escapeHtml(p.stock)} <span class="text-xs text-gray-400 font-normal">${escapeHtml(p.unit || 'Nos')}</span></td>
    <td class="px-4 py-3 text-right text-text">₹${escapeHtml((p.avgCost || p.buyingPrice || 0).toLocaleString('en-IN'))}</td>
    <td class="px-4 py-3 text-right font-medium text-primary">₹${escapeHtml((p.price || 0).toLocaleString('en-IN'))}</td>
    <td class="px-4 py-3 text-right text-gray-500">${escapeHtml(p.gst || 0)}%</td>
    <td class="px-4 py-3 text-center"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBg}">${escapeHtml(statusLabel)}</span></td>
    <td class="px-4 py-3 text-center flex items-center justify-center gap-1">
      <button class="print-barcode-btn action-icon p-1.5 rounded-lg text-gray-400 hover:text-primary transition-colors" data-id="${escId}" title="Print Barcode">
        <i data-lucide="printer" class="w-4 h-4 pointer-events-none"></i>
      </button>
      <button class="delete-product-btn action-icon p-1.5 rounded-lg text-gray-400 hover:text-danger transition-colors" data-id="${escId}" title="Delete Product">
        <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
      </button>
    </td>
  </tr>
  `;
};

export async function render() {
  const products = DataProvider.getProducts();
  
  const productFormHtml = `
    <form id="product-form">
      <input type="hidden" id="p-id">
      
      ${Stack({ spacing: 'lg', children: `
        <div class="bg-white p-[var(--spacing-md)] rounded-[var(--radius-md)] border border-border shadow-sm">
          <h4 class="text-sm font-semibold text-primary mb-3">Basic Details</h4>
          ${FormGrid({ children: `
            <div><label class="block text-xs font-medium text-gray-500 mb-1">Product Name *</label><input type="text" id="p-name" required class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
            <div><label class="block text-xs font-medium text-gray-500 mb-1">SKU</label><input type="text" id="p-sku" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm uppercase"></div>
            <div><label class="block text-xs font-medium text-gray-500 mb-1">Barcode</label><input type="text" id="p-barcode" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select id="p-category" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm bg-white"></select>
            </div>
            <div><label class="block text-xs font-medium text-gray-500 mb-1">Subcategory</label><input type="text" id="p-subcategory" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
            <div><label class="block text-xs font-medium text-gray-500 mb-1">Brand</label><input type="text" id="p-brand" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
            <div><label class="block text-xs font-medium text-gray-500 mb-1">Unit (e.g. Nos, Kg, Mtr)</label><input type="text" id="p-unit" value="Nos" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
          `})}
        </div>

        <div class="bg-white p-[var(--spacing-md)] rounded-[var(--radius-md)] border border-border shadow-sm">
          <h4 class="text-sm font-semibold text-primary mb-3">Pricing & Taxation</h4>
          ${FormGrid({ children: `
            <div><label class="block text-xs font-medium text-gray-500 mb-1">Buying Price</label><input type="number" step="0.01" id="p-buying" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
            <div><label class="block text-xs font-medium text-gray-500 mb-1">Selling Price *</label><input type="number" step="0.01" id="p-price" required class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm focus:ring-2 focus:ring-primary/20"></div>
            <div><label class="block text-xs font-medium text-gray-500 mb-1">MRP</label><input type="number" step="0.01" id="p-mrp" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
            <div><label class="block text-xs font-medium text-gray-500 mb-1">HSN Code</label><input type="text" id="p-hsn" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
            <div><label class="block text-xs font-medium text-gray-500 mb-1">GST %</label><input type="number" id="p-gst" value="18" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
          `})}
        </div>
        
        <div class="bg-white p-[var(--spacing-md)] rounded-[var(--radius-md)] border border-border shadow-sm">
          <h4 class="text-sm font-semibold text-primary mb-3">Inventory Setup</h4>
          ${FormGrid({ children: `
            <div><label class="block text-xs font-medium text-gray-500 mb-1">Current Stock *</label><input type="number" id="p-stock" required class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
            <div><label class="block text-xs font-medium text-gray-500 mb-1">Min Stock</label><input type="number" id="p-minstock" value="5" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
            <div><label class="block text-xs font-medium text-gray-500 mb-1">Rack / Bin</label><input type="text" id="p-rack" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
            <div><label class="block text-xs font-medium text-gray-500 mb-1">Shelf</label><input type="text" id="p-shelf" class="w-full px-3 py-2 border rounded-[var(--radius-md)] text-sm"></div>
          `})}
        </div>
      `})}
    </form>
  `;

  return Container({
    children: `
      ${Section({
        children: PageHeader({
          title: 'Products',
          subtitle: 'Product Master Catalog (CRUD)',
          actionsHtml: `
            <button id="btn-import-excel" class="flex items-center gap-1.5 px-3.5 py-2 border border-border text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-success"></i> Import Excel
            </button>
            <button id="btn-add-product" class="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
              <i data-lucide="plus" class="w-4 h-4"></i> Add Product
            </button>
          `
        })
      })}

      ${Section({
        children: Toolbar({
          children: `
            <div class="relative flex-1 min-w-[200px] max-w-md">
              <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input type="text" id="product-search" placeholder="Search by name, SKU, barcode, category..." 
                class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
            </div>
            ${Inline({
              children: `
                <select id="product-category-filter" class="px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors">
                  <option value="">All Categories</option>
                  ${[...new Set(products.map(p => p.category).filter(Boolean))].sort().map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('')}
                </select>
              `
            })}
            <span id="product-count-label" class="text-xs text-gray-400 ml-auto">Showing ${products.length} products</span>
          `
        })
      })}

      ${Section({
        children: TableWrapper({
          headers: ['ID', 'SKU', 'Product Name', 'Category', 'Brand', 'Stock', 'Cost', 'Price', 'GST', 'Status', 'Actions'],
          tbodyId: 'products-tbody',
          rowsHtml: products.length ? products.slice(0, 50).map(renderRow).join('') : `<tr><td colspan="11">${EmptyState({icon: 'package', title: 'No products found', subtitle: 'Add a new product or adjust filters'})}</td></tr>`
        })
      })}

      ${ModalShell({
        id: 'product-modal',
        title: 'Product Details',
        bodyHtml: productFormHtml,
        footerHtml: `
          <button type="button" class="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" data-close-modal="product-modal">Cancel</button>
          <button id="save-p-btn" type="button" class="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center gap-2">
            <i data-lucide="save" class="w-4 h-4"></i> Save Product
          </button>
        `,
        widthClass: 'max-w-4xl'
      })}

      ${ModalShell({
        id: 'import-modal',
        title: 'Import Products',
        widthClass: 'max-w-md',
        bodyHtml: `
          <p class="text-sm text-gray-500 mb-4">Upload an Excel file (xlsx, xls, csv). The file must contain headers like: SKU, Name, Stock, BuyingPrice, SellingPrice, MRP, Category, Brand, GST.</p>
          <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors mb-4 relative">
            <input type="file" id="excel-file" accept=".xlsx, .xls, .csv" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
            <i data-lucide="upload-cloud" class="w-10 h-10 text-primary mx-auto mb-2"></i>
            <p class="text-sm font-medium text-gray-600" id="file-name-label">Click to select or drag and drop</p>
          </div>
        `,
        footerHtml: `
          <button type="button" class="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" data-close-modal="import-modal">Cancel</button>
          <button id="btn-process-import" type="button" class="px-4 py-2 bg-success text-white text-sm font-medium rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50" disabled>
            Process Import
          </button>
        `
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

  const allProducts = DataProvider.getProducts();
  const productModal = document.getElementById('product-modal');
  
  // Search & Filters
  const searchInput = document.getElementById('product-search');
  const categoryFilter = document.getElementById('product-category-filter');
  const tbody = document.getElementById('products-tbody');
  const countLabel = document.getElementById('product-count-label');
  const renderRow = window._productsRenderRow;

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

    let searchTimeout;
    const applyFilter = () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const q = searchInput.value.toLowerCase().trim();
        const cat = categoryFilter?.value || '';

        const filtered = allProducts.filter(p => {
          if (q) {
            const match = 
              p.name?.toLowerCase().includes(q) ||
              p.sku?.toLowerCase().includes(q) ||
              p.barcode?.toLowerCase().includes(q) ||
              p.category?.toLowerCase().includes(q) ||
              p.brand?.toLowerCase().includes(q) ||
              p.hsn?.toLowerCase().includes(q) ||
              p.dealer?.toLowerCase().includes(q);
            if (!match) return false;
          }
          if (cat && p.category !== cat) return false;
          return true;
        });

        if (countLabel) countLabel.textContent = `Showing ${filtered.length} products`;
        
        tbody.innerHTML = ''; // clear existing
        if (filtered.length === 0) {
          tbody.innerHTML = `<tr><td colspan="11">${EmptyState({icon: 'package', title: 'No products match your filters'})}</td></tr>`;
          renderQueue = [];
          isRendering = false;
        } else {
          renderQueue = [...filtered];
          if (!isRendering) {
            isRendering = true;
            processRenderQueue();
          }
        }
      }, 100);
    };

    addListener(searchInput, 'input', applyFilter);
    if (categoryFilter) addListener(categoryFilter, 'change', applyFilter);
  }

  const handleDelete = (btn) => {
    const id = btn.getAttribute('data-id');
    const row = btn.closest('tr');
    if (!row) return;

    if (confirm('Delete Product? This cannot be undone.')) {
      DataProvider.deleteProduct(id);
      row.style.transition = 'opacity 0.3s';
      row.style.opacity = '0';
      setTimeout(() => row.remove(), 300);
      NotificationService.success('Product deleted');
    }
  };

  const handlePrintBarcode = (btn) => {
    const id = btn.getAttribute('data-id');
    const p = allProducts.find(prod => prod.id === id);
    if (!p) return;
    const barcodeStr = p.barcode || p.sku || p.id;
    
    if (window.JsBarcode) {
      window.JsBarcode("#barcode", barcodeStr, {
        format: "CODE128", width: 2, height: 50, displayValue: false
      });
      document.getElementById('barcode-text').textContent = p.name + " - " + barcodeStr + " - MRP " + (p.mrp || p.price);
      window.print();
    } else {
      NotificationService.warning('Barcode library not loaded yet.');
    }
  };

  const handleRowClick = (e) => {
    const deleteBtn = e.target.closest('.delete-product-btn');
    if (deleteBtn) {
      handleDelete(deleteBtn);
      return;
    }
    const printBtn = e.target.closest('.print-barcode-btn');
    if (printBtn) {
      handlePrintBarcode(printBtn);
      return;
    }
    const row = e.target.closest('[data-product-row]');
    if (row) {
      const id = row.getAttribute('data-product-row');
      if (id) handleOpenProductModal({ detail: id });
    }
  };

  if (tbody) addListener(tbody, 'click', handleRowClick);

  const openForm = (id = null) => {
    const form = document.getElementById('product-form');
    const title = productModal.querySelector('.responsive-modal-header h3');
    form.reset();
    document.getElementById('p-id').value = '';
    
      const categories = DataProvider.getCategories() || [];
      const catSelect = document.getElementById('p-category');
      catSelect.innerHTML = '<option value="">Select Category</option>' + categories.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');

      if (id) {
        title.textContent = 'Edit Product';
        const p = DataProvider.getProductById(id);
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
          document.getElementById('p-price').value = p.price || 0;
          document.getElementById('p-mrp').value = p.mrp || '';
          document.getElementById('p-hsn').value = p.hsn || '';
          document.getElementById('p-gst').value = p.gst || 18;
          document.getElementById('p-stock').value = p.stock || 0;
          document.getElementById('p-minstock').value = p.minStock || 5;
          document.getElementById('p-rack').value = p.rack || '';
          document.getElementById('p-shelf').value = p.shelf || '';
        }
      } else {
        title.textContent = 'New Product';
      }
      productModal.classList.remove('hidden');
  };

  const addBtn = document.getElementById('btn-add-product');
  if (addBtn) addListener(addBtn, 'click', () => openForm());
  
  const handleOpenProductModal = (e) => openForm(e.detail);
  addListener(window, 'openProductModal', handleOpenProductModal);

  const saveBtn = document.getElementById('save-p-btn');
  if (saveBtn) {
    const formEl = document.getElementById('product-form');
    if (formEl) DraftManager.init('product', formEl);

    addListener(saveBtn, 'click', () => {
      const form = document.getElementById('product-form');
      if (!form.reportValidity()) return;
      
      const field = (id) => document.getElementById(id);
      const validationError = validateForm([
        { el: field('p-name'), check: (v) => rules.required(v, 'Product name') || rules.maxLength(v, 100, 'Product name') },
        { el: field('p-sku'), check: (v) => rules.maxLength(v, 50, 'SKU') },
        { el: field('p-barcode'), check: (v) => rules.maxLength(v, 50, 'Barcode') },
        { el: field('p-hsn'), check: (v) => rules.maxLength(v, 20, 'HSN code') },
        { el: field('p-buying'), check: (v) => rules.number(v, 'Buying price') || rules.nonNegative(v, 'Buying price') },
        { el: field('p-mrp'), check: (v) => rules.number(v, 'MRP') || rules.nonNegative(v, 'MRP') },
        { el: field('p-gst'), check: (v) => rules.number(v, 'GST %') || rules.nonNegative(v, 'GST %') || rules.max(v, 100, 'GST %') },
        { el: field('p-stock'), check: (v) => rules.required(v, 'Current stock') || rules.nonNegative(v, 'Current stock') },
        { el: field('p-minstock'), check: (v) => rules.number(v, 'Min stock') || rules.nonNegative(v, 'Min stock') }
      ]);
      if (validationError) {
        NotificationService.error(validationError);
        return;
      }
      
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
        price: Number(document.getElementById('p-price').value || 0),
        mrp: Number(document.getElementById('p-mrp').value || 0),
        hsn: document.getElementById('p-hsn').value,
        gst: Number(document.getElementById('p-gst').value || 18),
        stock: Number(document.getElementById('p-stock').value || 0),
        minStock: Number(document.getElementById('p-minstock').value || 0),
        rack: document.getElementById('p-rack').value,
        shelf: document.getElementById('p-shelf').value,
        isActive: true
      };
      
      import('../services/dataProvider.js').then(({ DataProvider }) => {
        try {
          DataProvider.saveProduct(product);
          DraftManager.clearDraft('product');
          productModal.classList.add('hidden');
          const fresh = DataProvider.getProducts();
          const tbody2 = document.getElementById('products-tbody');
          if (tbody2) {
            tbody2.innerHTML = fresh.length > 0 ? fresh.map(renderRow).join('') : '<tr><td colspan="11"><div class="empty-state"><i data-lucide="package"></i><p>No products found.</p></div></td></tr>';
            if (window.lucide) window.lucide.createIcons({ nodes: [tbody2] });
          }
          NotificationService.success('Product saved successfully!');
        } catch (err) {
          NotificationService.error(err.message);
        }
      });
    });
  }

  // Import Modal logic
  const importModal = document.getElementById('import-modal');
  const btnImportExcel = document.getElementById('btn-import-excel');
  const fileInput = document.getElementById('excel-file');
  const processBtn = document.getElementById('btn-process-import');
  const fileNameLabel = document.getElementById('file-name-label');
  
  if (btnImportExcel) {
    addListener(btnImportExcel, 'click', () => {
      importModal.classList.remove('hidden');
    });
  }
  
  let workbookData = null;
  if (fileInput) {
    addListener(fileInput, 'change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      fileNameLabel.textContent = file.name;
      const reader = new FileReader();
      reader.onload = function(e) {
        if (!window.XLSX) {
          NotificationService.error('SheetJS (XLSX) library not loaded. Ensure internet connection.');
          return;
        }
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, {type: 'array'});
        workbookData = window.XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        processBtn.disabled = false;
      };
      reader.readAsArrayBuffer(file);
    });
  }
  
  if (processBtn) {
    addListener(processBtn, 'click', () => {
      if (!workbookData || !workbookData.length) return;
      import('../services/dataProvider.js').then(({ DataProvider }) => {
          let imported = 0, updated = 0;
          const products = DataProvider.getProducts();
          
          workbookData.forEach(row => {
            const sku = row.SKU || row.sku;
            const name = row.Name || row.name;
            if (!name) return;
            let existing = products.find(p => p.sku === sku) || products.find(p => p.name.toLowerCase() === name.toLowerCase());
            
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
          importModal.classList.add('hidden');
          const fresh = DataProvider.getProducts();
          const tbody2 = document.getElementById('products-tbody');
          if (tbody2) {
            tbody2.innerHTML = fresh.length > 0 ? fresh.map(renderRow).join('') : '<tr><td colspan="11"><div class="empty-state"><i data-lucide="package"></i><p>No products found.</p></div></td></tr>';
            if (window.lucide) window.lucide.createIcons({ nodes: [tbody2] });
          }
        });
    });
  }

  const closeButtons = document.querySelectorAll('[data-close-modal]');
  const handleCloseModal = (e) => {
    const modal = document.getElementById(e.currentTarget.getAttribute('data-close-modal'));
    if (modal) modal.classList.add('hidden');
  };
  closeButtons.forEach(btn => addListener(btn, 'click', handleCloseModal));

  return function cleanup() {
    __listeners.forEach(l => {
      if (l.el) l.el.removeEventListener(l.evt, l.handler);
    });
    __listeners.length = 0;
  };
}
