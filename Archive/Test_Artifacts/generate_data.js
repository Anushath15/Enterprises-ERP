const fs = require('fs');
const path = require('path');

function generateMassiveData() {
  const products = [];
  for(let i=1; i<=20000; i++) {
    products.push({
      id: 'PRD-' + String(i).padStart(5, '0'),
      name: 'Test Hardware Product ' + i,
      category: 'Tools',
      buyingPrice: Math.random() * 500,
      price: Math.random() * 800 + 500,
      stock: Math.floor(Math.random() * 100),
      isActive: true,
      barcode: '890' + String(i).padStart(10, '0')
    });
  }

  const customers = [];
  for(let i=1; i<=10000; i++) {
    customers.push({
      id: 'CST-' + String(i).padStart(5, '0'),
      name: 'Customer ' + i,
      phone: '98' + String(i).padStart(8, '0'),
      credit: Math.random() * 1000
    });
  }

  const dealers = [];
  for(let i=1; i<=5000; i++) {
    dealers.push({
      id: 'DLR-' + String(i).padStart(5, '0'),
      name: 'Dealer ' + i,
      companyName: 'Supplier Co ' + i,
      phone: '97' + String(i).padStart(8, '0')
    });
  }
  
  // Sales invoices
  const invoices = [];
  for(let i=1; i<=10000; i++) {
    invoices.push({
      id: 'INV-' + String(i).padStart(5, '0'),
      date: new Date().toISOString(),
      customerName: 'Customer ' + (i % 10000),
      totalAmount: Math.random() * 5000 + 100,
      items: [{ productId: 'PRD-00001', name: 'Item', qty: 1, price: 100, total: 100 }]
    });
  }
  
  const data = {
    erp_products: products,
    erp_customers: customers,
    erp_dealers: dealers,
    erp_invoices: invoices
  };
  
  fs.writeFileSync('massive_data.json', JSON.stringify(data));
  console.log('Massive data generated.');
}

generateMassiveData();
