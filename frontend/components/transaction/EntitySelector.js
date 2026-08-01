import { TransactionActions } from './TransactionActions.js';
import { escapeHtml } from '../../utils/escapeHtml.js';
export const EntityLookup = (config) => {
  return {
    render() {
      const state = config.store.getState();
      
      return `
        <div class="bg-white rounded-xl border border-border p-5 mb-6">
          <h3 class="text-sm font-bold text-text mb-4">Transaction Details</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Select ${config.entityLabel} <span class="text-danger">*</span> (F2)</label>
              <!-- Generic dropdown, data injected on mount -->
              <select id="txn-entity" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                <option value="">-- Choose ${config.entityLabel} --</option>
              </select>
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Invoice / Ref Number <span class="text-danger">*</span></label>
              <input type="text" id="txn-ref-no" value="${escapeHtml(state.header.refNo || state.header.invoiceNo || '')}" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="INV-2026-001">
            </div>
            <div>
              <label class="text-xs font-medium text-gray-500 block mb-1.5">Date <span class="text-danger">*</span></label>
              <input type="date" id="txn-date" value="${state.header.date || state.header.invoiceDate || ''}" class="w-full px-3 py-2 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
            </div>
          </div>
        </div>
      `;
    },

    async bindEvents(rootElement) {
      const entityEl = rootElement.querySelector('#txn-entity');
      const refNoEl = rootElement.querySelector('#txn-ref-no');
      const dateEl = rootElement.querySelector('#txn-date');

      if (entityEl) {
        // Load data dynamically
        const { DataProvider } = await import('../../services/dataProvider.js');
        // A generic way to load entities based on config
        const fetchFn = config.services?.entity || config.entityFetch;
        const entities = fetchFn ? fetchFn(DataProvider) : [];
        
        const state = config.store.getState();
        const currentEntityId = state.header[config.entityIdField];

        // Populate options
        entities.forEach(ent => {
          const opt = document.createElement('option');
          opt.value = ent.id;
          opt.textContent = ent.companyName || ent.name;
          if (ent.id === currentEntityId) {
            opt.selected = true;
          }
          entityEl.appendChild(opt);
        });

        entityEl.addEventListener('change', (e) => {
          config.store.dispatch({
            type: TransactionActions.HEADER_UPDATE,
            payload: { field: config.entityIdField, value: e.target.value }
          });
        });
      }

      if (refNoEl) {
        refNoEl.addEventListener('change', (e) => {
          config.store.dispatch({
            type: TransactionActions.HEADER_UPDATE,
            payload: { field: 'refNo', value: e.target.value }
          });
        });
      }

      if (dateEl) {
        dateEl.addEventListener('change', (e) => {
          config.store.dispatch({
            type: TransactionActions.HEADER_UPDATE,
            payload: { field: 'date', value: e.target.value }
          });
        });
      }
    }
  };
};
