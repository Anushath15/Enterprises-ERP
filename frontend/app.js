console.log('--- APP.JS EVALUATION STARTED ---');
import { NotificationService } from './services/notificationService.js';
/**
 * Senthil Enterprises ERP - Application Entry Point
 * Purpose: Initializes the SPA, loads the router, sets up global state.
 * Dependencies: router.js, store.js
 */

import { Router } from './router/router.js';
import { AppLayout, initNavbarResizeLogic } from './components/ui/designSystem.js';
import { MigrationRC3 } from './services/migration_rc3.js';
import { DataProvider } from './services/dataProvider.js';
import { BackupService } from './services/backupService.js';

const App = {
  /**
   * Initializes the application.
   * Renders the base shell (Sidebar, Navbar) and triggers the initial route.
   */
  async init() {
    // Run schema migrations first
    MigrationRC3.run();

    // Initialize Offline Data Layer
    DataProvider.init();
    
    // Daily automatic backup (once per day; boot + hourly + tab-return checks)
    BackupService.init();
    
    // Mount the Application Shell (Phase 4 Step 1 & 2)
    this.renderShell();

    // (Auth tokens intentionally not managed; V1 is purely local)

    // Initialize global keyboard shortcuts for Zero-Mouse Workflow
    this.initKeyboardShortcuts();

    // Initialize Router after shell is mounted so #page-root exists
    const appRouter = new Router('page-root');
  },

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Allow F5 and standard refresh if Ctrl/Cmd is held
      if (e.key === 'F5' && !e.ctrlKey) { e.preventDefault(); window.dispatchEvent(new CustomEvent('app:refresh')); return; }
      
      // F-Keys
      if (e.key === 'F2') { e.preventDefault(); window.location.hash = '#/products'; return; }
      if (e.key === 'F3') { e.preventDefault(); window.location.hash = '#/customers'; return; }
      if (e.key === 'F4') { e.preventDefault(); window.location.hash = '#/dealers'; return; }
      if (e.key === 'F6') { e.preventDefault(); window.location.hash = '#/pos'; return; }
      if (e.key === 'F7') { e.preventDefault(); window.dispatchEvent(new CustomEvent('pos:hold-bill')); return; }
      if (e.key === 'F8') { e.preventDefault(); window.dispatchEvent(new CustomEvent('pos:recall-bill')); return; }
      if (e.key === 'F9') { e.preventDefault(); window.dispatchEvent(new CustomEvent('pos:payment')); return; }
      if (e.key === 'F10') { e.preventDefault(); window.dispatchEvent(new CustomEvent('app:print')); return; }
      
      // Action Keys
      if (e.ctrlKey && e.key.toLowerCase() === 's') { 
        e.preventDefault(); 
        window.dispatchEvent(new CustomEvent('app:save')); 
        const saveBtn = document.querySelector('button[id^="save-"], button[id*="-save-"], button[id$="-save"], button[id="btn-save-po"]');
        if (saveBtn) saveBtn.click();
        else NotificationService.info('No save action available here.');
        return; 
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'p') { 
        const printBtn = document.querySelector('button[id^="print-"], button[id*="-print"], .print-btn');
        if (printBtn) {
          e.preventDefault(); 
          window.dispatchEvent(new CustomEvent('app:print')); 
          printBtn.click();
        }
        return; 
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'n') { e.preventDefault(); window.dispatchEvent(new CustomEvent('app:new')); return; }
      if (e.ctrlKey && e.key === 'Enter') { 
        e.preventDefault(); 
        window.dispatchEvent(new CustomEvent('app:save')); 
        const saveBtn = document.querySelector('button[id^="save-"], button[id*="-save-"], button[id$="-save"], button[id="btn-save-po"]');
        if (saveBtn) saveBtn.click();
        return; 
      }
      
      if (e.key === 'Escape') {
        // Dispatch global escape for modals/drawers
        window.dispatchEvent(new CustomEvent('app:escape'));
      }

      // Enter -> Next Field, Shift+Enter -> Prev Field
      if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
          // If it's the POS search bar, don't jump, let the POS engine handle it
          if (e.target.id === 'pos-search' || e.target.id === 'inv-search' || e.target.id === 'prod-search') return;
          
          e.preventDefault();
          const focusable = Array.from(document.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'))
                                 .filter(el => el.tabIndex !== -1 && el.offsetParent !== null);
          const idx = focusable.indexOf(e.target);
          if (idx > -1 && idx < focusable.length - 1) focusable[idx + 1].focus();
        }
      }
      if (e.key === 'Enter' && e.shiftKey) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
          e.preventDefault();
          const focusable = Array.from(document.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'))
                                 .filter(el => el.tabIndex !== -1 && el.offsetParent !== null);
          const idx = focusable.indexOf(e.target);
          if (idx > 0) focusable[idx - 1].focus();
        }
      }
    });
  },

  sidebarLinks: [
    { path: '#/', label: 'Dashboard', icon: '<i data-lucide="layout-dashboard" class="w-5 h-5"></i>', roles: ['admin', 'manager', 'user'] },
    { path: '#/pos', label: 'POS Billing', icon: '<i data-lucide="shopping-cart" class="w-5 h-5"></i>', roles: ['admin', 'manager', 'user'] },
    { path: '#/sales', label: 'Sales Register', icon: '<i data-lucide="file-text" class="w-5 h-5"></i>', roles: ['admin', 'manager', 'user'] },
    { path: '#/purchases', label: 'Purchases', icon: '<i data-lucide="shopping-bag" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/inventory', label: 'Inventory', icon: '<i data-lucide="bar-chart-2" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/products', label: 'Products', icon: '<i data-lucide="package" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/categories', label: 'Categories', icon: '<i data-lucide="folder" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/stock-adjustments', label: 'Stock Adj.', icon: '<i data-lucide="sliders" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/customers', label: 'Customers', icon: '<i data-lucide="users" class="w-5 h-5"></i>', roles: ['admin', 'manager', 'user'] },
    { path: '#/dealers', label: 'Dealers', icon: '<i data-lucide="building-2" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/delivery', label: 'Delivery', icon: '<i data-lucide="truck" class="w-5 h-5"></i>', roles: ['admin', 'manager', 'user'] },
    { path: '#/sales-returns', label: 'Sales Returns', icon: '<i data-lucide="corner-up-left" class="w-5 h-5"></i>', roles: ['admin', 'manager', 'user'] },
    { path: '#/purchase-returns', label: 'Purchase Returns', icon: '<i data-lucide="corner-down-right" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/warranty', label: 'Warranty', icon: '<i data-lucide="shield-check" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/expenses', label: 'Expenses', icon: '<i data-lucide="receipt" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/house-projects', label: 'House Projects', icon: '<i data-lucide="home" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/reports', label: 'Reports', icon: '<i data-lucide="bar-chart-2" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/daily-closing', label: 'Daily Closing', icon: '<i data-lucide="calendar-check" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/credit-management', label: 'Credit', icon: '<i data-lucide="credit-card" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/users', label: 'Users', icon: '<i data-lucide="user-cog" class="w-5 h-5"></i>', roles: ['admin'] },
    { path: '#/staff', label: 'Staff', icon: '<i data-lucide="user-circle" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/settings', label: 'Settings', icon: '<i data-lucide="settings" class="w-5 h-5"></i>', roles: ['admin'] },
    { path: '#/export-center', label: 'Export Center', icon: '<i data-lucide="database" class="w-5 h-5"></i>', roles: ['admin', 'manager'] },
    { path: '#/database-maintenance', label: 'DB Maintenance', icon: '<i data-lucide="wrench" class="w-5 h-5"></i>', roles: ['admin'] }
  ],

  /**
   * Mounts the static shell components using the new Global Design System.
   */
  renderShell() {
    const appRoot = document.getElementById('app-root');
    const user = this.shellUser();
    const allowedLinks = this.sidebarLinks;

    appRoot.innerHTML = AppLayout({
      sidebarLinks: allowedLinks,
      currentRoute: window.location.hash || '#/',
      user
    });

    // Initialize layout behavior
    initNavbarResizeLogic();
    // Re-initialize icons since new DOM elements were added
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  shellUser() {
    return { name: 'Senthil Enterprises', roleLabel: 'Local ERP', initials: 'SE' };
  },

};

// Boot the application
const bootApp = () => {
  App.init();

  // Global Logout has been removed.

  // Setup Global Toast Notification System
  window.showToast = (message, type = 'info') => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-4 right-4 z-[9999] flex flex-col gap-2';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    const colors = {
      info: 'bg-blue-50 border-blue-200 text-blue-700',
      success: 'bg-green-50 border-green-200 text-green-700',
      warning: 'bg-orange-50 border-orange-200 text-orange-700',
      danger: 'bg-red-50 border-red-200 text-red-700'
    };
    
    toast.className = `px-4 py-3 rounded-lg border shadow-lg flex items-center gap-3 transition-all duration-300 transform translate-y-4 opacity-0 ${colors[type] || colors.info}`;
    toast.innerHTML = `<span class="text-sm font-medium"></span>`;
    toast.querySelector('span').textContent = message;
    
    container.appendChild(toast);
    
    // Animate In
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });
    
    // Animate Out
    setTimeout(() => {
      toast.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  };

};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}
