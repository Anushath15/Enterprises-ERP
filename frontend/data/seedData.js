/**
 * Senthil Enterprises ERP - Initial Seed Data
 */
export const SeedData = {
  erp_settings: {
    shopName: 'Senthil Enterprises',
    tagline: 'Hardware, Electrical, Plumbing, Sanitary and Construction Materials',
    address: 'No. 123, Main Road, Chennai, Tamil Nadu - 600001',
    phone: '+91 9876543210',
    email: 'contact@senthilenterprises.com',
    gstin: '33AAAAA0000A1Z5',
    defaultTaxType: 'Exclusive',
    invoicePrefix: 'INV-',
    terms: '1. Goods once sold cannot be returned.\n2. Subject to Chennai jurisdiction.'
  },
  erp_products: [
    { id: 'PRD-000001', sku: 'ELEC-CROM-1.5HP', name: 'Crompton 1.5HP Water Pump', category: 'Electricals', brand: 'Crompton', price: 12500, cost: 10000, stock: 12, minStock: 3, unit: 'Nos', taxRate: 18, location: 'A-Rack-1', isActive: true, status: 'In Stock', statusBadge: 'success' },
    { id: 'PRD-000002', sku: 'PLUM-CPVC-1IN', name: 'Ashirvad CPVC Pipe 1"', category: 'Plumbing', brand: 'Ashirvad', price: 450, cost: 350, stock: 150, minStock: 20, unit: 'Length', taxRate: 18, location: 'Pipe-Rack-B', isActive: true, status: 'In Stock', statusBadge: 'success' },
    { id: 'PRD-000003', sku: 'HARD-TATA-NAIL-2', name: 'Tata Wiron Nails 2"', category: 'Hardware', brand: 'Tata', price: 85, cost: 65, stock: 45, minStock: 10, unit: 'Kg', taxRate: 18, location: 'Bin-45', isActive: true, status: 'In Stock', statusBadge: 'success' },
    { id: 'PRD-000004', sku: 'SANI-CERA-WC', name: 'Cera Wall Hung WC', category: 'Sanitaryware', brand: 'Cera', price: 6500, cost: 5000, stock: 4, minStock: 2, unit: 'Nos', taxRate: 28, location: 'Showroom', isActive: true, status: 'Low Stock', statusBadge: 'warning' },
    { id: 'PRD-000005', sku: 'ELEC-HAVL-25L', name: 'Havells 25L Geyser', category: 'Electricals', brand: 'Havells', price: 8200, cost: 6500, stock: 0, minStock: 2, unit: 'Nos', taxRate: 18, location: 'A-Rack-2', isActive: true, status: 'Out of Stock', statusBadge: 'danger' }
  ],
  erp_customers: [
    { id: 'CUS-000001', name: 'Ravi Kumar', type: 'Retail', phone: '+91 9876543210', email: 'ravi@example.com', address: '12, North Street, Chennai', gstin: '', creditLimit: 50000, outstanding: 14500, isActive: true },
    { id: 'CUS-000002', name: 'Karthik Constructions', type: 'Contractor', phone: '+91 9988776655', email: 'karthik@constructions.in', address: 'Plot 45, New Town Extension, Chennai', gstin: '33BBBBB0000B1Z5', creditLimit: 200000, outstanding: 210000, isActive: true },
    { id: 'CUS-000003', name: 'Siva Builders', type: 'Contractor', phone: '+91 9123456789', email: 'siva@builders.com', address: 'Site 8, Industrial Estate, Chennai', gstin: '33CCCCC0000C1Z5', creditLimit: 500000, outstanding: 0, isActive: true }
  ],
  erp_dealers: [
    { id: 'DLR-000001', name: 'Ashirvad Pipes Dist.', contactPerson: 'Mani', category: 'Plumbing', phone: '+91 9845612345', email: 'orders@ashirvad-chennai.com', address: '14, Industrial Estate, Guindy, Chennai', gstin: '33AAAAA1111A1Z5', outstanding: 125000, creditPeriod: 30, isActive: true },
    { id: 'DLR-000002', name: 'Crompton Regional', contactPerson: 'Suresh', category: 'Electricals', phone: '+91 9789012345', email: 'sales.tn@crompton.co.in', address: 'Phase 2, Ambattur IE, Chennai', gstin: '33BBBBB2222B1Z5', outstanding: 45000, creditPeriod: 45, isActive: true }
  ],
  erp_sales_invoices: [],
  erp_purchase_invoices: [],
  erp_purchases: [],
  erp_sales_returns: [],
  erp_purchase_returns: [],
  erp_deliveries: [],
  erp_settings_history: [],
  erp_expenses: [
    { id: 'EXP-20260727-000001', date: '2026-07-27', category: 'Tea & Snacks', description: 'Evening tea for staff', amount: 120, method: 'Cash' },
    { id: 'EXP-20260727-000002', date: '2026-07-27', category: 'Transport', description: 'Auto fare for material delivery to site', amount: 350, method: 'Cash' }
  ],
  erp_staff: [
    { id: 'EMP-001', name: 'Kumar S.', role: 'Store Manager', phone: '+91 9876543210', salary: 25000, status: 'Active' },
    { id: 'EMP-002', name: 'Murugan P.', role: 'Delivery Driver', phone: '+91 8765432109', salary: 18000, status: 'Active' }
  ],
  erp_warranties: [],
  erp_projects: [],
  erp_notifications: [
    { id: 'NOT-000001', type: 'warning', title: 'Low Stock Alert', message: 'Cera Wall Hung WC is running low (4 left).', time: new Date().toISOString(), read: false },
    { id: 'NOT-000002', type: 'danger', title: 'Credit Limit Exceeded', message: 'Karthik Constructions has exceeded their credit limit.', time: new Date().toISOString(), read: false }
  ],
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

