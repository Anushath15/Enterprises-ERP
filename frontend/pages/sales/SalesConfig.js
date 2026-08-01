import { NotificationService } from '../../services/notificationService.js';
import { TransactionActions } from '../../components/transaction/TransactionActions.js';
import { salesReducer } from './salesReducer.js';
import { InvoiceService } from '../../services/domain/invoiceService.js';
import { CustomerService } from '../../services/domain/customerService.js';
import { SalesService } from '../../services/domain/salesService.js';
import { InventoryService } from '../../services/domain/inventoryService.js';

export const SalesConfig = {
  moduleName: 'sales',
  entityLabel: 'Customer',
  entityPlural: 'Customers',
  entityIdField: 'customerId',
  
  pricing: {
    field: 'sellingPrice',
    label: 'Selling Price',
    allowManualDiscount: true,
    allowPriceOverride: true,
    allowNegativeMargin: false
  },
  
  customerRules: {
    allowCredit: true,
    maxCreditDays: 30,
    allowPartialPayment: true
  },
  
  services: {
    entity: (dp) => CustomerService.search(),
    invoice: InvoiceService,
    inventory: InventoryService
  },

  ui: {
    showMargin: true,
    showAvailableStock: true,
    showPaymentSection: true
  },
  
  reducer: salesReducer,
  
  columns: [
    { key: 'index', label: '#', align: 'text-center', width: 'w-6' },
    { key: 'barcode', label: 'Barcode', width: 'w-16' },
    { key: 'product', label: 'Product', width: 'min-w-[150px]' },
    { key: 'unit', label: 'Unit', align: 'text-center', width: 'w-12' },
    { key: 'qty', label: 'Qty', align: 'text-center', width: 'w-20' },
    { key: 'price', label: 'Selling Price', align: 'text-right', width: 'w-24' },
    { key: 'discount', label: 'Disc %', align: 'text-right', width: 'w-16' },
    { key: 'gst', label: 'GST %', align: 'text-right', width: 'w-20' },
    { key: 'gstAmt', label: 'GST Amt', align: 'text-right', width: 'w-20' },
    { key: 'lineTotal', label: 'Line Total', align: 'text-right', width: 'w-24' },
    { key: 'action', label: '', align: 'text-center', width: 'w-10' }
  ],

  onSave: (state, store) => {
    const saveBtn = document.querySelector('#btn-save-txn');
    if (saveBtn) {
      saveBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Saving...';
      saveBtn.disabled = true;
    }

    setTimeout(() => {
      SalesService.save(state);
      store.dispatch({ type: TransactionActions.CLEAR_DRAFT });
      store.dispatch({ type: TransactionActions.RESET, payload: {
        header: { customerId: '', refNo: '', date: new Date().toISOString().split('T')[0] },
        items: [],
        summary: { subtotal: 0, discountAmount: 0, taxAmount: 0, roundOff: 0, grandTotal: 0, discount: 0 },
        payment: { status: 'Pending', mode: '' },
        metadata: { dirty: false, draftVersion: 1, createdAt: null, updatedAt: null }
      }});
      NotificationService.success('Sales Invoice saved successfully!');
      
      // Clear reservations after successful save since stock is permanently reduced
      InventoryService.clearReservations();
      
      window.location.hash = '#/sales';
    }, 800);
  }
};
