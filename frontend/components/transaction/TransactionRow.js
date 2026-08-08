import { NotificationService } from '../../services/notificationService.js';
import { TransactionActions } from './TransactionActions.js';
import { escapeHtml } from '../../utils/escapeHtml.js';

export const TransactionRow = (config) => {
  return {
    render(item, index) {
      // Allow custom hook to pre-compute row data before rendering if needed
      // but ideally the item object already has computed fields like item.lineTotal
      
      const cells = config.columns.map(col => {
        if (typeof col.renderer === 'function') {
          return col.renderer(item, index, col, config);
        }
        return `<td></td>`;
      });

      return `
        <tr data-id="${escapeHtml(item.id)}" class="group hover:bg-gray-50/50 transition-colors">
          ${cells.join('')}
        </tr>
      `;
    },

    bindEvents(trElement, itemId) {
      const inputs = trElement.querySelectorAll('.po-input');
      inputs.forEach(input => {
        const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
        input.addEventListener(eventType, (e) => {
          const field = e.target.getAttribute('data-field');
          const val = Number(e.target.value) || 0;
          config.store.dispatch({
            type: TransactionActions.ITEM_UPDATE,
            payload: { id: itemId, [field]: val }
          });
        });
      });

      const delBtn = trElement.querySelector('.po-btn-delete');
      if (delBtn) {
        delBtn.addEventListener('click', () => {
          const state = config.store.getState();
          const itemToDelete = state.items.find(i => i.id === itemId);
          
          if (itemToDelete) {
            config.store.dispatch({
              type: TransactionActions.ITEM_DELETE,
              payload: { id: itemId }
            });
            
            window.__lastUndoItem = itemToDelete;
            NotificationService.info('Item removed. <button class="txn-undo-btn underline ml-2">Undo</button>');
          }
        });
      }
    }
  };
};
