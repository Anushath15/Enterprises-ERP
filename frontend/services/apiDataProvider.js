/**
 * Senthil Enterprises ERP - ApiDataProvider
 * Connects directly to the FastAPI backend via centralized apiClient.
 */
import { api } from './network/apiClient.js';

export const ApiDataProvider = {
  // Initialization
  init() {
    console.log('ApiDataProvider initialized');
  },

  // Authentication
  async login(username, password) {
    return await api.post('/auth/login', { username, password });
  },
  async logout() {
    return await api.post('/auth/logout');
  },
  async getMe() {
    return await api.get('/auth/me');
  },

  // Products
  async getProducts() {
    return await api.get('/products/');
  },
  async getProductById(id) {
    return await api.get(`/products/${encodeURIComponent(id)}`);
  },
  async saveProduct(product) {
    if (product.id && !String(product.id).startsWith('PRD')) {
      return await api.put(`/products/${encodeURIComponent(product.id)}`, product);
    }
    return await api.post('/products/', product);
  },
  async deleteProduct(id) {
    return await api.delete(`/products/${encodeURIComponent(id)}`);
  },
  async updateStock(id, qtyChange) {
    // API logic handles inventory through Sales/Purchases.
    // If manual adjustment is needed, it goes through an inventory adjustment API.
    return await api.post(`/inventory/adjust`, { product_id: encodeURIComponent(id), quantity: qtyChange, reason: "Manual Adjustment" });
  },

  // Customers
  async getCustomers() {
    return await api.get('/contacts/customers/');
  },
  async getCustomerById(id) {
    return await api.get(`/contacts/customers/${encodeURIComponent(id)}`);
  },
  async saveCustomer(customer) {
    if (customer.id && !String(customer.id).startsWith('CUS')) {
      return await api.put(`/contacts/customers/${encodeURIComponent(customer.id)}`, customer);
    }
    return await api.post('/contacts/customers/', customer);
  },
  async deleteCustomer(id) {
    return await api.delete(`/contacts/customers/${encodeURIComponent(id)}`);
  },

  // Dealers
  async getDealers() {
    return await api.get('/contacts/dealers/');
  },
  async getDealerById(id) {
    return await api.get(`/contacts/dealers/${encodeURIComponent(id)}`);
  },
  async saveDealer(dealer) {
    if (dealer.id && !String(dealer.id).startsWith('DLR')) {
      return await api.put(`/contacts/dealers/${encodeURIComponent(dealer.id)}`, dealer);
    }
    return await api.post('/contacts/dealers/', dealer);
  },
  async deleteDealer(id) {
    return await api.delete(`/contacts/dealers/${encodeURIComponent(id)}`);
  },

  // Sales
  async getSalesInvoices(params = {}) {
    return await api.get('/sales/', params);
  },
  async saveSalesInvoice(invoice) {
    return await api.post('/sales/', invoice);
  },
  async getSalesReturns() {
    return []; // Future
  },

  // Purchases
  async getPurchaseInvoices(params = {}) {
    return await api.get('/purchases/', params);
  },
  async savePurchaseInvoice(invoice) {
    return await api.post('/purchases/', invoice);
  },
  async getPurchaseReturns() {
    return []; // Future
  },

  // Expenses
  async getExpenses(params = {}) {
    return await api.get('/expenses/', params);
  },
  async saveExpense(expense) {
    if (expense.id && !String(expense.id).startsWith('EXP')) {
      return await api.put(`/expenses/${encodeURIComponent(expense.id)}`, expense);
    }
    return await api.post('/expenses/', expense);
  },
  async deleteExpense(id) {
    return await api.delete(`/expenses/${encodeURIComponent(id)}`);
  },

  // Closing
  async getDailyClosings(params = {}) {
    return await api.get('/daily-closing/', params);
  },
  async submitDailyClosing(data) {
    return await api.post('/daily-closing/calculate', { business_date: data.business_date, physical_cash: data.physical_cash });
  },

  // Reports
  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const [sales, expenses] = await Promise.all([
      api.get('/reports/sales', { start_date: today, end_date: today }),
      api.get('/reports/expenses', { start_date: today, end_date: today })
    ]);
    
    const salesTotal = sales.reduce((sum, item) => sum + item.total_amount, 0);
    const expTotal = expenses.reduce((sum, item) => sum + item.total_amount, 0);
    
    return {
      todaySales: salesTotal,
      todayExpenses: expTotal,
      todayPurchases: 0 // Fetch from purchases report if needed
    };
  },

  // Notifications (Mock for now until API is ready)
  async getNotifications() {
    return [];
  },
  async createNotification(type, title, message) {
    console.log(`Notification [${type}]: ${title} - ${message}`);
  },

  // Missing placeholders
  async getDeliveries() { return []; },
  async getProjects() { return []; },
  async getStaff() { return []; },
  async getWarranties() { return []; },
  async getUsers() { return []; },
  async saveUser(user) { return user; },
  async resetUserPassword(userId, newPassword) { return true; },
  async updateCustomerBalance(id, amountChange) { return true; },
  async updateDealerBalance(id, amountChange) { return true; }
};

