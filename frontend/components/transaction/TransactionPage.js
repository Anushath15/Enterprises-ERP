import { PageHeader, Container, Section } from '../ui/designSystem.js';
import { EntitySelector } from './EntitySelector.js';
import { TransactionSearch } from './TransactionSearch.js';
import { TransactionTable } from './TransactionTable.js';
import { TransactionFooter } from './TransactionFooter.js';
import { TransactionKeyboard } from './TransactionKeyboard.js';
import { TransactionAutosave } from './TransactionAutosave.js';

export const TransactionPage = (config) => {
  return {
    async render() {
      // 1. Initialize store with initial config state and reducers
      const initialState = {
        header: {
          [config.entityIdField]: '',
          refNo: '',
          date: new Date().toISOString().split('T')[0]
        },
        items: [],
        summary: { subtotal: 0, discountAmount: 0, taxAmount: 0, roundOff: 0, grandTotal: 0, discount: 0 },
        payment: { status: 'Pending', mode: '' },
        metadata: { dirty: false, draftVersion: 1, createdAt: null, updatedAt: null }
      };

      const { createTransactionStore } = await import('./TransactionState.js');
      const { CalculatorMiddleware, SaveMiddleware } = await import('./TransactionMiddlewares.js');
      const { AutosaveMiddleware } = await import('./TransactionAutosave.js');
      const { InventoryMiddleware } = await import('./InventoryMiddleware.js');
      const { TransactionHistory } = await import('./TransactionHistory.js');

      // Allow config to inject its custom reducers or middlewares
      const rootReducer = config.reducer; 
      
      const middlewares = [
        TransactionHistory(config),
        InventoryMiddleware(config),
        CalculatorMiddleware(config),
        AutosaveMiddleware(config),
        SaveMiddleware(config),
        ...(config.middlewares || [])
      ];

      config.store = createTransactionStore(rootReducer, initialState, middlewares);

      try {
        const entityLookup = EntitySelector(config);
        const search = TransactionSearch(config);
        const table = TransactionTable(config);
        const footer = TransactionFooter(config);

        return `
          ${PageHeader({ title: `New ${config.moduleName.charAt(0).toUpperCase() + config.moduleName.slice(1)}` })}
          ${Container({ children: `
            <div class="transaction-container pb-[180px]">
              ${entityLookup.render()}
              ${search.render()}
              ${table.render()}
            </div>
          `})}
          ${footer.render()}
        `;
      } catch (err) {
        console.error('Render error in TransactionPage', err);
        return `
          <div class="p-8 text-center bg-red-50 border border-red-200 rounded-xl">
            <h2 class="text-xl font-bold text-red-600 mb-2">Transaction UI Crashed</h2>
            <p class="text-gray-600">${err.message}</p>
          </div>
        `;
      }
    },

    async bindEvents(rootElement) {
      try {
        // Global Keyboard must be bound immediately to avoid race conditions with tests
        TransactionKeyboard.bindEvents(config);

        // Components
        const entityLookup = EntitySelector(config);
        const search = TransactionSearch(config);
        const table = TransactionTable(config);
        const footer = TransactionFooter(config);

        // Wrap each sub-component in its own safety block so one crash doesn't kill the page
        const safeBind = (name, bindFn) => {
          try { bindFn(); } catch (err) { console.error(`Error binding ${name}:`, err); }
        };

        safeBind('EntityLookup', () => { setTimeout(() => entityLookup.bindEvents(rootElement), 50); });
        safeBind('TransactionSearch', () => search.bindEvents(rootElement));
        safeBind('TransactionTable', () => table.bindEvents(rootElement));
        safeBind('TransactionFooter', () => footer.bindEvents(rootElement));
        
        // Check for drafts
        const draft = TransactionAutosave.checkDraft(config);
        if (draft) {
          TransactionAutosave.promptRecovery(config, draft, (state) => {
            config.store.replaceState(state);
          });
        }

      } catch (globalErr) {
        console.error('Fatal error binding TransactionPage events', globalErr);
      }
    },

    teardown() {
      TransactionKeyboard.teardown();
      if (config._cleanups) {
        config._cleanups.forEach(fn => {
          try { fn(); } catch (err) { console.error('Error in transaction cleanup', err); }
        });
        config._cleanups = [];
      }
    }
  };
};
