import { TransactionActions } from './TransactionActions.js';
import { TableWrapper } from '../ui/designSystem.js';
import { TransactionRow } from './TransactionRow.js';

export const TransactionTable = (config) => {
  return {
    render() {
      const headers = (config.columns || []).map(col => {
        const align = col.align || 'text-left';
        const width = col.width || 'auto';
        return `<div class="${align} ${width}">${col.label || ''}</div>`;
      });

      return `
        <div class="bg-white rounded-xl border border-border overflow-hidden mb-6 flex flex-col shadow-sm">
          ${TableWrapper({
            headers: headers,
            rowsHtml: `<tr id="txn-table-empty-row"><td colspan="11" class="text-center py-10"><div class="flex flex-col items-center justify-center text-gray-400"><i data-lucide="shopping-cart" class="w-10 h-10 mb-3 text-gray-300"></i><p class="text-sm font-medium text-gray-500">No products added yet</p><p class="text-xs mt-1">Use the search bar above or press F3 to find products.</p></div></td></tr>`,
            tbodyId: 'txn-table-body'
          })}
        </div>
      `;
    },

    bindEvents(rootElement) {
      const tbody = rootElement.querySelector('#txn-table-body');
      if (!tbody) return;

      config._cleanups = config._cleanups || [];

      // Handle Undo Event registered via window
      const undoEventHandler = () => {
        try {
           const item = window.__lastUndoItem;
           if (item) {
             config.store.dispatch({ type: TransactionActions.ITEM_ADD, payload: item });
             window.__lastUndoItem = null;
           }
        } catch (err) {
           console.error('Failed to parse undo item', err);
        }
      };
      const undoEventName = `undo${config.moduleName}Delete`;
      window.addEventListener(undoEventName, undoEventHandler);
      config._cleanups.push(() => window.removeEventListener(undoEventName, undoEventHandler));

      // Delegated handler for the Undo button in the notification toast (no inline onclick)
      const undoClickHandler = (e) => {
        if (e.target.closest('.txn-undo-btn')) {
          window.dispatchEvent(new CustomEvent(undoEventName));
        }
      };
      document.addEventListener('click', undoClickHandler);
      config._cleanups.push(() => document.removeEventListener('click', undoClickHandler));

      const RowComponent = TransactionRow(config);

      // DOM Reconciliation logic to ensure NO innerHTML full repaints
      config.store.subscribe((state) => {
        const items = state.items || [];
        const priceFieldStr = config.pricing?.field || config.priceField || 'purchasePrice';
        
        if (items.length === 0) {
          tbody.innerHTML = `<tr id="txn-table-empty-row"><td colspan="11" class="text-center py-10"><div class="flex flex-col items-center justify-center text-gray-400"><i data-lucide="shopping-cart" class="w-10 h-10 mb-3 text-gray-300"></i><p class="text-sm font-medium text-gray-500">No products added yet</p><p class="text-xs mt-1">Use the search bar above or press F3 to find products.</p></div></td></tr>`;
          if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
          return;
        }

        // Remove empty row if it exists
        const emptyRow = tbody.querySelector('#txn-table-empty-row');
        if (emptyRow) emptyRow.remove();

        // 1. Remove DOM rows that are no longer in state
        Array.from(tbody.children).forEach(tr => {
          const id = tr.getAttribute('data-id');
          if (id && !items.find(i => i.id === id)) {
            tr.remove();
          }
        });

        // 2. Add or update rows in exact order
        items.forEach((item, index) => {
          let tr = tbody.querySelector(`tr[data-id="${item.id}"]`);
          
          if (!tr) {
            // New row to insert
            const tmp = document.createElement('tbody');
            tmp.innerHTML = RowComponent.render(item, index);
            tr = tmp.firstElementChild;
            tbody.appendChild(tr);
            
            RowComponent.bindEvents(tr, item.id);
            if (window.lucide) window.lucide.createIcons({ nodes: [tr] });
          } else {
            // Existing row to update (qty change, price change, etc)
            RowComponent.update(tr, item, index);
            
            // Fix ordering if it somehow got out of sync
            if (tbody.children[index] !== tr) {
               tbody.insertBefore(tr, tbody.children[index]);
            }
          }
        });
      });
    }
  };
};
