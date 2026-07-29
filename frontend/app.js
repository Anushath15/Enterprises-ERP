/**
 * Senthil Enterprises ERP - Application Entry Point
 * Purpose: Initializes the SPA, loads the router, sets up global state.
 * Dependencies: router.js, store.js
 */

import { Router } from './router/router.js';
import { Sidebar, Navbar } from './components/layout/layout.js';
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
    
    // Future Phase: Load global state (store.js)
    // The injection points defined in Phase 2 are in index.html.
    // The router will target #page-root for dynamic page loading.
    const appRouter = new Router('page-root');
    
    this.renderShell();
  },

  /**
   * Mounts the static shell components.
   * In Phase 3, this will call the Sidebar and Navbar component constructors.
   */
  renderShell() {
    const sidebarRoot = document.getElementById('sidebar-root');
    const navbarRoot = document.getElementById('navbar-root');
    const pageRoot = document.getElementById('page-root');

    // Load the Sidebar and Navbar from our component library
    sidebarRoot.innerHTML = Sidebar({ 
      links: [
        { path: '#/', label: 'Dashboard', icon: '<i data-lucide="layout-dashboard" class="w-5 h-5"></i>' },
        { path: '#/pos', label: 'POS Billing', icon: '<i data-lucide="shopping-cart" class="w-5 h-5"></i>' },
        { path: '#/sales', label: 'Sales Register', icon: '<i data-lucide="file-text" class="w-5 h-5"></i>' },
        { path: '#/purchases', label: 'Purchases', icon: '<i data-lucide="shopping-bag" class="w-5 h-5"></i>' },
        { path: '#/inventory', label: 'Products', icon: '<i data-lucide="package" class="w-5 h-5"></i>' },
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
      ],
      currentRoute: window.location.hash || '#/'
    });

    navbarRoot.innerHTML = Navbar({ 
      title: 'Dashboard', 
      userInitials: 'SK', 
      userName: 'Senthil Kumar', 
      role: 'Admin' 
    });

    // The router handles pageRoot.innerHTML

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
});

