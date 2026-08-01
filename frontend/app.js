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
import { AuthService } from './services/authService.js';

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

    // Listen for session lifecycle changes
    window.addEventListener('auth:changed', () => this.applyAuthToShell());
    window.addEventListener('auth:logout', () => AuthService.logout());

    // Initialize Router after shell is mounted so #page-root exists
    const appRouter = new Router('page-root');
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
    { path: '#/settings', label: 'Settings', icon: '<i data-lucide="settings" class="w-5 h-5"></i>', roles: ['admin'] }
  ],

  /**
   * Mounts the static shell components using the new Global Design System.
   */
  renderShell() {
    const appRoot = document.getElementById('app-root');
    const user = this.shellUser();
    const allowedLinks = this.sidebarLinks.filter(l => AuthService.hasRole(l.roles));

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
    const user = AuthService.getCurrentUser();
    if (!user) {
      return { name: 'User', roleLabel: '', initials: 'U' };
    }
    const name = user.name || user.username || 'User';
    const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
    return { name, roleLabel: AuthService.roleLabel(user.role), initials };
  },

  applyAuthToShell() {
    const user = this.shellUser();
    const allowedLinks = this.sidebarLinks.filter(l => AuthService.hasRole(l.roles));

    const nav = document.querySelector('#sidebar-manager nav');
    if (nav) {
      nav.innerHTML = allowedLinks.map(link => {
        const isActive = link.path === (window.location.hash || '#/');
        const activeClass = isActive ? 'active text-primary bg-blue-50' : 'text-gray-500 hover:text-text hover:bg-gray-50';
        const iconClass = isActive ? 'text-primary' : 'text-gray-400';
        return `
          <a href="${link.path}" data-route="${link.path}" class="sidebar-link ${activeClass} flex items-center px-3 py-2.5 mb-1 rounded-lg text-sm font-medium transition-colors">
            <div class="w-5 h-5 mr-3 ${iconClass} flex-shrink-0">${link.icon}</div>
            <span class="sidebar-label whitespace-nowrap overflow-hidden text-ellipsis">${link.label}</span>
          </a>
        `;
      }).join('');
    }

    const userArea = document.getElementById('navbar-user-area');
    if (userArea) {
      userArea.innerHTML = `
        <button data-logout-btn class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-danger hover:bg-danger/5 transition-colors" title="Log out">
          <i data-lucide="log-out" class="w-4 h-4"></i>
          <span class="hidden sm:inline">Log out</span>
        </button>
        <div class="flex items-center gap-3 pl-3 border-l border-border">
          <div class="text-right hidden md:block">
            <p class="text-sm font-medium text-text leading-tight">${user.name}</p>
            <p class="text-[11px] text-gray-400">${user.roleLabel}</p>
          </div>
          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <span class="text-xs font-semibold text-primary">${user.initials}</span>
          </div>
        </div>
      `;
    }

    if (window.lucide) {
      window.lucide.createIcons({ nodes: [document.getElementById('top-navbar')] });
    }
  }
};

// Boot the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();

  // Global Logout (delegated so it survives shell re-renders)
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-logout-btn]')) {
      AuthService.logout();
    }
  });

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
