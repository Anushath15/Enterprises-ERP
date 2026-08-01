import { TransactionActions } from './TransactionActions.js';
export const TransactionFooter = (config) => {
  return {
    render() {
      const state = config.store.getState();
      const summary = state.summary || { subtotal: 0, discount: 0, taxAmount: 0, roundOff: 0, grandTotal: 0 };
      const payment = state.payment || { status: 'Pending', mode: '' };

      return `
        <div id="txn-sticky-footer" class="sticky bottom-0 z-[40] bg-gray-50 border-t border-border shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <div class="px-6 py-4">
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              <!-- Zone 1: Summary Cards -->
              <div class="flex gap-4 flex-wrap flex-1">
                <div class="bg-white px-4 py-2 rounded-lg border border-border shadow-sm min-w-[120px]">
                  <div class="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Subtotal</div>
                  <div id="footer-subtotal" class="text-sm font-semibold text-text">Rs.${(summary.subtotal || 0).toFixed(2)}</div>
                </div>
                <div class="bg-white px-4 py-2 rounded-lg border border-border shadow-sm min-w-[120px]">
                  <div class="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Discount</div>
                  <div id="footer-discount" class="text-sm font-semibold text-danger">- Rs.${(summary.discountAmount || 0).toFixed(2)}</div>
                </div>
                <div class="bg-white px-4 py-2 rounded-lg border border-border shadow-sm min-w-[120px]">
                  <div class="text-[10px] uppercase font-bold text-gray-500 tracking-wider">${config.taxType || 'Tax'}</div>
                  <div id="footer-tax" class="text-sm font-semibold text-text">Rs.${(summary.taxAmount || 0).toFixed(2)}</div>
                </div>
                <div class="bg-white px-4 py-2 rounded-lg border border-border shadow-sm min-w-[120px]">
                  <div class="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Round Off</div>
                  <div id="footer-roundoff" class="text-sm font-semibold text-gray-500">Rs.${(summary.roundOff || 0).toFixed(2)}</div>
                </div>
                <div class="bg-primary/5 px-4 py-2 rounded-lg border border-primary/20 shadow-sm min-w-[140px]">
                  <div class="text-[10px] uppercase font-bold text-primary tracking-wider">Grand Total</div>
                  <div id="footer-grandtotal" class="text-lg font-extrabold text-primary">Rs.${(summary.grandTotal || 0).toFixed(2)}</div>
                </div>
              </div>

              <!-- Zone 2: Payment Controls -->
              <div class="flex flex-row items-center gap-4 py-4 lg:py-0 border-t border-b lg:border-t-0 lg:border-b-0 lg:border-l lg:border-r border-border lg:px-6 w-full lg:w-auto overflow-x-auto">
                <div class="flex-1 lg:flex-none">
                  <label class="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-1">Status</label>
                  <select id="txn-payment-status" class="bg-white border border-border rounded text-sm px-2 py-1.5 focus:outline-none focus:border-primary w-full lg:min-w-[100px]">
                    <option value="Pending" ${payment.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Paid Full" ${payment.status === 'Paid Full' ? 'selected' : ''}>Paid Full</option>
                    <option value="Partial" ${payment.status === 'Partial' ? 'selected' : ''}>Partial</option>
                  </select>
                </div>
                <div class="flex-1 lg:flex-none">
                  <label class="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-1">Mode</label>
                  <select id="txn-payment-mode" class="bg-white border border-border rounded text-sm px-2 py-1.5 focus:outline-none focus:border-primary w-full lg:min-w-[100px]">
                    <option value="">None</option>
                    <option value="Cash" ${payment.mode === 'Cash' ? 'selected' : ''}>Cash</option>
                    <option value="UPI" ${payment.mode === 'UPI' ? 'selected' : ''}>UPI</option>
                    <option value="Bank" ${payment.mode === 'Bank' ? 'selected' : ''}>Bank</option>
                    <option value="Credit" ${payment.mode === 'Credit' ? 'selected' : ''}>Credit</option>
                  </select>
                </div>
              </div>

              <!-- Zone 3: Actions -->
              <div class="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <button id="btn-cancel-txn" class="w-full sm:flex-1 lg:flex-none px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button id="btn-save-draft" class="w-full sm:flex-1 lg:flex-none px-4 py-2.5 bg-white border border-primary text-primary text-sm font-medium rounded-lg hover:bg-primary/5">
                  Save Draft
                </button>
                <button id="btn-save-txn" class="w-full sm:flex-1 lg:flex-none px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 shadow-sm shadow-primary/30 flex items-center justify-center gap-2">
                  <i data-lucide="check" class="w-4 h-4"></i>
                  Save (Ctrl+S)
                </button>
              </div>

            </div>
          </div>
        </div>
      `;
    },

    bindEvents(rootElement) {
      const statusSelect = rootElement.querySelector('#txn-payment-status');
      const modeSelect = rootElement.querySelector('#txn-payment-mode');

      if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
          config.store.dispatch({
            type: TransactionActions.PAYMENT_UPDATE,
            payload: { field: 'status', value: e.target.value }
          });
        });
      }

      if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
          config.store.dispatch({
            type: TransactionActions.PAYMENT_UPDATE,
            payload: { field: 'mode', value: e.target.value }
          });
        });
      }

      // Live Summary Updates via State Subscribe
      config.store.subscribe((state) => {
        const summary = state.summary || { subtotal: 0, discountAmount: 0, taxAmount: 0, roundOff: 0, grandTotal: 0 };
        
        const subtotalEl = rootElement.querySelector('#footer-subtotal');
        if (subtotalEl && subtotalEl.textContent !== `Rs.${summary.subtotal.toFixed(2)}`) {
          subtotalEl.textContent = `Rs.${summary.subtotal.toFixed(2)}`;
        }
        
        const discountEl = rootElement.querySelector('#footer-discount');
        if (discountEl && discountEl.textContent !== `- Rs.${summary.discountAmount.toFixed(2)}`) {
          discountEl.textContent = `- Rs.${summary.discountAmount.toFixed(2)}`;
        }
        
        const taxEl = rootElement.querySelector('#footer-tax');
        if (taxEl && taxEl.textContent !== `Rs.${summary.taxAmount.toFixed(2)}`) {
          taxEl.textContent = `Rs.${summary.taxAmount.toFixed(2)}`;
        }
        
        const roundOffEl = rootElement.querySelector('#footer-roundoff');
        if (roundOffEl && roundOffEl.textContent !== `Rs.${summary.roundOff.toFixed(2)}`) {
          roundOffEl.textContent = `Rs.${summary.roundOff.toFixed(2)}`;
        }
        
        const grandTotalEl = rootElement.querySelector('#footer-grandtotal');
        if (grandTotalEl && grandTotalEl.textContent !== `Rs.${summary.grandTotal.toFixed(2)}`) {
          grandTotalEl.textContent = `Rs.${summary.grandTotal.toFixed(2)}`;
        }

        // Sync Payment state back in case it changed externally
        if (statusSelect && state.payment && statusSelect.value !== state.payment.status) {
          statusSelect.value = state.payment.status;
        }
        if (modeSelect && state.payment && modeSelect.value !== state.payment.mode) {
          modeSelect.value = state.payment.mode;
        }
      });

      // Actions
      const cancelBtn = rootElement.querySelector('#btn-cancel-txn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          // Typically routes back to list, configurable via config
          window.location.hash = `#/${config.moduleName}`;
        });
      }

      const saveDraftBtn = rootElement.querySelector('#btn-save-draft');
      if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', () => {
          config.store.dispatch({ type: 'REQUEST_SAVE_DRAFT' });
        });
      }

      const saveBtn = rootElement.querySelector('#btn-save-txn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          config.store.dispatch({ type: 'REQUEST_SAVE' });
        });
      }
    }
  };
};
