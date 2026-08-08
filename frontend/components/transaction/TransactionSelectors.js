export const TransactionSelectors = {
  // Header
  getEntityId: (state, config) => state.header[config?.entityIdField] || '',
  getRefNo: (state) => state.header.refNo || '',
  getDate: (state) => state.header.date || '',
  
  // Items
  getItems: (state) => state.items || [],
  getDeletedItems: (state) => state.deletedItems || [],
  
  // Summary
  getSubtotal: (state) => state.summary?.subtotal || 0,
  getDiscountAmount: (state) => state.summary?.discountAmount || 0,
  getTaxAmount: (state) => state.summary?.taxAmount || 0,
  getRoundOff: (state) => state.summary?.roundOff || 0,
  getGrandTotal: (state) => state.summary?.grandTotal || 0,
  getGlobalDiscount: (state) => state.summary?.discount || 0,
  
  // Payment
  getPaymentStatus: (state) => state.payment?.status || 'Pending',
  getPaymentMode: (state) => state.payment?.mode || '',
  
  // Metadata
  isDirty: (state) => state.metadata?.dirty || false
};
