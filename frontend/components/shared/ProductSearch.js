import { PurchaseState } from './PurchaseState.js';
import { PurchaseUtils } from './utils.js';
import { DataProvider } from '../../services/dataProvider.js';

export const ProductSearch = {
  render() {
    return `
      <div class="bg-white rounded-xl border border-border p-5 mb-6">
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-bold text-text">Product Search (F3)</label>
        </div>
        <div class="relative">
          <i data-lucide="search" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" id="po-product-search" placeholder="Search by barcode, product name, or SKU..." class="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" autocomplete="off">
          
          <div id="po-search-results" class="absolute left-0 right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-xl z-[60] max-h-[300px] overflow-y-auto hidden">
            <!-- Results injected here -->
          </div>
        </div>
      </div>
    `;
  },

  bindEvents(rootElement) {
    const searchInput = rootElement.querySelector('#po-product-search');
    const searchResults = rootElement.querySelector('#po-search-results');
    
    const performSearch = async (query) => {
      if (!query) {
        searchResults.classList.add('hidden');
        return;
      }

      const { DataProvider } = await import('../../services/dataProvider.js');
      const products = DataProvider.getProducts();

      const q = query.toLowerCase();
      const matches = products.filter(p => 
        p.isActive && 
        (
          p.name.toLowerCase().includes(q) || 
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
        )
      ).slice(0, 8); // show max 8 results for speed

      if (matches.length > 0) {
        searchResults.innerHTML = matches.map((p, index) => `
          <div class="p-3 border-b border-border hover:bg-gray-50 cursor-pointer po-search-item flex justify-between items-center ${index === 0 ? 'bg-gray-50' : ''}" data-id="${p.id}" tabindex="0">
            <div>
              <div class="text-sm font-medium text-text">${p.name}</div>
              <div class="text-xs text-gray-500 mt-0.5">${p.sku ? 'SKU: ' + p.sku : ''} ${p.barcode ? '| Barcode: ' + p.barcode : ''}</div>
            </div>
            <div class="text-right">
              <div class="text-sm font-semibold text-primary">₹${(p.purchasePrice || p.avgCost || p.price * 0.8 || 0).toFixed(2)}</div>
              <div class="text-[10px] text-gray-400">Stock: ${p.stock || 0} ${p.unit || 'pcs'}</div>
            </div>
          </div>
        `).join('');
        searchResults.classList.remove('hidden');
      } else {
        searchResults.innerHTML = '<div class="p-4 text-sm text-center text-gray-500">No products found matching your search.</div>';
        searchResults.classList.remove('hidden');
      }
    };

    const debouncedSearch = PurchaseUtils.debounce((e) => {
      performSearch(e.target.value);
    }, 250);

    if (searchInput) {
      searchInput.addEventListener('input', debouncedSearch);
      
      // Handle keyboard navigation inside search results
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' && !searchResults.classList.contains('hidden')) {
          e.preventDefault();
          const firstItem = searchResults.querySelector('.po-search-item');
          if (firstItem) firstItem.focus();
        }
      });
    }

    if (searchResults) {
      searchResults.addEventListener('click', async (e) => {
        const itemEl = e.target.closest('.po-search-item');
        if (itemEl) {
          const pId = itemEl.getAttribute('data-id');
          const { DataProvider } = await import('../../services/dataProvider.js');
          const products = DataProvider.getProducts();
          const product = products.find(p => p.id === pId);
          if (product) {
            PurchaseState.addItem(product);
            searchInput.value = '';
            searchResults.classList.add('hidden');
            searchInput.focus();
          }
        }
      });

      searchResults.addEventListener('keydown', (e) => {
        const active = document.activeElement;
        if (!active || !active.classList.contains('po-search-item')) return;
        
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = active.nextElementSibling;
          if (next && next.classList.contains('po-search-item')) next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = active.previousElementSibling;
          if (prev && prev.classList.contains('po-search-item')) prev.focus();
          else searchInput.focus();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          active.click();
        } else if (e.key === 'Escape') {
          searchResults.classList.add('hidden');
          searchInput.focus();
        }
      });
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (searchInput && searchResults && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.classList.add('hidden');
      }
    });
  }
};
