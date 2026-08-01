import { NotificationService } from '../../services/notificationService.js';
import { TransactionActions } from './TransactionActions.js';
import { debounce } from '../../utils/debounce.js';
import { escapeHtml } from '../../utils/escapeHtml.js';

export const AutosaveMiddleware = (config) => {
  const DRAFT_KEY = `erp_${config.moduleName}_draft_v1`;

  const saveDraft = debounce((state) => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        timestamp: new Date().toISOString(),
        state: state
      }));
    } catch (err) {
      console.warn('Failed to save draft:', err);
    }
  }, 1000);

  return (store) => (next) => (action) => {
    next(action);
    
    // Catch intentional draft save
    if (action.type === 'REQUEST_SAVE_DRAFT') {
      const state = store.getState();
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          timestamp: new Date().toISOString(),
          state: state
        }));
        NotificationService.success('Draft saved successfully');
      } catch (err) {}
    } 
    // Clear draft on successful save
    else if (action.type === TransactionActions.CLEAR_DRAFT) {
      localStorage.removeItem(DRAFT_KEY);
    }
    // Autosave on dirtiness
    else if (action.type === 'MARK_DIRTY' || action.type.startsWith('ITEM_') || action.type === TransactionActions.HEADER_UPDATE || action.type === TransactionActions.PAYMENT_UPDATE) {
      saveDraft(store.getState());
    }
  };
};

export const TransactionAutosave = {
  checkDraft(config) {
    const DRAFT_KEY = `erp_${config.moduleName}_draft_v1`;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Only return if it has actual data
        if (parsed.state && parsed.state.items && parsed.state.items.length > 0) {
          return parsed;
        }
      }
    } catch (err) {}
    return null;
  },

  clearDraft(config) {
    const DRAFT_KEY = `erp_${config.moduleName}_draft_v1`;
    localStorage.removeItem(DRAFT_KEY);
  },
  
  promptRecovery(config, draft, onRecover, onDiscard) {
    const timeStr = new Date(draft.timestamp).toLocaleString();
    const itemsCount = draft.state.items?.length || 0;
    
    // We can inject a modal or a banner here
    const banner = document.createElement('div');
    banner.className = 'bg-primary/10 border border-primary/20 p-4 mb-6 rounded-xl flex items-center justify-between shadow-sm';
    banner.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="p-2 bg-primary/20 rounded-lg">
          <i data-lucide="history" class="w-5 h-5 text-primary"></i>
        </div>
        <div>
          <h4 class="text-sm font-bold text-text">Unsaved Draft Recovered</h4>
          <p class="text-xs text-gray-600 mt-0.5">Found an unsaved ${escapeHtml(config.moduleName)} from ${escapeHtml(timeStr)} containing ${itemsCount} items.</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button id="btn-discard-draft" class="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">Discard</button>
        <button id="btn-recover-draft" class="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded hover:bg-primary/90 shadow-sm">Recover Draft</button>
      </div>
    `;

    document.querySelector('.transaction-container').prepend(banner);
    if (window.lucide) window.lucide.createIcons({ nodes: [banner] });

    banner.querySelector('#btn-discard-draft').addEventListener('click', () => {
      this.clearDraft(config);
      banner.remove();
      if (onDiscard) onDiscard();
    });

    banner.querySelector('#btn-recover-draft').addEventListener('click', () => {
      onRecover(draft.state);
      banner.remove();
    });
  }
};
