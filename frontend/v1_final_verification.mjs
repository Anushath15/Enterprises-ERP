import fs from 'fs';
import path from 'path';

// --- MOCK BROWSER ENVIRONMENT ---
global.localStorage = {
  _data: {},
  getItem(key) { return this._data[key] || null; },
  setItem(key, value) { this._data[key] = String(value); },
  removeItem(key) { delete this._data[key]; },
  clear() { this._data = {}; }
};
global.window = {
  confirm: () => true,
  alert: () => {},
  dispatchEvent: () => {},
  showToast: true,
  lucide: { createIcons: () => {} }
};
global.document = {
  createElement: () => ({ setAttribute: ()=>{}, click: ()=>{}, style: {} }),
  getElementById: () => ({ value: '', textContent: '', getAttribute: () => '' }),
  querySelector: () => null,
  querySelectorAll: () => [],
  body: { appendChild: () => {}, removeChild: () => {} }
};
global.NotificationService = {
  success: () => {}, error: () => {}, warning: () => {}, info: () => {}
};

function loadService(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  // Strip imports
  code = code.replace(/import\s+.*?;/g, '');
  // Convert exports to global assignments
  code = code.replace(/export\s+const\s+(\w+)\s*=/g, 'global.$1 =');
  code = code.replace(/export\s+function\s+(\w+)/g, 'global.$1 = function');
  code = code.replace(/export\s+class\s+(\w+)/g, 'global.$1 = class');
  
  // Specific fix for DataProvider which is an exported object
  code = code.replace(/export\s+const\s+OfflineDataProvider\s*=\s*\{/, 'global.OfflineDataProvider = {');
  
  // Execute in the current context
  eval(code);
}

try {
  loadService('services/storage/localStorageService.js');
  loadService('services/offlineDataProvider.js');
  loadService('services/backupService.js');
  loadService('services/draftManager.js');
  loadService('utils/dateUtils.js');
} catch(e) {
  console.error("Failed to load services:", e);
  process.exit(1);
}

const dp = global.OfflineDataProvider;

console.log("=== STRICT INDEPENDENT VERIFICATION RUN ===");
let passed = 0, failed = 0;
const issues = [];
function assert(name, cond, msg='') {
  if (cond) { passed++; console.log('PASS:', name); }
  else { failed++; console.log('FAIL:', name, msg); issues.push(name + ' - ' + msg); }
}

try {
  // --- 1. OPENING CASH ---
  localStorage.setItem('erp_opening_cash', '15000');
  
  // --- 2. MASTER DATA SETUP ---
  const cat = dp.saveCategory({name: 'Pipes', code: 'PIP'});
  const p1 = dp.saveProduct({name: '1 Inch Pipe', category: 'Pipes', buyingPrice: 200, price: 250, stock: 100, minStock: 10, unit: 'pcs', taxRate: 18});
  const p2 = dp.saveProduct({name: 'Cement', category: 'General', buyingPrice: 300, price: 350, stock: 50, minStock: 5, unit: 'bag', taxRate: 28});
  const c1 = dp.saveCustomer({name: 'John Doe', phone: '1234567890', type: 'Retail'});
  const d1 = dp.saveDealer({name: 'Acme Corp', phone: '0987654321'});
  
  // --- 3. PURCHASE (P2B-01 Avg Cost, Dealer Outstanding) ---
  const pur1 = dp.savePurchaseInvoice({
    dealerId: d1.id,
    paymentMode: 'Credit',
    date: global.todayISO(),
    items: [{ productId: p1.id, qty: 50, costPrice: 220 }]
  });
  
  const p1_after_pur = dp.getProductById(p1.id);
  const d1_after_pur = dp.getDealerById(d1.id);
  assert('Purchase increases stock', p1_after_pur.stock === 150, `Expected 150, got ${p1_after_pur.stock}`);
  // Formula: ((100 * 200) + (50 * 220)) / 150 = 31000 / 150 = 206.666
  assert('Average cost recalculated correctly', Math.abs(p1_after_pur.avgCost - 206.666) < 0.01, `Got ${p1_after_pur.avgCost}`);
  assert('Dealer outstanding increased on credit purchase', d1_after_pur.outstanding === (50 * 220));
  
  // --- 4. CASH SALE (Stock, No Customer Outstanding) ---
  const sale1 = dp.saveSalesInvoice({
    customerId: c1.id,
    paymentMode: 'Cash',
    paymentMethod: 'Cash',
    date: global.todayISO(),
    items: [{ productId: p1.id, qty: 10, price: 250, discountPercent: 0 }]
  });
  const p1_after_sale = dp.getProductById(p1.id);
  const c1_after_sale1 = dp.getCustomerById(c1.id);
  assert('Cash sale reduces stock', p1_after_sale.stock === 140);
  assert('Cash sale does not affect customer outstanding', c1_after_sale1.outstanding === 0 || c1_after_sale1.outstanding === undefined);
  
  // --- 5. CREDIT SALE (Stock, Customer Outstanding) ---
  const sale2 = dp.saveSalesInvoice({
    customerId: c1.id,
    paymentMode: 'Credit',
    paymentMethod: 'Credit',
    date: global.todayISO(),
    items: [{ productId: p2.id, qty: 20, price: 350, discountPercent: 10 }]
  });
  // 20 * 350 = 7000 base. 10% discount = 700. Net = 6300. 28% tax on 6300 = 1764. Total = 8064.
  const p2_after_sale = dp.getProductById(p2.id);
  const c1_after_sale2 = dp.getCustomerById(c1.id);
  assert('Credit sale reduces stock', p2_after_sale.stock === 30);
  assert('Credit sale increases customer outstanding', c1_after_sale2.outstanding === sale2.totalAmount);
  assert('Discount applied correctly', sale2.discount === 700);
  assert('Tax calculated correctly', sale2.taxTotal === 1764);
  assert('Item total stores discounted amount', Math.abs(sale2.items[0].total - 6300) < 0.01);
  
  // --- 6. CREDIT COLLECTION (Reduces outstanding, updates payment ledger) ---
  const pay1 = dp.saveCreditPayment({
    customerId: c1.id,
    amount: 5000,
    method: 'Cash',
    date: global.todayISO()
  });
  const c1_after_pay = dp.getCustomerById(c1.id);
  assert('Credit payment reduces customer outstanding', Math.abs(c1_after_pay.outstanding - (8064 - 5000)) < 0.01);
  
  // --- 7. EXPENSE ---
  const exp1 = dp.saveExpense({
    desc: 'Tea', amount: 50, mode: 'Cash', date: global.todayISO()
  });
  
  // --- 8. DAILY CLOSING MATH ---
  let totalCashSales = 0, totalCreditColl = 0, totalExp = 0;
  dp.getSalesInvoices().forEach(i => {
    if (i.paymentMode === 'Cash') totalCashSales += i.totalAmount;
  });
  dp.getCreditPayments().forEach(p => {
    if (p.method === 'Cash') totalCreditColl += Number(p.amount);
  });
  dp.getExpenses().forEach(e => {
    if (e.mode === 'Cash') totalExp += Number(e.amount);
  });
  
  const expectedCash = 15000 + totalCashSales + totalCreditColl - totalExp;
  assert('Daily closing mathematical expected cash is perfectly accurate', expectedCash === 22900, `Expected 22900, got ${expectedCash}. cashSales=${totalCashSales}, coll=${totalCreditColl}, exp=${totalExp}`);
  
  // --- 9. BACKUP & RESTORE (Data Integrity) ---
  // Mock DataProvider for BackupService
  global.DataProvider = dp;
  const backupData = global.BackupService.createBackup();
  assert('Backup generates valid JSON string', typeof backupData === 'string' && backupData.length > 100);
  
  localStorage.clear();
  assert('Storage cleared', dp.getProducts().length === 0);
  
  const restoreRes = global.BackupService.restoreFromBackup(backupData);
  assert('Restore completes successfully', restoreRes.success);
  assert('Restore recovers products', dp.getProducts().length === 2);
  assert('Restore recovers invoices', dp.getSalesInvoices().length === 2);
  assert('Restore recovers exact customer outstanding', dp.getCustomerById(c1.id).outstanding === 3064);

} catch(e) {
  console.error("Simulation failed:", e);
  failed++;
}

console.log(`\nRESULTS: ${passed} Passed, ${failed} Failed`);
if (issues.length > 0) {
  console.log("ISSUES:");
  issues.forEach(i => console.log(" -", i));
}
