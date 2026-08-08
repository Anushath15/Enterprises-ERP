import { DataProvider } from '../dataProvider.js';
import { InvoiceService } from './invoiceService.js';
import { SupplierService } from './supplierService.js';

export const PurchaseService = {
  save(state) {
    const supplier = SupplierService.find(state.header.supplierId);
    
    let parsedAmountPaid = state.summary.grandTotal;
    if (state.payment.mode !== 'Credit') {
       parsedAmountPaid = Number(state.payment.amountPaid) || state.summary.grandTotal;
    }

    const isPaidFull = parsedAmountPaid >= state.summary.grandTotal;
    const paymentStatus = state.payment.mode === 'Credit' ? 'Pending' : (isPaidFull ? 'Paid Full' : 'Partial');
    const invoiceStatus = state.payment.mode === 'Credit' ? 'Pending' : (isPaidFull ? 'Paid' : 'Partial');

    const invoice = {
      id: InvoiceService.next('purchase'),
      supplierId: state.header.supplierId,
      supplierName: supplier ? supplier.name : 'Unknown',
      dealerId: state.header.supplierId, // reports expect dealerId
      dealerName: supplier ? supplier.name : 'Unknown',
      date: state.header.date || new Date().toISOString(),
      refNo: state.header.refNo,
      items: state.items.map(i => {
         const mode = i.pricingMode || 'inclusive';
         const price = Number(i.purchasePrice || i.price || 0);
         const rawBase = price * Number(i.qty || 0);
         const rawDisc = rawBase * ((Number(i.discount) || 0) / 100);
         const rawAfterDisc = rawBase - rawDisc;
         const gstPercent = Number(i.gst || i.taxRate || 0);
         const gstFactor = 1 + (gstPercent / 100);
         let lineTaxable = 0, lineTax = 0;
         if (mode === 'inclusive') {
           lineTaxable = rawAfterDisc / gstFactor;
           lineTax = rawAfterDisc - lineTaxable;
         } else {
           lineTaxable = rawAfterDisc;
           lineTax = lineTaxable * (gstPercent / 100);
         }
         return {
           productId: i.productId || i.id,
           name: i.name,
           qty: i.qty,
           price: price, // normalize to expected price field
           costPrice: price, // B-143 fix: explicitly set costPrice
           taxRate: gstPercent,
           pricingMode: mode,
           discountPercent: i.discount || 0,
           discountAmount: rawDisc,
           total: lineTaxable + lineTax
         };
      }),
      subtotal: state.summary.subtotal,
      discount: state.summary.discountAmount,
      taxableAmount: state.summary.subtotal - (state.summary.discountAmount || 0),
      taxTotal: state.summary.taxAmount,
      cgstTotal: state.summary.taxAmount / 2,
      sgstTotal: state.summary.taxAmount / 2,
      totalAmount: state.summary.grandTotal,
      total: state.summary.grandTotal, // some pages check inv.total
      paymentMode: state.payment.mode,
      paymentStatus: paymentStatus,
      amountPaid: state.payment.mode === 'Credit' ? 0 : parsedAmountPaid,
      status: invoiceStatus,
      summary: state.summary,
      createdAt: new Date().toISOString()
    };
    
    // Save to data provider (adjusts stock internally via net delta)
    DataProvider.savePurchaseInvoice(invoice);
    
    return invoice;
  }
};
