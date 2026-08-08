import { DataProvider } from '../dataProvider.js';
import { InvoiceService } from './invoiceService.js';
import { InventoryService } from './inventoryService.js';
import { SupplierService } from './supplierService.js';

export const PurchaseService = {
  save(state) {
    const supplier = SupplierService.find(state.header.supplierId);
    const invoice = {
      id: InvoiceService.next('purchase'),
      supplierId: state.header.supplierId,
      supplierName: supplier ? supplier.name : 'Unknown',
      date: state.header.date,
      refNo: state.header.refNo,
      items: state.items,
      summary: state.summary,
      paymentMode: state.header.paymentMode,
      status: 'Completed',
      createdAt: new Date().toISOString()
    };
    
    // Save to data provider
    DataProvider.savePurchaseInvoice(invoice); // assuming this exists or will exist
    
    // Increase stock based on purchase
    invoice.items.forEach(item => {
      // For purchase, we adjust stock positively
      InventoryService.adjust(item.productId, item.qty);
    });
    
    return invoice;
  }
};
