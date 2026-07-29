/**
 * Senthil Enterprises ERP - Opening Stock Wizard
 * Allows rapid entry of opening quantities and purchase costs.
 */
import { DataProvider } from '../services/dataProvider.js';

export async function render() {
  return `
    <div class="p-6 max-w-7xl mx-auto">
      <div class="bg-white rounded-xl border border-border shadow-sm flex flex-col h-[calc(100vh-120px)]">
        <!-- Header -->
        <div class="p-5 border-b border-border flex items-center justify-between bg-gray-50/50 rounded-t-xl shrink-0">
          <div>
            <h2 class="text-xl font-bold text-text flex items-center gap-2">
              <i data-lucide="package-open" class="w-6 h-6 text-primary"></i> Opening Stock Wizard
            </h2>
            <p class="text-sm text-gray-500 mt-1">Enter initial stock and purchase costs for imported products.</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="relative">
              <i data-lucide="search" class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input type="text" id="wizard-search" placeholder="Search product..." class="pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-primary w-64">
            </div>
            <button id="btn-save-wizard" class="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
              <i data-lucide="save" class="w-4 h-4"></i> Save Opening Stock
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-border">SKU</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-border">Product Name</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-border w-32">Opening Qty</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-border w-32">Purchase Cost (₹)</th>
                <th class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-border w-48">Supplier Name</th>
              </tr>
            </thead>
            <tbody id="wizard-tbody" class="divide-y divide-border">
              <!-- Rendered via JS -->
            </tbody>
          </table>
        </div>
        
        <!-- Footer / Pagination (Mock) -->
        <div class="p-4 border-t border-border bg-gray-50 flex justify-between items-center shrink-0">
          <span class="text-sm text-gray-500" id="wizard-status">Showing top 100 products (Filter to see more)</span>
        </div>
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  let allProducts = DataProvider.getProducts().filter(p => p.isActive && p.stock === 0);
  let renderLimit = 100;
  
  const tbody = rootElement.querySelector('#wizard-tbody');
  const searchInput = rootElement.querySelector('#wizard-search');
  const statusLabel = rootElement.querySelector('#wizard-status');
  
  const renderTable = (query = '') => {
    let filtered = allProducts;
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    
    const displayList = filtered.slice(0, renderLimit);
    statusLabel.textContent = `Showing ${displayList.length} of ${filtered.length} products needing stock.`;
    
    if (displayList.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-500">No products found.</td></tr>';
      return;
    }
    
    tbody.innerHTML = displayList.map(p => `
      <tr class="hover:bg-gray-50/50 transition-colors" data-id="${p.id}">
        <td class="px-4 py-2 text-xs text-gray-500 font-mono">${p.sku}</td>
        <td class="px-4 py-2 text-sm font-medium text-text">${p.name}</td>
        <td class="px-4 py-2">
          <input type="number" min="0" class="input-qty w-full border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="Qty">
        </td>
        <td class="px-4 py-2">
          <input type="number" min="0" step="0.01" class="input-cost w-full border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="Cost">
        </td>
        <td class="px-4 py-2">
          <input type="text" class="input-supplier w-full border border-border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-primary" placeholder="Optional" value="${p.supplier || ''}">
        </td>
      </tr>
    `).join('');
  };
  
  renderTable();
  
  searchInput.addEventListener('input', (e) => {
    renderTable(e.target.value);
  });
  
  rootElement.querySelector('#btn-save-wizard').addEventListener('click', () => {
    const rows = tbody.querySelectorAll('tr[data-id]');
    const entries = [];
    
    rows.forEach(row => {
      const id = row.getAttribute('data-id');
      const qtyStr = row.querySelector('.input-qty').value;
      const costStr = row.querySelector('.input-cost').value;
      const supplier = row.querySelector('.input-supplier').value;
      
      const qty = parseInt(qtyStr, 10);
      const cost = parseFloat(costStr);
      
      if (!isNaN(qty) && qty > 0) {
        entries.push({ id, qty, cost: isNaN(cost) ? 0 : cost, supplier });
      }
    });
    
    if (entries.length === 0) {
      window.showToast('No stock entered.', 'warning');
      return;
    }
    
    try {
      // Create a dummy GRN for Opening Stock
      const purchaseInvoice = {
        date: new Date().toISOString().split('T')[0],
        dealerId: null,
        dealerName: 'Opening Balance',
        invoiceNumber: 'OPENING-STOCK',
        items: entries.map(e => ({
          productId: e.id,
          qty: e.qty,
          costPrice: e.cost,
          total: e.qty * e.cost
        })),
        subtotal: entries.reduce((sum, e) => sum + (e.qty * e.cost), 0),
        taxTotal: 0,
        totalAmount: entries.reduce((sum, e) => sum + (e.qty * e.cost), 0),
        amountPaid: entries.reduce((sum, e) => sum + (e.qty * e.cost), 0),
        paymentStatus: 'Paid Full'
      };
      
      DataProvider.savePurchaseInvoice(purchaseInvoice);
      
      // Update supplier names natively on product
      entries.forEach(e => {
        const p = DataProvider.getProductById(e.id);
        if (p && e.supplier) {
          p.supplier = e.supplier;
          DataProvider.saveProduct(p);
        }
      });
      
      window.showToast(`Saved ${entries.length} items to Opening Stock!`, 'success');
      
      // Refresh list
      allProducts = DataProvider.getProducts().filter(p => p.isActive && p.stock === 0);
      renderTable(searchInput.value);
      
    } catch (err) {
      window.showToast(err.message, 'danger');
    }
  });
  
  if (window.lucide) window.lucide.createIcons({ nodes: [rootElement] });
}
