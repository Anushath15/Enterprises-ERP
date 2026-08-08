import { NotificationService } from '../../services/notificationService.js';
import { TransactionActions } from '../../components/transaction/TransactionActions.js';
import { purchaseReducer } from './purchaseReducer.js';
import { InvoiceService } from '../../services/domain/invoiceService.js';
import { SupplierService } from '../../services/domain/supplierService.js';
import { PurchaseService } from '../../services/domain/purchaseService.js';
import { transactionValidations } from '../../utils/validate.js';
import { CellRenderers } from '../../components/transaction/renderers/CellRenderers.js';

export const PurchaseConfig = {
  moduleName: 'purchases',
  entityLabel: 'Supplier',
  entityPlural: 'Suppliers',
  entityIdField: 'supplierId',

  validations: transactionValidations({
    entityIdField: 'supplierId',
    entityLabel: 'Supplier',
    priceField: 'purchasePrice',
    priceLabel: 'Purchase Price'
  }),
  
  pricing: {
    field: 'purchasePrice',
    label: 'Purchase Price',
    allowManualDiscount: true,
    allowPriceOverride: true,
    allowNegativeMargin: true
  },
  
  customerRules: null, // Purchases do not use customer rules
  
  services: {
    entity: (dp) => SupplierService.search(),
    invoice: InvoiceService,
    inventory: null // Purchases do not decrease stock
  },

  ui: {
    showMargin: false,
    showAvailableStock: false,
    showPaymentSection: true
  },
  
  reducer: purchaseReducer,
  
  columns: [
    { key: 'index', label: '#', align: 'text-center', width: 'w-6', renderer: CellRenderers.IndexCell },
    { key: 'barcode', label: 'Barcode', width: 'w-16', renderer: CellRenderers.BarcodeCell },
    { key: 'product', label: 'Product', width: 'min-w-[150px]', renderer: CellRenderers.TextCell },
    { key: 'unit', label: 'Unit', align: 'text-center', width: 'w-12', renderer: CellRenderers.UnitCell },
    { key: 'qty', label: 'Qty', align: 'text-center', width: 'w-20', renderer: CellRenderers.NumberInputCell },
    { key: 'purchasePrice', label: 'Purchase Price', align: 'text-right', width: 'w-24', renderer: CellRenderers.CurrencyInputCell },
    { key: 'discount', label: 'Disc %', align: 'text-right', width: 'w-16', min: 0, renderer: CellRenderers.NumberInputCell },
    { key: 'gst', label: 'GST %', align: 'text-right', width: 'w-20', min: 0, renderer: CellRenderers.NumberInputCell },
    { key: 'gstAmt', label: 'GST Amt', align: 'text-right', width: 'w-20', compute: 'gstAmt', renderer: CellRenderers.ComputedLineCell },
    { key: 'lineTotal', label: 'Line Total', align: 'text-right', width: 'w-24', compute: 'lineTotal', bold: true, renderer: CellRenderers.ComputedLineCell },
    { key: 'action', label: '', align: 'text-center', width: 'w-10', renderer: CellRenderers.ActionCell }
  ],

  // Specific save implementation for Purchases
  onSave: (state, store) => {
    const saveBtn = document.querySelector('#btn-save-txn');
    if (saveBtn) {
      saveBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Saving...';
      saveBtn.disabled = true;
    }

    setTimeout(() => {
      PurchaseService.save(state);
      store.dispatch({ type: TransactionActions.CLEAR_DRAFT });
      store.dispatch({ type: TransactionActions.RESET, payload: {
        header: { supplierId: '', refNo: '', date: new Date().toISOString().split('T')[0] },
        items: [],
        summary: { subtotal: 0, discountAmount: 0, taxAmount: 0, roundOff: 0, grandTotal: 0, discount: 0 },
        payment: { status: 'Pending', mode: '' },
        metadata: { dirty: false, draftVersion: 1, createdAt: null, updatedAt: null }
      }});
      NotificationService.success('Purchase Order saved successfully!');
      window.location.hash = '#/purchases';
    }, 800);
  }
};
