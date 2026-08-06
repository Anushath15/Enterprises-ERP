/**
 * Pure function Calculator for Transaction modules.
 * Must NOT read from or mutate the store.
 */
export const TransactionCalculator = {
  calculateDocument({ items, discount = 0, roundOff = 0, priceField = 'purchasePrice' }) {
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      const qty = parseFloat(item.qty) || 0;
      const price = parseFloat(item[priceField]) || 0;
      const itemDisc = parseFloat(item.discount) || 0;
      const gstPercent = parseFloat(item.gst) || 0;

      // Line logic
      const gross = qty * price;
      const discAmt = gross * (itemDisc / 100);
      const taxable = gross - discAmt;
      const gstAmt = taxable * (gstPercent / 100);
      const lineTotal = taxable + gstAmt;

      subtotal += taxable;
      taxAmount += gstAmt;
    });

    const docDiscountAmt = subtotal * (parseFloat(discount) / 100);
    const finalTaxable = subtotal - docDiscountAmt;

    // We assume taxAmount is already computed linearly per line above, but doc discount might reduce it proportionately
    // For ERP standard, usually line discounts apply first. Document discount applies to final sum.
    // If doc discount applies, the GST should technically be reduced too.
    // For simplicity following the existing purchase calculator:
    const adjustedTax = taxAmount * (1 - (parseFloat(discount) / 100));

    let grandTotal = finalTaxable + adjustedTax;

    // Apply roundoff (can be positive or negative)
    const ro = parseFloat(roundOff) || 0;
    grandTotal += ro;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      discountAmount: parseFloat(docDiscountAmt.toFixed(2)),
      taxAmount: parseFloat(adjustedTax.toFixed(2)),
      roundOff: parseFloat(ro.toFixed(2)),
      grandTotal: Math.round(grandTotal)
    };
  },

  calculateLine(item, priceField = 'purchasePrice') {
    const qty = parseFloat(item.qty) || 0;
    const price = parseFloat(item[priceField]) || 0;
    const itemDisc = parseFloat(item.discount) || 0;
    const gstPercent = parseFloat(item.gst) || 0;

    const gross = qty * price;
    const discAmt = gross * (itemDisc / 100);
    const taxable = gross - discAmt;
    const gstAmt = taxable * (gstPercent / 100);
    const lineTotal = taxable + gstAmt;

    return { gstAmt, lineTotal, taxable };
  }
};
