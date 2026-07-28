/**
 * Run this script in the browser console at http://localhost:5500 to generate dummy data for performance testing.
 * IMPORTANT: This will OVERWRITE existing data.
 */
(() => {
  console.log("Starting Dummy Data Generation...");
  const start = performance.now();

  const generateId = (prefix, i) => `${prefix}-${String(i).padStart(5, '0')}`;
  
  // 1. 5000 Products
  console.log("Generating 5,000 Products...");
  const products = [];
  for(let i=1; i<=5000; i++) {
    products.push({
      id: generateId('PRD', i),
      name: `Test Product ${i} (Hardware)`,
      category: i % 2 === 0 ? 'Hardware' : 'Electrical',
      hsn: `84${i.toString().substring(0,2)}`,
      stock: Math.floor(Math.random() * 500) + 10,
      minStock: 20,
      mrp: Math.floor(Math.random() * 5000) + 100,
      price: Math.floor(Math.random() * 4000) + 80,
      avgCost: Math.floor(Math.random() * 3000) + 50,
      gst: [5, 12, 18, 28][Math.floor(Math.random() * 4)],
      unit: 'Nos',
      location: `R${Math.floor(i/100)}-S${i%10}`,
      isActive: true
    });
  }
  localStorage.setItem('products', JSON.stringify(products));

  // 2. 3000 Customers
  console.log("Generating 3,000 Customers...");
  const customers = [];
  for(let i=1; i<=3000; i++) {
    customers.push({
      id: generateId('CUST', i),
      name: `Customer ${i} BuildCo`,
      type: 'Retail',
      phone: `98${String(i).padStart(8, '0')}`,
      email: `cust${i}@example.com`,
      address: `Street ${i}, Industrial Area`,
      area: `Zone ${i % 10}`,
      gstin: '',
      outstanding: Math.floor(Math.random() * 10000),
      creditLimit: 50000,
      status: 'Active'
    });
  }
  localStorage.setItem('customers', JSON.stringify(customers));

  // 3. 1000 Dealers
  console.log("Generating 1,000 Dealers...");
  const dealers = [];
  for(let i=1; i<=1000; i++) {
    dealers.push({
      id: generateId('DLR', i),
      name: `Dealer ${i} Supplies`,
      contactPerson: `Manager ${i}`,
      phone: `99${String(i).padStart(8, '0')}`,
      email: `dealer${i}@supplies.com`,
      address: `Dealer St ${i}`,
      gstin: `33AAACC1234D${i%10}Z5`,
      outstanding: Math.floor(Math.random() * 50000),
      status: 'Active'
    });
  }
  localStorage.setItem('dealers', JSON.stringify(dealers));

  // 4. 1000 Projects
  console.log("Generating 1,000 Projects...");
  const projects = [];
  for(let i=1; i<=1000; i++) {
    projects.push({
      id: generateId('PRJ', i),
      title: `Site ${i} Construction`,
      customer: `Customer ${Math.floor(Math.random() * 3000) + 1} BuildCo`,
      budget: Math.floor(Math.random() * 500000) + 50000,
      status: ['Planned', 'Ongoing', 'Completed'][Math.floor(Math.random() * 3)],
      invoices: []
    });
  }
  localStorage.setItem('house_projects', JSON.stringify(projects));

  // 5. 10,000 Sales
  console.log("Generating 10,000 Sales Invoices...");
  const sales = [];
  for(let i=1; i<=10000; i++) {
    sales.push({
      id: generateId('INV', i),
      date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      customerId: generateId('CUST', Math.floor(Math.random() * 3000) + 1),
      type: 'B2C',
      items: [{
        productId: generateId('PRD', Math.floor(Math.random() * 5000) + 1),
        qty: Math.floor(Math.random() * 10) + 1,
        price: 500,
        gst: 18,
        total: 5900
      }],
      subtotal: 5000,
      taxAmount: 900,
      totalAmount: 5900,
      paidAmount: 5900,
      status: 'Paid'
    });
  }
  localStorage.setItem('sales_invoices', JSON.stringify(sales));

  // 6. 10,000 Purchases
  console.log("Generating 10,000 Purchases...");
  const purchases = [];
  for(let i=1; i<=10000; i++) {
    purchases.push({
      id: generateId('PUR', i),
      date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
      dealerId: generateId('DLR', Math.floor(Math.random() * 1000) + 1),
      invoiceNo: `EXT-INV-${i}`,
      items: [{
        productId: generateId('PRD', Math.floor(Math.random() * 5000) + 1),
        qty: Math.floor(Math.random() * 50) + 10,
        price: 300,
        gst: 18,
        total: 3540
      }],
      subtotal: 3000,
      taxAmount: 540,
      totalAmount: 3540,
      paidAmount: 3540,
      status: 'Paid'
    });
  }
  localStorage.setItem('purchase_invoices', JSON.stringify(purchases));

  // 7. 5,000 Returns (2500 Sales, 2500 Purchase)
  console.log("Generating 5,000 Returns...");
  const salesReturns = [];
  const purchaseReturns = [];
  for(let i=1; i<=2500; i++) {
    salesReturns.push({
      id: generateId('SR', i),
      date: new Date().toISOString(),
      invoiceId: generateId('INV', Math.floor(Math.random() * 10000) + 1),
      customerId: generateId('CUST', Math.floor(Math.random() * 3000) + 1),
      totalAmount: 590,
      status: 'Completed'
    });
    purchaseReturns.push({
      id: generateId('PR', i),
      date: new Date().toISOString(),
      poId: generateId('PUR', Math.floor(Math.random() * 10000) + 1),
      dealerId: generateId('DLR', Math.floor(Math.random() * 1000) + 1),
      totalAmount: 354,
      status: 'Completed'
    });
  }
  localStorage.setItem('sales_returns', JSON.stringify(salesReturns));
  localStorage.setItem('purchase_returns', JSON.stringify(purchaseReturns));

  const end = performance.now();
  console.log(`Dummy Data Generation Complete! Took ${((end - start)/1000).toFixed(2)} seconds.`);
  console.log("Please refresh the page to see the new data.");
})();
