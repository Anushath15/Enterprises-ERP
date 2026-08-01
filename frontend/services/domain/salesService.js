import { DataProvider } from '../dataProvider.js';
import { InvoiceService } from './invoiceService.js';
import { InventoryService } from './inventoryService.js';
import { CustomerService } from './customerService.js';

export const SalesService = {
  save(state) {
    const customer = CustomerService.find(state.header.customerId);
    const invoice = {
      id: InvoiceService.next('sales'),
      customerId: state.header.customerId,
      customerName: customer ? customer.name : 'Unknown',
      date: state.header.date,
      refNo: state.header.refNo,
      items: state.items,
      summary: state.summary,
      paymentMode: state.header.paymentMode,
      status: 'Completed',
      createdAt: new Date().toISOString()
    };
    
    // Save to data provider
    DataProvider.saveSalesInvoice(invoice);
    
    // Commit the stock changes (permanently reducing stock and clearing reservations)
    invoice.items.forEach(item => {
      InventoryService.commit(item.productId, item.qty);
    });
    
    return invoice;
  },

  delete(id) {
    // TODO: implement when delete flow is formalized
  },
  
  approve(id) {
    // TODO: implement for approval workflows
  },
  
  cancel(id) {
    // TODO: implement for cancelling an invoice
  },
  
  loadDraft() {
    // Return draft from autosave mechanism
  }
};
