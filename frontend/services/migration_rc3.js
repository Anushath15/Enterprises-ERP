/**
 * Senthil Enterprises ERP - RC3 Migration Script
 * Safely upgrades LocalStorage schema for RC3 features without data loss.
 */
import { LocalStorageService } from './storage/localStorageService.js';
import { DEFAULT_PASSWORD_SALT, DEFAULT_PIN_HASH } from '../utils/password.js';

const ROLE_NORMALIZE = {
  'Administrator': 'admin',
  'Administrator (Full Access)': 'admin',
  'Admin': 'admin',
  'Manager': 'manager',
  'Manager (Can edit, cannot delete)': 'manager',
  'Sales User': 'user',
  'Sales User (Billing only)': 'user',
  'User': 'user'
};

export const MigrationRC3 = {
  run() {
    const version = LocalStorageService.get('erp_db_version') || '1.0.0-rc2';
    
    if (version === '1.0.0-auth') {
      return; // Already migrated
    }

    // 1. Migrate Products (Units & Barcodes)
    let products = LocalStorageService.get('erp_products') || [];
    let productsModified = false;
    const categorySet = new Set();
    products = products.map(p => {
      let modified = false;
      if (!p.unit) {
        p.unit = 'Nos'; // Default
        modified = true;
      }
      if (!p.barcode) {
        // Fallback to SKU or ID if no barcode exists
        p.barcode = p.sku || p.id;
        modified = true;
      }
      if (p.purchasePrice === undefined) {
        // Backfill a dummy purchase price derived from price if it didn't exist
        p.purchasePrice = Number(p.price || 0) * 0.8;
        modified = true;
      }
      if (p.category) categorySet.add(p.category);
      if (modified) productsModified = true;
      return p;
    });
    if (productsModified) LocalStorageService.set('erp_products', products);

    // 1.5 Backfill Categories
    if (!LocalStorageService.get('erp_categories')) {
      const categories = Array.from(categorySet).map((catName, idx) => ({
        id: `CAT-${String(idx + 1).padStart(6, '0')}`,
        name: catName,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }));
      // Add defaults if none exist
      if (categories.length === 0) {
        categories.push({ id: 'CAT-000001', name: 'General', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1 });
      }
      LocalStorageService.set('erp_categories', categories);
    }

    // 2. Migrate Sales Invoices (GST Split & Margin)
    let sales = LocalStorageService.get('erp_sales_invoices') || [];
    let salesModified = false;
    sales = sales.map(inv => {
      if (inv.cgst === undefined || inv.sgst === undefined) {
        // Legacy split
        const totalTax = Number(inv.tax || 0);
        inv.cgst = totalTax / 2;
        inv.sgst = totalTax / 2;
        inv.taxableAmount = Number(inv.subtotal || 0) - Number(inv.discount || 0);
        salesModified = true;
      }
      return inv;
    });
    if (salesModified) LocalStorageService.set('erp_sales_invoices', sales);

    // 3. Migrate Purchases (GST Split)
    let purchases = LocalStorageService.get('erp_purchases') || [];
    let purchasesModified = false;
    purchases = purchases.map(pur => {
      if (pur.cgst === undefined || pur.sgst === undefined) {
        const totalTax = Number(pur.tax || 0);
        pur.cgst = totalTax / 2;
        pur.sgst = totalTax / 2;
        purchasesModified = true;
      }
      return pur;
    });
    if (purchasesModified) LocalStorageService.set('erp_purchases', purchases);

    // Setup new repos if not exist
    if (!LocalStorageService.get('erp_stock_adjustments')) LocalStorageService.set('erp_stock_adjustments', []);
    if (!LocalStorageService.get('erp_daily_closing_history')) LocalStorageService.set('erp_daily_closing_history', []);
    if (!LocalStorageService.get('erp_product_price_history')) LocalStorageService.set('erp_product_price_history', []);

    // 4. Auth Migration: normalize system roles and seed default credentials
    let users = LocalStorageService.get('erp_users') || [];
    let usersModified = false;
    users = users.map(u => {
      const canonical = ROLE_NORMALIZE[u.role];
      if (canonical && u.role !== canonical) {
        u.role = canonical;
        usersModified = true;
      }
      if (!u.passwordHash) {
        u.passwordSalt = DEFAULT_PASSWORD_SALT;
        u.passwordHash = DEFAULT_PIN_HASH;
        usersModified = true;
      }
      return u;
    });
    if (usersModified) LocalStorageService.set('erp_users', users);

    // Update Version
    LocalStorageService.set('erp_db_version', '1.0.0-auth');
    // RC3 Schema Migration Complete.
  }
};
