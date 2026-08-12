/**
 * Senthil Enterprises ERP - Data Service
 * Central business logic service and single source of truth.
 */
import { LocalStorageService } from './storage/localStorageService.js';
import { SeedData } from '../data/seedData.js';
import { verifyPassword, hashPassword, DEFAULT_PASSWORD_SALT, DEFAULT_PIN_HASH } from '../utils/password.js';

export const OfflineDataProvider = {
  
  // ==========================================
  // INITIALIZATION & METADATA
  // ==========================================
  async init() {
    if (!LocalStorageService.has('erp_system_state')) {
      // Initializing ERP Data for the first time...
      Object.keys(SeedData).forEach(key => {
        LocalStorageService.set(key, SeedData[key]);
      });
    }

    if (!LocalStorageService.has('erp_auth_users')) {
      // Seed default accounts with PIN "1234" (pre-computed hash — no async needed).
      // All accounts have requiresPinChange: true so users must set a new PIN on first login.
      LocalStorageService.set('erp_auth_users', [
        { id: 'USR-01', username: 'admin',       pinHash: DEFAULT_PIN_HASH, role: 'admin',       requiresPinChange: true },
        { id: 'USR-02', username: 'cashier',     pinHash: DEFAULT_PIN_HASH, role: 'cashier',     requiresPinChange: true },
        { id: 'USR-03', username: 'accountant',  pinHash: DEFAULT_PIN_HASH, role: 'accountant',  requiresPinChange: true },
        { id: 'USR-04', username: 'storekeeper', pinHash: DEFAULT_PIN_HASH, role: 'storekeeper', requiresPinChange: true }
      ]);
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

  getNextSequence(type) {
    const state = LocalStorageService.get('erp_system_state') || {};
    let counterKey = `sequence_${type}`;
    if (state[counterKey] === undefined) {
      state[counterKey] = 0;
    }
    state[counterKey]++;
    LocalStorageService.set('erp_system_state', state);
    return state[counterKey];
  },
  
  getBaseMetadata() {
    const authStr = localStorage.getItem('auth_user');
    const authUser = authStr ? JSON.parse(authStr) : null;
    const userId = authUser ? authUser.id : 'SYSTEM';

    return {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
      updatedBy: userId,
      isDeleted: false,
      version: 1
    };
  },
  
  getUpdateMetadata(entity) {
    const authStr = localStorage.getItem('auth_user');
    const authUser = authStr ? JSON.parse(authStr) : null;
    const userId = authUser ? authUser.id : 'SYSTEM';

    return {
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      version: (entity.version || 1) + 1
    };
  },

  // ==========================================
  // AUTHENTICATION
  // ==========================================
  async login(username, pin) {
    const users = LocalStorageService.get('erp_auth_users') || [];
    const user = users.find(u => u.username === username);
    if (!user) return false;

    const pinHash = await hashPassword(pin, DEFAULT_PASSWORD_SALT);
    if (user.pinHash === pinHash) {
      localStorage.setItem('auth_user', JSON.stringify({
        id: user.id,
        username: user.username,
        role: user.role,
        requiresPinChange: user.requiresPinChange
      }));
      return true;
    }
    return false;
  },

  logout() {
    localStorage.removeItem('auth_user');
    window.location.hash = '#/login';
  },

  async changePin(username, newPin) {
    const users = LocalStorageService.get('erp_auth_users') || [];
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) throw new Error('User not found');
    
    const pinHash = await hashPassword(newPin, DEFAULT_PASSWORD_SALT);
    users[userIndex].pinHash = pinHash;
    users[userIndex].requiresPinChange = false;
    LocalStorageService.set('erp_auth_users', users);
    
    // Update active session if changing own PIN
    const authStr = localStorage.getItem('auth_user');
    if (authStr) {
      const authUser = JSON.parse(authStr);
      if (authUser.username === username) {
        authUser.requiresPinChange = false;
        localStorage.setItem('auth_user', JSON.stringify(authUser));
      }
    }
    return true;
  },

  async getMe() {
    const authStr = localStorage.getItem('auth_user');
    if (authStr) {
      const u = JSON.parse(authStr);
      return { name: u.username, role: u.role, id: u.id };
    }
    return null;
  },

  // ==========================================
  // GENERIC CRUD HELPERS
  // ==========================================
  _toFinite(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  },

  _serialize(key) {
    const value = LocalStorageService.get(key);
    return value === null || value === undefined ? null : JSON.stringify(value);
  },

  _restore(backup, key) {
    if (backup !== null && backup !== undefined) {
      LocalStorageService.set(key, JSON.parse(backup));
    }
  },

  _dueAmount(invoice) {
    if (!invoice || invoice.paymentStatus === 'Paid Full') return 0;
    const total = Number(invoice.totalAmount || invoice.total || 0);
    const paid = Number(invoice.amountPaid || 0);
    const due = total - paid;
    return due > 0 ? due : 0;
  },

  _getAll(collectionKey) {
    const data = LocalStorageService.get(collectionKey);
    if (!Array.isArray(data)) return [];
    return data.filter(item => item && !item.isDeleted);
  },

  _getById(collectionKey, id) {
    const data = this._getAll(collectionKey);
    return data.find(item => item.id === id) || null;
  },

  _save(collectionKey, entity, prefix) {
    const data = LocalStorageService.get(collectionKey);
    const list = Array.isArray(data) ? data : [];

    if (!entity.id) {
      entity.id = this.generateId(prefix);
      entity = { ...entity, ...this.getBaseMetadata() };
      list.push(entity);
    } else {
      const index = list.findIndex(item => item.id === entity.id);
      if (index !== -1) {
        const prev = list[index] || {};
        entity = { ...prev, ...entity };
        // Trust boundary: caller-supplied data must not forge metadata
        entity.updatedAt = new Date().toISOString();
        // FIX-02: record the actual logged-in user, not hardcoded 'USR-01'
        entity.updatedBy = (() => { try { const s = localStorage.getItem('auth_user'); return s ? JSON.parse(s).id : 'SYSTEM'; } catch(e) { return 'SYSTEM'; } })();
        entity.version = (Number(prev.version) || 1) + 1;
        entity.isDeleted = prev.isDeleted === true;
        entity.createdAt = prev.createdAt;
        entity.createdBy = prev.createdBy;
        list[index] = entity;
      } else {
        // Entity with caller-supplied id (e.g. InvoiceService.next) not in list yet — append
        entity = { ...this.getBaseMetadata(), ...entity };
        list.push(entity);
      }
    }

    LocalStorageService.set(collectionKey, list);
    return entity;
  },

  _softDelete(collectionKey, id) {
    const data = LocalStorageService.get(collectionKey);
    const list = Array.isArray(data) ? data : [];
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      const prev = list[index] || {};
      list[index] = {
        ...prev,
        isDeleted: true,
        updatedAt: new Date().toISOString(),
        // FIX-02: record the actual logged-in user, not hardcoded 'USR-01'
        updatedBy: (() => { try { const s = localStorage.getItem('auth_user'); return s ? JSON.parse(s).id : 'SYSTEM'; } catch(e) { return 'SYSTEM'; } })(),
        version: (Number(prev.version) || 1) + 1
      };
      LocalStorageService.set(collectionKey, list);
      return true;
    }
    return false;
  },

  // ==========================================
  // EXPENSE CATEGORIES
  // ==========================================
  getExpenseCategories() {
    const cats = this._getAll('erp_expense_categories');
    if (cats.length === 0) {
      // Default fallback if none exists
      return [
        { id: 'CAT-1', name: 'Electricity', isActive: true },
        { id: 'CAT-2', name: 'Water', isActive: true },
        { id: 'CAT-3', name: 'Internet', isActive: true },
        { id: 'CAT-4', name: 'Staff Salary', isActive: true },
        { id: 'CAT-5', name: 'Labour', isActive: true },
        { id: 'CAT-6', name: 'Transport', isActive: true },
        { id: 'CAT-7', name: 'Loading/Unloading', isActive: true },
        { id: 'CAT-8', name: 'Tea & Snacks', isActive: true },
        { id: 'CAT-9', name: 'Stationery', isActive: true },
        { id: 'CAT-10', name: 'Rent', isActive: true },
        { id: 'CAT-11', name: 'Maintenance', isActive: true },
        { id: 'CAT-12', name: 'Marketing', isActive: true }
      ];
    }
    return cats;
  },
  saveExpenseCategory(category) {
    const existing = this.getExpenseCategories();
    // Prevent duplicates
    if (existing.some(c => String(c.name || '').toLowerCase() === String(category.name || '').toLowerCase() && c.id !== category.id)) {
      throw new Error('Expense category with this name already exists.');
    }
    return this._save('erp_expense_categories', category, 'ECAT');
  },
  deleteExpenseCategory(id) {
    return this._softDelete('erp_expense_categories', id);
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
    product.price = this._toFinite(product.price, 0);
    product.stock = this._toFinite(product.stock, 0);
    product.minStock = this._toFinite(product.minStock, 0);

    if (product.price < 0) {
      throw new Error('Price cannot be negative.');
    }
    if (product.stock < 0) {
      throw new Error('Stock cannot be negative.');
    }
    if (product.minStock < 0) {
      throw new Error('Minimum stock cannot be negative.');
    }

    const existing = this.getProducts();
    if (product.sku && existing.some(p => p.sku === product.sku && p.id !== product.id)) {
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

    const saved = this._save('erp_products', product, 'PRD');

    // Price History Logging
    if (product.id) {
      const oldProduct = existing.find(p => p.id === product.id);
      if (oldProduct) {
        const priceChanged = oldProduct.price !== product.price;
        const buyPriceChanged = oldProduct.buyingPrice !== product.buyingPrice;
        const avgCostChanged = oldProduct.avgCost !== product.avgCost;

        if (priceChanged || buyPriceChanged || avgCostChanged) {
          const history = LocalStorageService.get('erp_product_price_history') || [];
          history.push({
            id: `PPH-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            productId: product.id,
            date: new Date().toISOString(),
            oldPrice: oldProduct.price,
            newPrice: product.price,
            oldBuyingPrice: oldProduct.buyingPrice,
            newBuyingPrice: product.buyingPrice,
            oldAvgCost: oldProduct.avgCost,
            newAvgCost: product.avgCost,
            reason: 'Manual Update / Purchase'
          });
          LocalStorageService.set('erp_product_price_history', history);
        }
      }
    }

    return saved;
  },
  deleteProduct(id) {
    return this._softDelete('erp_products', id);
  },

  // ==========================================
  // CATEGORIES
  // ==========================================
  getCategories() {
    return this._getAll('erp_categories');
  },
  getCategoryById(id) {
    return this._getById('erp_categories', id);
  },
  saveCategory(category) {
    const existing = this.getCategories();
    if (existing.some(c => String(c.name || '').toLowerCase() === String(category.name || '').toLowerCase() && c.id !== category.id)) {
      throw new Error('Category with this name already exists.');
    }
    return this._save('erp_categories', category, 'CAT');
  },
  deleteCategory(id) {
    return this._softDelete('erp_categories', id);
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
    if (existing.some(c => String(c.name || '').toLowerCase() === String(customer.name || '').toLowerCase() && c.id !== customer.id)) {
      throw new Error('Customer with this name already exists.');
    }
    customer.creditLimit = this._toFinite(customer.creditLimit, 0);
    customer.outstanding = this._toFinite(customer.outstanding, 0);
    return this._save('erp_customers', customer, 'CUS');
  },
  deleteCustomer(id) {
    return this._softDelete('erp_customers', id);
  },
  updateCustomerBalance(id, amountChange) {
    const change = this._toFinite(amountChange);
    if (change === 0) return;
    const customer = this.getCustomerById(id);
    if (customer) {
      customer.outstanding = this._toFinite(customer.outstanding) + change;
      this.saveCustomer(customer);
    }
  },

  // ==========================================
  // CREDIT PAYMENTS (AUDIT-H04)
  // Collections recorded when cash is received
  // against a customer's outstanding balance.
  // ==========================================
  getCreditPayments() {
    return this._getAll('erp_credit_payments');
  },
  saveCreditPayment(payment) {
    if (!payment.customerId) {
      throw new Error('Customer is required for a credit payment.');
    }
    const amount = this._toFinite(payment.amount);
    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }
    payment.amount = amount;
    const saved = this._save('erp_credit_payments', payment, 'PAY');
    // Synchronize the customer ledger immediately (net zero risk: updateCustomerBalance is idempotent on re-save).
    this.updateCustomerBalance(saved.customerId, -amount);
    return saved;
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
    const change = this._toFinite(amountChange);
    if (change === 0) return;
    const dealer = this.getDealerById(id);
    if (dealer) {
      dealer.outstanding = this._toFinite(dealer.outstanding) + change;
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

    const prev = invoice.id ? this._getAll('erp_purchases').find(i => i.id === invoice.id) : null;
    const prevItems = prev && Array.isArray(prev.items) ? prev.items : [];
    const prevByProduct = new Map(prevItems.map(it => [it.productId, this._toFinite(it.qty)]));
    const newItems = invoice.items.map(it => ({ 
      productId: it.productId, 
      qty: this._toFinite(it.qty),
      costPrice: this._toFinite(it.costPrice || it.price, 0),
      price: this._toFinite(it.price, 0)
    }));

    // Backup state for atomicity (mirrors saveSalesInvoice)
    const backupInvoices = this._serialize('erp_purchases');
    const backupProducts = this._serialize('erp_products');
    const backupDealers = this._serialize('erp_dealers');

    try {
      const saved = this._save('erp_purchases', invoice, 'PUR');

      // Inventory: apply net delta vs previous version (idempotent on re-save)
      const seen = new Set();
      newItems.forEach(item => {
        const delta = item.qty - (prevByProduct.get(item.productId) || 0);
        seen.add(item.productId);

        const product = this.getProductById(item.productId);
        if (product) {
          const currentStock = Number(product.stock || 0);
          const currentCost = Number(product.avgCost || product.buyingPrice || 0);
          const newQty = Number(item.qty);
          const newPrice = this._toFinite(item.costPrice || item.price, 0);

          if (currentStock + newQty > 0) {
            const totalValue = (currentStock * currentCost) + (newQty * newPrice);
            product.avgCost = parseFloat((totalValue / (currentStock + newQty)).toFixed(2));
          }
          product.buyingPrice = newPrice;
          product.lastPurchaseDate = new Date().toISOString().split('T')[0];
          product.supplier = invoice.dealerName || product.supplier;

          this.saveProduct(product);
        }

        if (delta !== 0) this.updateStock(item.productId, delta);
      });
      // Lines removed from the invoice: undo their stock effect
      prevByProduct.forEach((qty, productId) => {
        if (!seen.has(productId) && qty !== 0) {
          this.updateStock(productId, -qty);
        }
      });

      // Update dealer outstanding if credit, as a net delta
      if (invoice.dealerId) {
        const dealer = this.getDealerById(invoice.dealerId);
        if (dealer) {
          dealer.lastPurchaseDate = new Date().toISOString().split('T')[0];
          this.saveDealer(dealer);
        }
        const delta = this._dueAmount(invoice) - this._dueAmount(prev);
        if (delta !== 0) {
          this.updateDealerBalance(invoice.dealerId, delta);
        }
      }

      return saved;
    } catch (e) {
      // Restore state on failure
      this._restore(backupInvoices, 'erp_purchases');
      this._restore(backupProducts, 'erp_products');
      this._restore(backupDealers, 'erp_dealers');
      throw e;
    }
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

    const prev = invoice.id ? this._getAll('erp_sales_invoices').find(i => i.id === invoice.id) : null;
    const prevItems = prev && Array.isArray(prev.items) ? prev.items : [];
    const prevByProduct = new Map(prevItems.map(it => [it.productId, this._toFinite(it.qty)]));
    const newItems = invoice.items.map(it => ({ productId: it.productId, qty: this._toFinite(it.qty) }));

    // Backup state for atomicity (BUG-02 fix)
    const backupInvoices = this._serialize('erp_sales_invoices');
    const backupProducts = this._serialize('erp_products');
    const backupCustomers = this._serialize('erp_customers');
    const backupProjects = this._serialize('erp_house_projects');

    try {
      // Save invoice
      const savedInvoice = this._save('erp_sales_invoices', invoice, 'SAL');

      // Inventory: apply net delta vs previous version (idempotent on re-save)
      const seen = new Set();
      newItems.forEach(item => {
        const delta = item.qty - (prevByProduct.get(item.productId) || 0);
        seen.add(item.productId);
        if (delta !== 0) this.updateStock(item.productId, -delta);
        const product = this.getProductById(item.productId);
        if (product) {
          product.lastSaleDate = new Date().toISOString().split('T')[0];
          this.saveProduct(product);
        }
      });
      // Lines removed from the invoice: return their stock
      prevByProduct.forEach((qty, productId) => {
        if (!seen.has(productId) && qty !== 0) {
          this.updateStock(productId, qty);
        }
      });

      // House Project integration (outstanding as a net delta)
      if (invoice.projectId) {
        const projects = this._getAll('erp_house_projects');
        const project = projects.find(p => p.id === invoice.projectId);
        if (project) {
          if (!Array.isArray(project.invoices)) project.invoices = [];
          if (!project.invoices.includes(savedInvoice.id)) project.invoices.push(savedInvoice.id);

          const total = Number(invoice.totalAmount || invoice.total || 0);
          const prevTotal = Number(prev && (prev.totalAmount || prev.total) || 0);
          project.outstanding = (Number(project.outstanding) || 0) + (total - prevTotal);
          this._save('erp_house_projects', project, 'PRJ');
        }
      }

      // Update customer outstanding if credit payment, as a net delta
      if (invoice.customerId) {
        const customer = this.getCustomerById(invoice.customerId);
        if (customer) {
          customer.lastPurchaseDate = new Date().toISOString().split('T')[0];
          this.saveCustomer(customer);
        }
        const delta = this._dueAmount(invoice) - this._dueAmount(prev);
        if (delta !== 0) {
          this.updateCustomerBalance(invoice.customerId, delta);
        }
      }

      return savedInvoice;
    } catch (e) {
      // Restore state on failure
      this._restore(backupInvoices, 'erp_sales_invoices');
      this._restore(backupProducts, 'erp_products');
      this._restore(backupCustomers, 'erp_customers');
      this._restore(backupProjects, 'erp_house_projects');
      throw e;
    }
  },
  
  // ==========================================
  // ESTIMATIONS (RC3.5)
  // ==========================================
  getEstimations() {
    return this._getAll('erp_estimations');
  },
  saveEstimation(estimation) {
    if (!estimation.items || estimation.items.length === 0) {
      throw new Error('Cannot save an empty estimation.');
    }
    // Estimations DO NOT deduct stock, do not hit ledgers, and do not hit sales history.
    // We only preserve the estimation data itself.
    return this._save('erp_estimations', estimation, 'EST');
  },
  deleteEstimation(id) {
    return this._softDelete('erp_estimations', id);
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
    if (!user.id && !user.passwordHash) {
      user.passwordSalt = DEFAULT_PASSWORD_SALT;
      user.passwordHash = DEFAULT_PIN_HASH;
    }
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
  async resetUserPassword(userId, newPassword) {
    const users = this._getAll('erp_users');
    const user = users.find(u => u.id === userId);
    if (user) {
      const hashed = await hashForReset(newPassword);
      user.passwordSalt = hashed.passwordSalt;
      user.passwordHash = hashed.passwordHash;
      LocalStorageService.set('erp_users', users);
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
  },

  // ==========================================
  // RC3 - HISTORICAL RECORDS & ADJUSTMENTS
  // ==========================================
  getStockAdjustments() {
    return this._getAll('erp_stock_adjustments').sort((a, b) => new Date(b.date) - new Date(a.date));
  },
  saveStockAdjustment(adjustment) {
    const qty = this._toFinite(adjustment.qty);
    if (qty <= 0) {
      throw new Error('Adjustment quantity must be a positive number.');
    }

    const saved = this._save('erp_stock_adjustments', adjustment, 'ADJ');

    // Auto-update inventory stock
    const product = this.getProductById(saved.productId);
    if (product) {
      if (['Found', 'Manual Add', 'Add'].includes(saved.type)) {
        product.stock = Number(product.stock || 0) + qty;
      } else if (saved.type === 'Manual Correction') {
        product.stock = qty;
      } else {
        // Damaged, Broken, Lost, Expired, Remove — reduce stock
        product.stock = Number(product.stock || 0) - qty;
      }
      this.saveProduct(product); // enforces non-negative stock
    }
    return saved;
  },

  updateStock(id, qtyChange) {
    const change = this._toFinite(qtyChange);
    const product = this.getProductById(id);
    if (product) {
      product.stock = Number(product.stock || 0) + change;
      this.saveProduct(product); // will trigger status badge updates and non-negative check

      // trigger notification if low stock
      if (product.stock <= (Number(product.minStock) || 0) && product.stock > 0) {
        this.createNotification('warning', 'Low Stock Alert', `${product.name} is running low (${product.stock} left).`);
      }
    }
  },

  getDailyClosingHistory() {
    return this._getAll('erp_daily_closing_history');
  },
  saveDailyClosingHistory(closing) {
    return this._save('erp_daily_closing_history', closing, 'DCH');
  },

  getProductPriceHistory(productId) {
    const all = this._getAll('erp_product_price_history');
    return productId ? all.filter(p => p.productId === productId) : all;
  },
  logProductPriceChange(historyRecord) {
    return this._save('erp_product_price_history', historyRecord, 'PPH');
  }
};
