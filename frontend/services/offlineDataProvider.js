/**
 * Senthil Enterprises ERP - Data Service
 * Central business logic service and single source of truth.
 */
import { LocalStorageService } from './storage/localStorageService.js';
import { SeedData } from '../data/seedData.js';

export const OfflineDataProvider = {
  
  // ==========================================
  // INITIALIZATION & METADATA
  // ==========================================
  init() {
    if (!LocalStorageService.has('erp_system_state')) {
      console.log('Initializing ERP Data for the first time...');
      Object.keys(SeedData).forEach(key => {
        LocalStorageService.set(key, SeedData[key]);
      });
    }
  },
  
  generateId(prefix) {
    const state = LocalStorageService.get('erp_system_state') || {};
    let counterKey = `last${prefix}Number`;
    if (state[counterKey] === undefined) {
      state[counterKey] = 0;
    }
    state[counterKey]++;
    LocalStorageService.set('erp_system_state', state);
    
    // For transactional items use Date prefix
    const needsDate = ['SAL', 'PUR', 'SRT', 'PRT', 'DEL', 'EXP', 'WAR'].includes(prefix);
    
    const countStr = String(state[counterKey]).padStart(6, '0');
    
    if (needsDate) {
      const d = new Date();
      const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
      return `${prefix}-${dateStr}-${countStr}`;
    }
    
    return `${prefix}-${countStr}`;
  },
  
  getBaseMetadata() {
    return {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'USR-01', // Placeholder admin
      updatedBy: 'USR-01',
      isDeleted: false,
      version: 1
    };
  },
  
  getUpdateMetadata(entity) {
    return {
      updatedAt: new Date().toISOString(),
      updatedBy: 'USR-01',
      version: (entity.version || 1) + 1
    };
  },

  // ==========================================
  // AUTHENTICATION (Mock)
  // ==========================================
  async login(username, password) {
    return {
      access_token: "mock-offline-token",
      user: {
        id: 1,
        username: username,
        role: "Admin",
        permissions: ["products.read", "products.write", "sales.create"]
      }
    };
  },
  async logout() {
    return true;
  },
  async getMe() {
    return { id: 1, username: "admin", role: "Admin", permissions: [] };
  },

  // ==========================================
  // GENERIC CRUD HELPERS
  // ==========================================
  _getAll(collectionKey) {
    const data = LocalStorageService.get(collectionKey) || [];
    return data.filter(item => !item.isDeleted);
  },

  _getById(collectionKey, id) {
    const data = this._getAll(collectionKey);
    return data.find(item => item.id === id) || null;
  },

  _save(collectionKey, entity, prefix) {
    const data = LocalStorageService.get(collectionKey) || [];
    
    if (!entity.id) {
      entity.id = this.generateId(prefix);
      entity = { ...entity, ...this.getBaseMetadata() };
      data.push(entity);
    } else {
      const index = data.findIndex(item => item.id === entity.id);
      if (index !== -1) {
        entity = { ...data[index], ...entity, ...this.getUpdateMetadata(data[index]) };
        data[index] = entity;
      }
    }
    
    LocalStorageService.set(collectionKey, data);
    return entity;
  },

  _softDelete(collectionKey, id) {
    const data = LocalStorageService.get(collectionKey) || [];
    const index = data.findIndex(item => item.id === id);
    if (index !== -1) {
      data[index].isDeleted = true;
      data[index] = { ...data[index], ...this.getUpdateMetadata(data[index]) };
      LocalStorageService.set(collectionKey, data);
      return true;
    }
    return false;
  },

  // ==========================================
  // PRODUCTS
  // ==========================================
  getProducts() {
    return this._getAll('erp_products');
  },
  getProductById(id) {
    return this._getById('erp_products', id);
  },
  saveProduct(product) {
    product.price = Number(product.price || 0);
    product.stock = Number(product.stock || 0);
    product.minStock = Number(product.minStock || 0);
    
    if (product.stock < 0) {
      throw new Error('Stock cannot be negative.');
    }

    const existing = this.getProducts();
    if (!product.id && product.sku && existing.some(p => p.sku === product.sku)) {
      throw new Error('Product with this SKU already exists.');
    }
    
    if (product.stock === 0) {
      product.status = 'Out of Stock';
      product.statusBadge = 'danger';
    } else if (product.stock <= product.minStock) {
      product.status = 'Low Stock';
      product.statusBadge = 'warning';
    } else {
      product.status = 'In Stock';
      product.statusBadge = 'success';
    }

    return this._save('erp_products', product, 'PRD');
  },
  deleteProduct(id) {
    return this._softDelete('erp_products', id);
  },
  updateStock(id, qtyChange) {
    const product = this.getProductById(id);
    if (product) {
      product.stock += Number(qtyChange);
      this.saveProduct(product); // will trigger status badge updates
      
      // trigger notification if low stock
      if (product.stock <= product.minStock && product.stock > 0) {
        this.createNotification('warning', 'Low Stock Alert', `${product.name} is running low (${product.stock} left).`);
      }
    }
  },

  // ==========================================
  // CUSTOMERS
  // ==========================================
  getCustomers() {
    return this._getAll('erp_customers');
  },
  getCustomerById(id) {
    return this._getById('erp_customers', id);
  },
  saveCustomer(customer) {
    const existing = this.getCustomers();
    if (!customer.id && existing.some(c => c.name.toLowerCase() === customer.name.toLowerCase())) {
      throw new Error('Customer with this name already exists.');
    }
    customer.creditLimit = Number(customer.creditLimit || 0);
    customer.outstanding = Number(customer.outstanding || 0);
    return this._save('erp_customers', customer, 'CUS');
  },
  deleteCustomer(id) {
    return this._softDelete('erp_customers', id);
  },
  updateCustomerBalance(id, amountChange) {
    const customer = this.getCustomerById(id);
    if (customer) {
      customer.outstanding = (customer.outstanding || 0) + Number(amountChange);
      this.saveCustomer(customer);
    }
  },

  // ==========================================
  // DEALERS & PURCHASES
  // ==========================================
  getDealers() {
    return this._getAll('erp_dealers');
  },
  getDealerById(id) {
    return this.getDealers().find(d => d.id === id);
  },
  saveDealer(dealer) {
    return this._save('erp_dealers', dealer, 'DLR');
  },
  deleteDealer(id) {
    return this._softDelete('erp_dealers', id);
  },
  updateDealerBalance(id, amountChange) {
    const dealer = this.getDealerById(id);
    if (dealer) {
      dealer.outstanding = (dealer.outstanding || 0) + Number(amountChange);
      this.saveDealer(dealer);
    }
  },
  getPurchaseInvoices() {
    return this._getAll('erp_purchases');
  },
  savePurchaseInvoice(invoice) {
    if (!invoice.items || invoice.items.length === 0) {
      throw new Error('Cannot save an empty purchase invoice.');
    }
    const saved = this._save('erp_purchases', invoice, 'PUR');
    
    // Increase inventory and update costs
    invoice.items.forEach(item => {
      const product = this.getProductById(item.productId);
      if (product) {
        const currentStock = Number(product.stock || 0);
        const currentCost = Number(product.avgCost || product.buyingPrice || 0);
        const newQty = Number(item.qty);
        const newPrice = Number(item.costPrice || item.price || 0);
        
        if (currentStock + newQty > 0) {
           const totalValue = (currentStock * currentCost) + (newQty * newPrice);
           product.avgCost = parseFloat((totalValue / (currentStock + newQty)).toFixed(2));
        }
        product.buyingPrice = newPrice;
        product.lastPurchaseDate = new Date().toISOString().split('T')[0];
        product.supplier = invoice.dealerName || product.supplier;
        
        this.saveProduct(product);
        this.updateStock(item.productId, newQty);
      }
    });
    
    // Update dealer outstanding if credit
    if (invoice.paymentStatus !== 'Paid Full' && invoice.dealerId) {
      const total = Number(invoice.totalAmount || invoice.total || 0);
      const amountDue = total - Number(invoice.amountPaid || 0);
      if (amountDue > 0) {
        this.updateDealerBalance(invoice.dealerId, amountDue);
      }
    }
    
    if (invoice.dealerId) {
      const dealer = this.getDealerById(invoice.dealerId);
      if (dealer) {
        dealer.lastPurchaseDate = new Date().toISOString().split('T')[0];
        this.saveDealer(dealer);
      }
    }
    return saved;
  },
  getPurchaseReturns() {
    return this._getAll('erp_purchase_returns');
  },
  getSalesReturns() {
    return this._getAll('erp_sales_returns');
  },
  getSalesInvoices() {
    return this._getAll('erp_sales_invoices');
  },
  saveSalesInvoice(invoice) {
    // Basic validation
    if (!invoice.items || invoice.items.length === 0) {
      throw new Error('Cannot save an empty invoice.');
    }
    
    // Save invoice
    const savedInvoice = this._save('erp_sales_invoices', invoice, 'SAL');
    
    // Decrease inventory
    invoice.items.forEach(item => {
      this.updateStock(item.productId, -Number(item.qty));
      const product = this.getProductById(item.productId);
      if (product) {
        product.lastSaleDate = new Date().toISOString().split('T')[0];
        this.saveProduct(product);
      }
    });
    
    // House Project integration
    if (invoice.projectId) {
      const projects = this._getAll('erp_house_projects');
      const project = projects.find(p => p.id === invoice.projectId);
      if (project) {
        if (!project.invoices) project.invoices = [];
        project.invoices.push(savedInvoice.id);
        
        const total = Number(invoice.totalAmount || invoice.total || 0);
        project.outstanding = (Number(project.outstanding) || 0) + total;
        this._save('erp_house_projects', project, 'PRJ');
      }
    }
    
    // Update customer outstanding if credit payment
    if (invoice.paymentStatus !== 'Paid Full' && invoice.customerId) {
      const total = Number(invoice.totalAmount || invoice.total || 0);
      const amountDue = total - Number(invoice.amountPaid || 0);
      if (amountDue > 0) {
        this.updateCustomerBalance(invoice.customerId, amountDue);
      }
    }
    
    // Update Customer last purchase date
    if (invoice.customerId) {
      const customer = this.getCustomerById(invoice.customerId);
      if (customer) {
        customer.lastPurchaseDate = new Date().toISOString().split('T')[0];
        this.saveCustomer(customer);
      }
    }
    
    return savedInvoice;
  },
  getExpenses() {
    return this._getAll('erp_expenses');
  },
  saveExpense(expense) {
    return this._save('erp_expenses', expense, 'EXP');
  },
  deleteExpense(id) {
    return this._softDelete('erp_expenses', id);
  },
  getDeliveries() {
    return this._getAll('erp_deliveries');
  },
  saveDelivery(delivery) {
    const saved = this._save('erp_deliveries', delivery, 'DEL');
    
    // Fix DEL-003: Update sales invoice delivery status if linked and completed
    if (saved.status === 'Completed' && saved.invoice) {
      const invoices = this._getAll('erp_sales_invoices');
      const invoice = invoices.find(i => i.id === saved.invoice);
      if (invoice && invoice.deliveryStatus !== 'Delivered') {
        invoice.deliveryStatus = 'Delivered';
        this._save('erp_sales_invoices', invoice, 'SAL');
      }
    }
    
    return saved;
  },
  deleteDelivery(id) {
    return this._softDelete('erp_deliveries', id);
  },
  getProjects() {
    return this._getAll('erp_projects');
  },
  saveProject(project) {
    return this._save('erp_projects', project, 'PRJ');
  },
  deleteProject(id) {
    return this._softDelete('erp_projects', id);
  },
  getStaff() {
    return this._getAll('erp_staff');
  },
  saveStaff(staff) {
    return this._save('erp_staff', staff, 'EMP');
  },
  deleteStaff(id) {
    return this._softDelete('erp_staff', id);
  },
  getWarranties() {
    return this._getAll('erp_warranties');
  },
  saveWarranty(warranty) {
    return this._save('erp_warranties', warranty, 'WAR');
  },
  deleteWarranty(id) {
    return this._softDelete('erp_warranties', id);
  },
  getUsers() {
    return this._getAll('erp_users');
  },
  saveUser(user) {
    return this._save('erp_users', user, 'USR');
  },
  saveSalesReturn(ret) {
    if (!ret.items || ret.items.length === 0) {
      throw new Error('Cannot save an empty sales return.');
    }
    const saved = this._save('erp_sales_returns', ret, 'SRT');
    // Reverse inventory: returned items go back to stock
    (ret.items || []).forEach(item => {
      this.updateStock(item.productId, Number(item.qty));
    });
    // Reduce customer outstanding if it was a credit sale
    if (ret.customerId && ret.amount > 0) {
      this.updateCustomerBalance(ret.customerId, -Number(ret.amount));
    }
    return saved;
  },
  savePurchaseReturn(ret) {
    if (!ret.items || ret.items.length === 0) {
      throw new Error('Cannot save an empty purchase return.');
    }
    const saved = this._save('erp_purchase_returns', ret, 'PRT');
    // Reverse inventory: returned items leave stock
    (ret.items || []).forEach(item => {
      this.updateStock(item.productId, -Number(item.qty));
    });
    // Reduce dealer outstanding if applicable
    if (ret.dealerId && ret.amount > 0) {
      this.updateDealerBalance(ret.dealerId, -Number(ret.amount));
    }
    return saved;
  },

  // ==========================================
  // NOTIFICATIONS (Helper)
  // ==========================================
  getNotifications() {
    return this._getAll('erp_notifications');
  },
  createNotification(type, title, message) {
    const notif = { type, title, message, time: new Date().toISOString(), read: false };
    this._save('erp_notifications', notif, 'NOT');
  },
  markAllNotificationsRead() {
    const notifications = this.getNotifications();
    notifications.forEach(n => n.read = true);
    LocalStorageService.set('erp_notifications', notifications);
  },
  markNotificationRead(id) {
    const notifications = this.getNotifications();
    const notif = notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      LocalStorageService.set('erp_notifications', notifications);
    }
  },
  submitDailyClosing(closingData) {
    return this._save('erp_daily_closings', closingData, 'CLS');
  },
  resetUserPassword(userId, newPassword) {
    const user = this._getAll('erp_users').find(u => u.id === userId);
    if (user) {
      user.password = newPassword; // Mock for now
      this._save('erp_users', user, 'USR');
      return true;
    }
    return false;
  },
  updateWarrantyClaim(id, status, details) {
    const warranty = this._getAll('erp_warranties').find(w => w.id === id);
    if (warranty) {
      warranty.status = status;
      if (details) warranty.details = details;
      this._save('erp_warranties', warranty, 'WAR');
      return true;
    }
    return false;
  }
};

