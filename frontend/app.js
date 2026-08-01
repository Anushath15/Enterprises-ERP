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
    
    // Mount the Application Shell (Phase 4 Step 1 & 2)
    this.renderShell();

    // Initialize Router after shell is mounted so #page-root exists
    const appRouter = new Router('page-root');
  },

  /**
   * Mounts the static shell components using the new Global Design System.
   */
  renderShell() {
    const appRoot = document.getElementById('app-root');

    const sidebarLinks = [
      { path: '#/', label: 'Dashboard', icon: '<i data-lucide="layout-dashboard" class="w-5 h-5"></i>' },
      { path: '#/pos', label: 'POS Billing', icon: '<i data-lucide="shopping-cart" class="w-5 h-5"></i>' },
      { path: '#/sales', label: 'Sales Register', icon: '<i data-lucide="file-text" class="w-5 h-5"></i>' },
      { path: '#/purchases', label: 'Purchases', icon: '<i data-lucide="shopping-bag" class="w-5 h-5"></i>' },
      { path: '#/inventory', label: 'Inventory', icon: '<i data-lucide="bar-chart-2" class="w-5 h-5"></i>' },
      { path: '#/products', label: 'Products', icon: '<i data-lucide="package" class="w-5 h-5"></i>' },
      { path: '#/categories', label: 'Categories', icon: '<i data-lucide="folder" class="w-5 h-5"></i>' },
      { path: '#/stock-adjustments', label: 'Stock Adj.', icon: '<i data-lucide="sliders" class="w-5 h-5"></i>' },
      { path: '#/customers', label: 'Customers', icon: '<i data-lucide="users" class="w-5 h-5"></i>' },
      { path: '#/dealers', label: 'Dealers', icon: '<i data-lucide="building-2" class="w-5 h-5"></i>' },
      { path: '#/delivery', label: 'Delivery', icon: '<i data-lucide="truck" class="w-5 h-5"></i>' },
      { path: '#/sales-returns', label: 'Sales Returns', icon: '<i data-lucide="corner-up-left" class="w-5 h-5"></i>' },
      { path: '#/purchase-returns', label: 'Purchase Returns', icon: '<i data-lucide="corner-down-right" class="w-5 h-5"></i>' },
      { path: '#/warranty', label: 'Warranty', icon: '<i data-lucide="shield-check" class="w-5 h-5"></i>' },
      { path: '#/expenses', label: 'Expenses', icon: '<i data-lucide="receipt" class="w-5 h-5"></i>' },
      { path: '#/house-projects', label: 'House Projects', icon: '<i data-lucide="home" class="w-5 h-5"></i>' },
      { path: '#/reports', label: 'Reports', icon: '<i data-lucide="bar-chart-2" class="w-5 h-5"></i>' },
      { path: '#/daily-closing', label: 'Daily Closing', icon: '<i data-lucide="calendar-check" class="w-5 h-5"></i>' },
      { path: '#/credit-management', label: 'Credit', icon: '<i data-lucide="credit-card" class="w-5 h-5"></i>' },
      { path: '#/users', label: 'Users', icon: '<i data-lucide="user-cog" class="w-5 h-5"></i>' },
      { path: '#/staff', label: 'Staff', icon: '<i data-lucide="user-circle" class="w-5 h-5"></i>' },
      { path: '#/settings', label: 'Settings', icon: '<i data-lucide="settings" class="w-5 h-5"></i>' }
    ];

    appRoot.innerHTML = AppLayout({
      sidebarLinks,
      currentRoute: window.location.hash || '#/',
      user: { initials: 'SK', name: 'Senthil Kumar', role: 'Admin' }
    });

    // Initialize layout behavior
    initNavbarResizeLogic();
    // Re-initialize icons since new DOM elements were added
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
};

// Boot the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();

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
    toast.innerHTML = `<span class="text-sm font-medium">${message}</span>`;
    
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

  // Global Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F4') { e.preventDefault(); window.location.hash = '#/purchases'; }
    if (e.key === 'F6') { e.preventDefault(); window.location.hash = '#/settings'; }
    
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      // Find a button that looks like a save button and click it
      const saveBtn = document.querySelector('button[id^="save-"], button[id*="-save-"], button[id$="-save"], button[id="btn-save-po"]');
      if (saveBtn) saveBtn.click();
      else NotificationService.info();
    }
    
    if (e.ctrlKey && e.key === 'p') {
      // Browsers handle Ctrl+P natively, but we can override it if a specific print button exists
      const printBtn = document.querySelector('button[id^="print-"], button[id*="-print"], .print-btn');
      if (printBtn) {
        e.preventDefault();
        printBtn.click();
      }
    }
  });
});

