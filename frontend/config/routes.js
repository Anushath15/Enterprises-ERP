/**
 * Senthil Enterprises ERP - Route Configuration
 * Centralized definition of all application routes.
 */

export const routes = [
  {
    path: '/',
    name: 'Dashboard',
    componentPath: '../pages/dashboard.js',
  },
  {
    path: '/pos',
    name: 'Point of Sale',
    componentPath: '../pages/pos.js',
  },
  {
    path: '/quotations',
    name: 'Quotations',
    componentPath: '../pages/quotations.js',
  },
  {
    path: '/sales',
    name: 'Sales',
    componentPath: '../pages/sales.js',
  },
  {
    path: '/inventory',
    name: 'Inventory',
    componentPath: '../pages/inventory.js',
  },
  {
    path: '/products',
    name: 'Products',
    componentPath: '../pages/products.js',
  },
  {
    path: '/categories',
    name: 'Categories',
    componentPath: '../pages/categories.js',
  },
  {
    path: '/stock-adjustments',
    name: 'Stock Adjustments',
    componentPath: '../pages/stock_adjustments.js',
  },
  {
    path: '/customers',
    name: 'Customers',
    componentPath: '../pages/customers.js',
  },
  {
    path: '/purchases',
    name: 'Purchases',
    componentPath: '../pages/purchases/index.js',
  },
  {
    path: '/purchases/new',
    name: 'New Purchase Order',
    componentPath: '../pages/purchases/new.js',
  },
  {
    path: '/sales/new',
    name: 'New Sales Invoice',
    componentPath: '../pages/sales/new.js',
  },
  {
    path: '/dealers',
    name: 'Dealers',
    componentPath: '../pages/dealers.js',
  },
  {
    path: '/sales-returns',
    name: 'Sales Returns',
    componentPath: '../pages/sales_return.js',
  },
  {
    path: '/purchase-returns',
    name: 'Purchase Returns',
    componentPath: '../pages/purchase_return.js',
  },
  {
    path: '/credit-management',
    name: 'Credit Management',
    componentPath: '../pages/credit_management.js',
  },
  {
    path: '/daily-closing',
    name: 'Daily Closing',
    componentPath: '../pages/daily_closing.js',
  },
  {
    path: '/expenses',
    name: 'Expenses',
    componentPath: '../pages/expenses.js',
  },
  {
    path: '/delivery',
    name: 'Delivery',
    componentPath: '../pages/delivery.js',
  },
  {
    path: '/reports',
    name: 'Reports',
    componentPath: '../pages/reports.js',
  },
  {
    path: '/staff',
    name: 'Staff Management',
    componentPath: '../pages/staff.js',
  },
  {
    path: '/house-projects',
    name: 'House Projects',
    componentPath: '../pages/house_projects.js',
  },
  {
    path: '/warranty',
    name: 'Warranty Management',
    componentPath: '../pages/warranty.js',
  },
  {
    path: '/users',
    name: 'User Management',
    componentPath: '../pages/users.js',
  },
  {
    path: '/settings',
    name: 'Settings',
    componentPath: '../pages/settings.js',
  },
  {
    path: '/onboarding-stock',
    name: 'Opening Stock',
    componentPath: '../pages/wizard_stock.js',
  },
  {
    path: '/onboarding-balances',
    name: 'Opening Balances',
    componentPath: '../pages/wizard_balances.js',
  },
  {
    path: '/notifications',
    name: 'Notifications',
    componentPath: '../pages/notifications.js',
  },
  {
    path: '/profile',
    name: 'Profile',
    componentPath: '../pages/profile.js',
  },
  {
    path: '/about',
    name: 'About',
    componentPath: '../pages/about.js',
  },
  {
    path: '/help',
    name: 'Help',
    componentPath: '../pages/help.js',
  },
  {
    path: '/403',
    name: 'Access Denied',
    componentPath: '../pages/403.js',
  },
  {
    path: '/404',
    name: 'NotFound',
    componentPath: '../pages/404.js',
  },
  {
    path: '/export-center',
    name: 'Export Center',
    componentPath: '../pages/export_center.js',
  },
  {
    path: '/database-maintenance',
    name: 'Database Maintenance',
    componentPath: '../pages/database_maintenance.js',
  }
];

export const defaultRoute = '/';
export const errorRoute = '/404';

