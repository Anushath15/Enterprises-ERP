import { DataProvider } from '../dataProvider.js';

export const ProductService = {
  search(query = '') {
    const products = DataProvider.getProducts();
    if (!query) return products;
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
      (p.barcode && p.barcode.toLowerCase().includes(lowerQuery)) ||
      (p.code && p.code.toLowerCase().includes(lowerQuery))
    );
  },
  
  find(id) {
    const products = DataProvider.getProducts();
    return products.find(p => p.id === id);
  }
};
