export const KeyboardMiddleware = (config) => (store) => (next) => (action) => {
  next(action);
};

let boundHandler = null;

export const TransactionKeyboard = {
  bindEvents(config) {
    if (boundHandler) return;
    boundHandler = (e) => {
      // Avoid if inside modal or dialog
      if (document.querySelector('dialog[open]')) return;
      console.log('KEY PRESSED:', e.key);

      // Ctrl + S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        config.store.dispatch({ type: 'REQUEST_SAVE' });
      }

      // F2 (Select Entity)
      if (e.key === 'F2') {
        e.preventDefault();
        const entityEl = document.querySelector('#txn-entity');
        console.log('F2 handler:', entityEl ? 'found select' : 'no select');
        if (entityEl) {
           entityEl.focus();
           console.log('F2 focus applied, active:', document.activeElement.id);
        }
      }

      // F3 (Search Product)
      if (e.key === 'F3') {
        e.preventDefault();
        const searchEl = document.querySelector('#txn-product-search');
        if (searchEl) {
          searchEl.focus();
          searchEl.select();
        }
      }

      // Alt + Delete (Delete Row)
      if (e.altKey && (e.key === 'Delete' || e.key === 'Backspace')) {
        const active = document.activeElement;
        const tr = active.closest('tr');
        if (tr) {
          e.preventDefault();
          const id = tr.getAttribute('data-id');
          if (id) {
             const btn = tr.querySelector('.po-btn-delete');
             if (btn) btn.click();
          }
        }
      }
      
      // Grid Navigation
      const active = document.activeElement;
      if (active && active.classList.contains('po-input')) {
        const tr = active.closest('tr');
        if (!tr) return;
        
        const inputs = Array.from(tr.querySelectorAll('.po-input'));
        const index = inputs.indexOf(active);
        
        if (e.key === 'ArrowRight') {
          // If we are at the end of input text
          if (active.selectionStart === active.value.length || active.tagName === 'SELECT') {
             e.preventDefault();
             if (index < inputs.length - 1) inputs[index + 1].focus();
          }
        } else if (e.key === 'ArrowLeft') {
          if (active.selectionEnd === 0 || active.tagName === 'SELECT') {
             e.preventDefault();
             if (index > 0) inputs[index - 1].focus();
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevTr = tr.previousElementSibling;
          if (prevTr) {
            const prevInputs = prevTr.querySelectorAll('.po-input');
            if (prevInputs[index]) prevInputs[index].focus();
          }
        } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
          e.preventDefault();
          const nextTr = tr.nextElementSibling;
          if (nextTr) {
            const nextInputs = nextTr.querySelectorAll('.po-input');
            if (nextInputs[index]) nextInputs[index].focus();
          }
        }
      }
    };
    document.addEventListener('keydown', boundHandler);
  },
  teardown() {
    if (boundHandler) {
      document.removeEventListener('keydown', boundHandler);
      boundHandler = null;
    }
  }
};
