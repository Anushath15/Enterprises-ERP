/**
 * Senthil Enterprises ERP - Debug Overlay
 * Intercepts uncaught exceptions and unhandled promise rejections, displaying them
 * in a full-screen red debug panel to ensure errors are not silently ignored.
 */

(function() {
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderErrorOverlay(message, source, lineno, colno, error, type = 'Uncaught Error') {
    let overlay = document.getElementById('erp-debug-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'erp-debug-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background-color: rgba(185, 28, 28, 0.95); /* Tailwind red-700 */
        color: white;
        z-index: 2147483647; /* Max z-index */
        display: flex;
        flex-direction: column;
        padding: 40px;
        font-family: monospace;
        overflow-y: auto;
      `;
      document.body.appendChild(overlay);
    }

    const time = escapeHtml(new Date().toLocaleTimeString());
    const stack = error && error.stack ? escapeHtml(error.stack) : 'No stack trace available.';
    const route = escapeHtml(window.location.hash || '#/');
    
    // Attempt to extract local storage keys safely
    let lsKeys = [];
    try {
      lsKeys = escapeHtml(Object.keys(localStorage).join(', ') || 'None');
    } catch(e) {
      lsKeys = 'Inaccessible';
    }

    // Try to get current user from localStorage
    let user = 'Unknown';
    try {
      const u = JSON.parse(localStorage.getItem('erp_current_user') || 'null');
      if (u && u.name) user = escapeHtml(u.name);
    } catch(e) {}

    overlay.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 10px; margin-bottom: 20px;">
        <h1 style="margin: 0; font-size: 24px; text-transform: uppercase;">🔥 CRITICAL SYSTEM CRASH (${escapeHtml(type)})</h1>
        <button id="erp-debug-overlay-dismiss" style="background: rgba(0,0,0,0.5); color: white; border: 1px solid white; padding: 5px 15px; cursor: pointer; border-radius: 4px;">Dismiss (Not Recommended)</button>
      </div>

      <h2 style="margin: 0 0 10px 0; color: #fca5a5; font-size: 18px;">${escapeHtml(message)}</h2>

      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 6px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>File:</strong> ${escapeHtml(source || 'Unknown')}</p>
        <p style="margin: 5px 0;"><strong>Line:</strong> ${escapeHtml(lineno || '?')} <strong>Column:</strong> ${escapeHtml(colno || '?')}</p>
        <p style="margin: 5px 0;"><strong>Browser:</strong> ${escapeHtml(navigator.userAgent)}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
      </div>

      <h3 style="margin: 0 0 10px 0; font-size: 16px;">Stack Trace:</h3>
      <pre style="background: rgba(0,0,0,0.5); padding: 15px; border-radius: 6px; overflow-x: auto; font-size: 14px; line-height: 1.5; margin-bottom: 20px;">${stack}</pre>

      <h3 style="margin: 0 0 10px 0; font-size: 16px;">State Context:</h3>
      <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 6px;">
        <p style="margin: 5px 0;"><strong>Current Route:</strong> ${route}</p>
        <p style="margin: 5px 0;"><strong>Current User:</strong> ${user}</p>
        <p style="margin: 5px 0;"><strong>LocalStorage Keys:</strong> ${lsKeys}</p>
      </div>
    `;

    const dismissBtn = overlay.querySelector('#erp-debug-overlay-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      });
    }
  }

  window.onerror = function(message, source, lineno, colno, error) {
    // Prevent default browser console error? No, we still want it there.
    // Ensure the body exists before appending
    if (document.body) {
      renderErrorOverlay(message, source, lineno, colno, error, 'Uncaught Exception');
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        renderErrorOverlay(message, source, lineno, colno, error, 'Uncaught Exception (Pre-DOM)');
      });
    }
    return false; // let the default handler run too
  };

  window.onunhandledrejection = function(event) {
    const error = event.reason;
    const message = error ? error.message || error.toString() : 'Unknown Promise Rejection';
    
    if (document.body) {
      renderErrorOverlay(message, null, null, null, error, 'Unhandled Promise Rejection');
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        renderErrorOverlay(message, null, null, null, error, 'Unhandled Promise Rejection (Pre-DOM)');
      });
    }
  };
})();
