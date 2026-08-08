import { NotificationService } from './notificationService.js';
/**
 * Senthil Enterprises ERP - Draft Manager
 * Implements Gmail-style auto-recovery for forms.
 */
export class DraftManager {
  static DRAFT_KEY = 'erp_drafts';

  static getDrafts() {
    try {
      const data = localStorage.getItem(this.DRAFT_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  static _saveTimeout = null;
  static _pendingDrafts = null;

  static saveDraft(moduleName, data) {
    if (!this._pendingDrafts) {
       this._pendingDrafts = this.getDrafts();
    }
    this._pendingDrafts[moduleName] = {
      timestamp: new Date().toISOString(),
      data: data
    };
    
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem(this.DRAFT_KEY, JSON.stringify(this._pendingDrafts));
        this._pendingDrafts = null;
      } catch (e) {
        console.error('Draft save failed', e);
      }
    }, 500);
  }

  static getDraft(moduleName) {
    if (this._pendingDrafts && this._pendingDrafts[moduleName]) {
      return this._pendingDrafts[moduleName].data;
    }
    const drafts = this.getDrafts();
    return drafts[moduleName] ? drafts[moduleName].data : null;
  }

  static clearDraft(moduleName) {
    if (this._pendingDrafts) {
      delete this._pendingDrafts[moduleName];
    }
    const drafts = this.getDrafts();
    delete drafts[moduleName];
    localStorage.setItem(this.DRAFT_KEY, JSON.stringify(drafts));
  }

  /**
   * Initializes draft tracking for a specific form container.
   * @param {string} moduleName - Unique identifier for the module (e.g. 'customers')
   * @param {HTMLElement} container - The DOM element containing the inputs
   * @param {function} onRestore - Optional callback if complex restoration is needed
   */
  static init(moduleName, container, onRestore = null) {
    if (!container) return;

    // 1. Restore draft if exists
    const draft = this.getDraft(moduleName);
    if (draft) {
      if (onRestore) {
        onRestore(draft);
      } else {
        // Basic restoration
        let hasRestored = false;
        for (const [id, value] of Object.entries(draft)) {
          const el = container.querySelector(`#${id}`);
          if (el) {
            if (el.type === 'checkbox') el.checked = value;
            else el.value = value;
            hasRestored = true;
          }
        }
        if (hasRestored && window.showToast) {
          NotificationService.info('Draft restored — your previous entry has been loaded.');
        }
      }
    }

    // 2. Setup Auto-save (Debounced)
    let timeout = null;
    const saveState = () => {
      const state = {};
      const inputs = container.querySelectorAll('input[id], select[id], textarea[id]');
      let hasData = false;
      inputs.forEach(el => {
        // Skip search boxes or read-only/hidden inputs
        if (el.type === 'hidden' || el.readOnly || el.id.includes('search')) return;
        const val = el.type === 'checkbox' ? el.checked : el.value;
        if (val) hasData = true;
        state[el.id] = val;
      });
      if (hasData) {
        this.saveDraft(moduleName, state);
      }
    };

    container.addEventListener('input', (e) => {
      if (!e.target.id || e.target.id.includes('search')) return;
      
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        saveState();
        // Optional visual indicator
        const indicator = document.getElementById('draft-indicator');
        if (indicator) {
          indicator.textContent = 'Saved as draft';
          indicator.classList.remove('opacity-0');
          setTimeout(() => indicator.classList.add('opacity-0'), 2000);
        }
      }, 500);
    });
  }
}
