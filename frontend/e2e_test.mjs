import { OfflineDataProvider } from './services/offlineDataProvider.js';

async function runEndToEnd() {
  console.log("=== Phase 12-14: End to End Business Simulation ===");
  
  // 1. Setup Master Data
  const dealer = { id: 'D-999', name: 'UltraTech Cement Supplier', outstanding: 0, status: 'Active' };
  OfflineDataProvider.saveDealer(dealer);
  
  const customer = { id: 'C-999', name: 'Larsen Builder', outstanding: 0, status: 'Active' };
  OfflineDataProvider.saveCustomer(customer);
  
  const product = { id: 'P-999', name: 'UltraTech Cement 50kg', stock: 0, avgCost: 0, price: 400, gst: 18, isActive: true };
  OfflineDataProvider.saveProduct(product);
  
  const project = { id: 'PRJ-999', title: 'Larsen Villa', customer: 'Larsen Builder', budget: 500000, invoices: [] };
  OfflineDataProvider.saveProject(project);
  
  console.log("Master Data Created.");

  // 2. Purchase Inventory
  const purchase = {
    id: 'PUR-999',
    dealerId: 'D-999',
    date: new Date().toISOString(),
    items: [{ productId: 'P-999', qty: 100, price: 350, total: 35000 }],
    totalAmount: 35000,
    paidAmount: 10000
  };
  OfflineDataProvider.savePurchaseInvoice(purchase);
  
  const updatedDealer = OfflineDataProvider.getDealerById('D-999');
  const updatedProductAfterPurchase = OfflineDataProvider.getProductById('P-999');
  
  console.log(`Purchase Complete. Stock: ${updatedProductAfterPurchase.stock} (Expected 100). Dealer Payable: ${updatedDealer.outstanding} (Expected 25000)`);

  // 3. Make a Sale for the Project
  const sale = {
    id: 'INV-999',
    customerId: 'C-999',
    projectId: 'PRJ-999',
    date: new Date().toISOString(),
    items: [{ productId: 'P-999', name: 'UltraTech Cement 50kg', qty: 20, price: 400, total: 8000 }],
    totalAmount: 8000,
    paidAmount: 2000
  };
  OfflineDataProvider.saveSalesInvoice(sale);
  
  const updatedCustomer = OfflineDataProvider.getCustomerById('C-999');
  const updatedProductAfterSale = OfflineDataProvider.getProductById('P-999');
  const updatedProject = OfflineDataProvider.getProjects().find(p => p.id === 'PRJ-999');
  
  console.log(`Sale Complete. Stock: ${updatedProductAfterSale.stock} (Expected 80). Customer Outstanding: ${updatedCustomer.outstanding} (Expected 6000). Project Invoices: ${updatedProject.invoices.length} (Expected 1)`);

  // 4. Verify cross module integration
  if (updatedProductAfterSale.stock === 80 && updatedCustomer.outstanding === 6000 && updatedDealer.outstanding === 25000 && updatedProject.invoices.includes('INV-999')) {
    console.log("✅ All Core ERP Modules successfully integrated and mathematically accurate!");
  } else {
    console.error("❌ E2E Test Failed.");
  }
}

runEndToEnd();
