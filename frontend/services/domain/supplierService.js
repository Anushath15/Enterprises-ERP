import { DataProvider } from '../dataProvider.js';

export const SupplierService = {
  search(query = '') {
    const suppliers = DataProvider.getDealers(); // getDealers returns suppliers
    if (!query) return suppliers;
    return suppliers.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  },
  
  find(id) {
    const suppliers = DataProvider.getDealers();
    return suppliers.find(s => s.id === id);
  }
};
