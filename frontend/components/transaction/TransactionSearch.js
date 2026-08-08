import { TransactionActions } from './TransactionActions.js';
import { debounce } from '../../utils/debounce.js';
import { escapeHtml } from '../../utils/escapeHtml.js';

export const TransactionSearch = (config) => {
  return {
    render() {
      return `
        <div class="bg-white rounded-xl border border-border p-5 mb-6">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-bold text-text">Product Search (F3)</label>
          </div>
          <div class="relative">
            <i data-lucide="search" class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input type="text" id="txn-product-search" placeholder="Search by barcode, product name, or SKU..." class="w-full pl-10 pr-4 py-3 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all" autocomplete="off">
            
            <div id="txn-search-results" class="absolute left-0 right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-xl z-[60] max-h-[300px] overflow-y-auto hidden">
              <!-- Results injected here -->
            </div>
          </div>
        </div>
      `;
    },

    bindEvents(rootElement) {
      const searchInput = rootElement.querySelector('#txn-product-search');
      const searchResults = rootElement.querySelector('#txn-search-results');
      
      const performSearch = async (query) => {
        if (!query) {
          searchResults.classList.add('hidden');
          return;
        }

        const { ProductService } = await import('../../services/domain/productService.js');
        const products = ProductService.search(query);

        const matches = products.slice(0, 8); 

        if (matches.length > 0) {
          searchResults.innerHTML = matches.map((p, index) => {
            let priceFieldStr = config.pricing?.field || config.priceField || 'price';
            const displayPrice = (p[priceFieldStr] || p.price || 0).toFixed(2);
            
            let stockHtml = '';
            if (config.ui?.showAvailableStock) {
               let available = p.stock || 0;
               if (config.services && config.services.inventory) {
                 available = config.services.inventory.getAvailableStock(p.id);
               }
               const colorClass = available <= 0 ? 'text-danger' : 'text-gray-400';
               stockHtml = `<div class="text-[10px] ${colorClass}">Available: ${available} ${escapeHtml(p.unit || 'pcs')}</div>`;
            } else {
               stockHtml = `<div class="text-[10px] text-gray-400">Stock: ${p.stock || 0} ${escapeHtml(p.unit || 'pcs')}</div>`;
            }

            return `
            <div class="p-3 border-b border-border hover:bg-gray-50 cursor-pointer po-search-item flex justify-between items-center ${index === 0 ? 'bg-gray-50' : ''}" data-id="${escapeHtml(p.id)}" tabindex="0">
              <div>
                <div class="text-sm font-medium text-text">${escapeHtml(p.name)}</div>
                <div class="text-xs text-gray-500 mt-0.5">${escapeHtml(p.sku ? 'SKU: ' + p.sku : '')} ${escapeHtml(p.barcode ? '| Barcode: ' + p.barcode : '')}</div>
              </div>
              <div class="text-right">
                <div class="text-sm font-semibold text-primary">Rs.${displayPrice}</div>
                ${stockHtml}
              </div>
            </div>
          `}).join('');
          searchResults.classList.remove('hidden');
        } else {
          searchResults.innerHTML = '<div class="p-4 text-sm text-center text-gray-500">No products found matching your search.</div>';
          searchResults.classList.remove('hidden');
        }
      };

      const debouncedSearch = debounce((e) => {
        performSearch(e.target.value);
      }, 250);

      if (searchInput) {
        searchInput.addEventListener('input', debouncedSearch);
        
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
            const { ProductService } = await import('../../services/domain/productService.js');
            const product = ProductService.find(pId);
            if (product) {
              const itemPayload = {
                id: product.id + '-' + Date.now(), 
                productId: product.id,
                name: product.name,
                barcode: product.barcode,
                sku: product.sku,
                unit: product.unit || 'pcs',
                qty: 1,
                discount: 0,
                gst: product.taxRate || 0,
              };
                const priceFieldStr = config.pricing?.field || config.priceField || 'price';
                itemPayload[priceFieldStr] = product[priceFieldStr] || product.price || 0;
              
              config.store.dispatch({
                type: TransactionActions.ITEM_ADD,
                payload: itemPayload
              });
              
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

      const handleDocumentClick = (e) => {
        if (searchInput && searchResults && !searchInput.contains(e.target) && !searchResults.contains(e.target)) {
          searchResults.classList.add('hidden');
        }
      };
      document.addEventListener('click', handleDocumentClick);
      config._cleanups = config._cleanups || [];
      config._cleanups.push(() => document.removeEventListener('click', handleDocumentClick));
    }
  };
};
