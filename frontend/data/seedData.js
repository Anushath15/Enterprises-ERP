/**
 * Senthil Enterprises ERP - Initial Seed Data (Pilot Deployment)
 */
import { MasterProducts } from './products.js';

export const SeedData = {
  erp_settings: {
    shopName: 'Senthil Enterprises',
    tagline: 'Hardware, Electrical, Plumbing, Sanitary and Construction Materials',
    address: 'Chukkuparai Eherivezhai, College Road, Kanniyakumari, Tamil Nadu - 629702',
    phone: '+91 9876543210',
    email: 'contact@senthilenterprises.com',
    gstin: '33AAAAA0000A1Z5',
    defaultTaxType: 'Exclusive',
    invoicePrefix: 'INV-',
    terms: '1. Goods once sold cannot be returned.\n2. Subject to Kanniyakumari jurisdiction.'
  },
  erp_products: MasterProducts,
  erp_customers: [],
  erp_dealers: [],
  erp_sales_invoices: [],
  erp_purchase_invoices: [],
  erp_purchases: [],
  erp_sales_returns: [],
  erp_purchase_returns: [],
  erp_deliveries: [],
  erp_settings_history: [],
  erp_expenses: [],
  erp_staff: [
    { id: 'EMP-001', name: 'Senthil Kumar', role: 'Owner', phone: '', salary: 0, status: 'Active' }
  ],
  erp_warranties: [],
  erp_projects: [],
  erp_notifications: [],
  erp_users: [
    { id: 'USR-01', name: 'Senthil Kumar', username: 'admin', role: 'Administrator', status: 'Active' }
  ],
  erp_system_state: {
    initialized: true,
    lastInvoiceNumber: 0,
    lastPurchaseNumber: 0,
    lastDeliveryNumber: 0
  }
};

