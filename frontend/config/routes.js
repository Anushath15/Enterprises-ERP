/**
 * Senthil Enterprises ERP - Route Configuration
 * Centralized definition of all application routes.
 */

export const routes = [
  {
    path: '/',
    name: 'Dashboard',
    componentPath: '../pages/dashboard.js',
    authRequired: true,
    roles: ['admin', 'manager', 'user']
  },
  {
    path: '/pos',
    name: 'Point of Sale',
    componentPath: '../pages/pos.js',
    authRequired: true,
    roles: ['admin', 'manager', 'user']
  },
  {
    path: '/sales',
    name: 'Sales',
    componentPath: '../pages/sales.js',
    authRequired: true,
    roles: ['admin', 'manager', 'user']
  },
  {
    path: '/inventory',
    name: 'Inventory',
    componentPath: '../pages/inventory.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/categories',
    name: 'Categories',
    componentPath: '../pages/categories.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/stock-adjustments',
    name: 'Stock Adjustments',
    componentPath: '../pages/stock_adjustments.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/customers',
    name: 'Customers',
    componentPath: '../pages/customers.js',
    authRequired: true,
    roles: ['admin', 'manager', 'user']
  },
  {
    path: '/purchases',
    name: 'Purchases',
    componentPath: '../pages/purchases.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/dealers',
    name: 'Dealers',
    componentPath: '../pages/dealers.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/sales-returns',
    name: 'Sales Returns',
    componentPath: '../pages/sales_return.js',
    authRequired: true,
    roles: ['admin', 'manager', 'user']
  },
  {
    path: '/purchase-returns',
    name: 'Purchase Returns',
    componentPath: '../pages/purchase_return.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/credit-management',
    name: 'Credit Management',
    componentPath: '../pages/credit_management.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/daily-closing',
    name: 'Daily Closing',
    componentPath: '../pages/daily_closing.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/expenses',
    name: 'Expenses',
    componentPath: '../pages/expenses.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/delivery',
    name: 'Delivery',
    componentPath: '../pages/delivery.js',
    authRequired: true,
    roles: ['admin', 'manager', 'user']
  },
  {
    path: '/reports',
    name: 'Reports',
    componentPath: '../pages/reports.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/staff',
    name: 'Staff Management',
    componentPath: '../pages/staff.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/house-projects',
    name: 'House Projects',
    componentPath: '../pages/house_projects.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/warranty',
    name: 'Warranty Management',
    componentPath: '../pages/warranty.js',
    authRequired: true,
    roles: ['admin', 'manager']
  },
  {
    path: '/users',
    name: 'User Management',
    componentPath: '../pages/users.js',
    authRequired: true,
    roles: ['admin']
  },
  {
    path: '/settings',
    name: 'Settings',
    componentPath: '../pages/settings.js',
    authRequired: true,
    roles: ['admin']
  },
  {
    path: '/onboarding-stock',
    name: 'Opening Stock',
    componentPath: '../pages/wizard_stock.js',
    authRequired: true,
    roles: ['admin']
  },
  {
    path: '/onboarding-balances',
    name: 'Opening Balances',
    componentPath: '../pages/wizard_balances.js',
    authRequired: true,
    roles: ['admin']
  },
  {
    path: '/notifications',
    name: 'Notifications',
    componentPath: '../pages/notifications.js',
    authRequired: true,
    roles: ['admin', 'manager', 'user']
  },
  {
    path: '/profile',
    name: 'Profile',
    componentPath: '../pages/profile.js',
    authRequired: true,
    roles: ['admin', 'manager', 'user']
  },
  {
    path: '/about',
    name: 'About',
    componentPath: '../pages/about.js',
    authRequired: true,
    roles: ['admin', 'manager', 'user']
  },
  {
    path: '/help',
    name: 'Help',
    componentPath: '../pages/help.js',
    authRequired: true,
    roles: ['admin', 'manager', 'user']
  },
  {
    path: '/login',
    name: 'Login',
    componentPath: '../pages/login.js',
    authRequired: false,
    roles: []
  },
  {
    path: '/404',
    name: 'NotFound',
    componentPath: '../pages/404.js',
    authRequired: false,
    roles: []
  }
];

export const defaultRoute = '/';
export const errorRoute = '/404';
export const loginRoute = '/login';

