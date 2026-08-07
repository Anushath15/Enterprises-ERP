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
      const mode = item.pricingMode || 'inclusive'; // fallback to inclusive for backward compatibility

      // Line logic
      const rawGross = qty * price;
      const discAmt = rawGross * (itemDisc / 100);
      const amountAfterDisc = rawGross - discAmt;

      let taxable = 0;
      let gstAmt = 0;

      if (mode === 'inclusive') {
        taxable = amountAfterDisc / (1 + (gstPercent / 100));
        gstAmt = amountAfterDisc - taxable;
      } else {
        taxable = amountAfterDisc;
        gstAmt = taxable * (gstPercent / 100);
      }

      subtotal += taxable;
      taxAmount += gstAmt;
    });

    const docDiscountAmt = subtotal * (parseFloat(discount) / 100);
    const finalTaxable = subtotal - docDiscountAmt;

    // Adjust tax if document level discount applied proportionally
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
    const mode = item.pricingMode || 'inclusive';

    const rawGross = qty * price;
    const discAmt = rawGross * (itemDisc / 100);
    const amountAfterDisc = rawGross - discAmt;

    let taxable = 0;
    let gstAmt = 0;

    if (mode === 'inclusive') {
      taxable = amountAfterDisc / (1 + (gstPercent / 100));
      gstAmt = amountAfterDisc - taxable;
    } else {
      taxable = amountAfterDisc;
      gstAmt = taxable * (gstPercent / 100);
    }

    const lineTotal = taxable + gstAmt;

    return { gstAmt, lineTotal, taxable };
  }
};
