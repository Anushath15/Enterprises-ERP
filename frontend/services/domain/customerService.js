import { DataProvider } from '../dataProvider.js';

export const CustomerService = {
  search(query = '') {
    const customers = DataProvider.getCustomers();
    if (!query) return customers;
    return customers.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
  },
  
  find(id) {
    return DataProvider.getCustomerById(id);
  },
  
  creditLimit(id) {
    const customer = this.find(id);
    return customer ? (customer.creditLimit || 0) : 0;
  }
};
