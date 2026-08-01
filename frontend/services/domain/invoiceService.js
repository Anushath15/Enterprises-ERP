import { DataProvider } from '../dataProvider.js';

export const InvoiceService = {
  next(type) {
    const year = new Date().getFullYear();
    let prefix = '';
    
    switch (type) {
      case 'sales': prefix = `SAL-${year}-`; break;
      case 'purchase': prefix = `PUR-${year}-`; break;
      case 'purchase_return': prefix = `PR-${year}-`; break;
      case 'sales_return': prefix = `SR-${year}-`; break;
      case 'stock_adjustment': prefix = `SA-${year}-`; break;
      default: prefix = `TXN-${year}-`; break;
    }
    
    // Abstracted call to DataProvider to get the next sequence number for this prefix
    // For now we'll just use DataProvider's generateId and assume it returns an incrementing number
    const sequenceNumber = DataProvider.getNextSequence(type);
    
    // Format sequence with 6 padding zeros: 000001
    const paddedSequence = String(sequenceNumber).padStart(6, '0');
    
    return `${prefix}${paddedSequence}`;
  }
};
