export const TransactionValidation = (config) => {
  return {
    validate(state) {
      const errors = [];
      
      // Header validations
      if (!state.header[config.entityIdField]) errors.push(`${config.entityLabel} is required`);
      if (!state.header.refNo) errors.push('Invoice / Ref number is required');
      if (!state.header.date) errors.push('Date is required');
      
      // Items validations
      if (!state.items || state.items.length === 0) {
        errors.push('At least one product is required');
      } else {
        const priceFieldStr = config.pricing?.field || config.priceField || 'purchasePrice';
        const priceLabelStr = config.pricing?.label || config.priceLabel || 'Price';
        state.items.forEach((item, idx) => {
          if (!item.productId) errors.push(`Row ${idx + 1}: Product is required`);
          if (Number(item.qty) <= 0) errors.push(`Row ${idx + 1}: Quantity must be > 0`);
          if (Number(item[priceFieldStr]) <= 0) errors.push(`Row ${idx + 1}: ${priceLabelStr} must be > 0`);
        });
      }
      
      // Summary validations
      if (state.summary && state.summary.grandTotal <= 0) {
         errors.push('Grand total must be > 0');
      }
      
      // Allow custom validation injection
      if (config.customValidation) {
         const customErrors = config.customValidation(state);
         if (customErrors && customErrors.length > 0) {
            errors.push(...customErrors);
         }
      }

      return errors;
    }
  };
};
