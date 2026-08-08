/**
 * Senthil Enterprises ERP - Export Utilities
 * ------------------------------------------------------------------
 * Shared, presentation-only helpers for the Export Center.
 * No business logic lives here; only formatting + a single column
 * registry + download mechanics reused by CSV / Excel / PDF so that
 * export logic is never duplicated across formats.
 */

/** Indian currency: ₹12,34,567.89 (en-IN). */
export function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return '₹0.00';
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Indian date: DD/MM/YYYY (ISO 8601 date/datetime in -> DD/MM/YYYY). */
export function formatDate(value) {
  if (!value) return '';
  const v = String(value).trim();
  const d = new Date(v);
  if (!(d instanceof Date) || isNaN(d.getTime())) return v;
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatDateTime(value) {
  const d = value instanceof Date ? value : new Date(value || '');
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN');
}

/** Escape a value for a CSV field (handles commas, quotes, newlines, UTF-8). */
export function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/** Format a cell value by column type. */
export function formatCell(value, type) {
  if (value === null || value === undefined) return '';
  switch (type) {
    case 'currency': return formatCurrency(value);
    case 'number': return Number(value);
    case 'date': return formatDate(value);
    case 'datetime': return formatDateTime(value);
    case 'phone': return String(value);
    default: return String(value);
  }
}

/**
 * Column registry — the SINGLE source of truth for every exportable
 * dataset's shape. CSV, Excel and PDF all read from this object, so column
 * headers / field names never drift between formats.
 *
 * Each entry:
 *   - reader: 'provider' | 'storage:<key>'  (how ExportService fetches rows)
 *   - columns: [{ header, field, type }]
 *   - filename: template using {date} (YYYY-MM-DD)
 */
export const EXPORT_COLUMNS = {
  products: {
    reader: 'provider', readerMethod: 'getProducts',
    filename: 'Products_{date}',
    columns: [
      { header: 'Product ID', field: 'id', type: 'text' },
      { header: 'SKU', field: 'sku', type: 'text' },
      { header: 'Barcode', field: 'barcode', type: 'text' },
      { header: 'Name', field: 'name', type: 'text' },
      { header: 'Category', field: 'category', type: 'text' },
      { header: 'Stock', field: 'stock', type: 'number' },
      { header: 'Unit', field: 'unit', type: 'text' },
      { header: 'Min Stock', field: 'minStock', type: 'number' },
      { header: 'Selling Price', field: 'price', type: 'currency' },
      { header: 'Buying Price', field: 'buyingPrice', type: 'currency' },
      { header: 'GST %', field: 'gst', type: 'number' },
      { header: 'HSN', field: 'hsn', type: 'text' },
      { header: 'Status', field: 'status', type: 'text' }
    ]
  },
  customers: {
    reader: 'provider', readerMethod: 'getCustomers',
    filename: 'Customers_{date}',
    columns: [
      { header: 'Customer ID', field: 'id', type: 'text' },
      { header: 'Name', field: 'name', type: 'text' },
      { header: 'Phone', field: 'phone', type: 'phone' },
      { header: 'Email', field: 'email', type: 'text' },
      { header: 'GSTIN', field: 'gst', type: 'text' },
      { header: 'Type', field: 'type', type: 'text' },
      { header: 'Credit Limit', field: 'creditLimit', type: 'currency' },
      { header: 'Outstanding', field: 'outstanding', type: 'currency' },
      { header: 'Address', field: 'address', type: 'text' }
    ]
  },
  dealers: {
    reader: 'provider', readerMethod: 'getDealers',
    filename: 'Dealers_{date}',
    columns: [
      { header: 'Dealer ID', field: 'id', type: 'text' },
      { header: 'Name', field: 'name', type: 'text' },
      { header: 'Company', field: 'companyName', type: 'text' },
      { header: 'Phone', field: 'phone', type: 'phone' },
      { header: 'Email', field: 'email', type: 'text' },
      { header: 'GSTIN', field: 'gst', type: 'text' },
      { header: 'Contact Person', field: 'contactPerson', type: 'text' },
      { header: 'Total Purchased', field: 'totalPurchased', type: 'currency' },
      { header: 'Outstanding', field: 'outstanding', type: 'currency' }
    ]
  },
  sales: {
    reader: 'provider', readerMethod: 'getSalesInvoices',
    filename: 'Sales_Invoices_{date}',
    columns: [
      { header: 'Invoice ID', field: 'id', type: 'text' },
      { header: 'Date', field: 'date', type: 'date' },
      { header: 'Customer', field: 'customerName', type: 'text' },
      { header: 'Customer ID', field: 'customerId', type: 'text' },
      { header: 'Items', field: 'items', type: 'number' },
      { header: 'Total Amount', field: 'totalAmount', type: 'currency' },
      { header: 'Amount Paid', field: 'amountPaid', type: 'currency' },
      { header: 'Balance', field: 'balance', type: 'currency' },
      { header: 'Payment Mode', field: 'paymentMode', type: 'text' },
      { header: 'Status', field: 'status', type: 'text' }
    ]
  },
  purchases: {
    reader: 'provider', readerMethod: 'getPurchaseInvoices',
    filename: 'Purchase_Invoices_{date}',
    columns: [
      { header: 'PO ID', field: 'id', type: 'text' },
      { header: 'Invoice No', field: 'invoiceNumber', type: 'text' },
      { header: 'Date', field: 'date', type: 'date' },
      { header: 'Dealer', field: 'dealerName', type: 'text' },
      { header: 'Dealer ID', field: 'supplierId', type: 'text' },
      { header: 'Items', field: 'items', type: 'number' },
      { header: 'Total Amount', field: 'totalAmount', type: 'currency' },
      { header: 'Amount Paid', field: 'amountPaid', type: 'currency' },
      { header: 'Balance', field: 'balance', type: 'currency' },
      { header: 'Status', field: 'status', type: 'text' }
    ]
  },
  expenses: {
    reader: 'provider', readerMethod: 'getExpenses',
    filename: 'Expenses_{date}',
    columns: [
      { header: 'Expense ID', field: 'id', type: 'text' },
      { header: 'Date', field: 'date', type: 'date' },
      { header: 'Amount', field: 'amount', type: 'currency' },
      { header: 'Category', field: 'category', type: 'text' },
      { header: 'Description', field: 'description', type: 'text' },
      { header: 'Payment Mode', field: 'paymentMode', type: 'text' }
    ]
  },
  inventory: {
    reader: 'provider', readerMethod: 'getProducts',
    filename: 'Inventory_{date}',
    columns: [
      { header: 'Product ID', field: 'id', type: 'text' },
      { header: 'SKU', field: 'sku', type: 'text' },
      { header: 'Name', field: 'name', type: 'text' },
      { header: 'Category', field: 'category', type: 'text' },
      { header: 'Current Stock', field: 'stock', type: 'number' },
      { header: 'Unit', field: 'unit', type: 'text' },
      { header: 'Avg Cost', field: 'avgCost', type: 'currency' },
      { header: 'Selling Price', field: 'price', type: 'currency' },
      { header: 'Stock Value', field: 'totalValue', type: 'currency' }
    ]
  },
  daily_closing: {
    reader: 'storage:erp_daily_closings',
    filename: 'Daily_Closing_{date}',
    columns: [
      { header: 'Closing ID', field: 'id', type: 'text' },
      { header: 'Date', field: 'date', type: 'date' },
      { header: 'Opening Cash', field: 'openingCash', type: 'currency' },
      { header: 'Cash Sales', field: 'cashSales', type: 'currency' },
      { header: 'UPI Sales', field: 'upiSales', type: 'currency' },
      { header: 'Card Sales', field: 'cardSales', type: 'currency' },
      { header: 'Credit Sales', field: 'creditSales', type: 'currency' },
      { header: 'Total Expenses', field: 'totalExpenses', type: 'currency' },
      { header: 'Expected Cash', field: 'expectedCash', type: 'currency' },
      { header: 'Actual Cash', field: 'actualCash', type: 'currency' },
      { header: 'Difference', field: 'difference', type: 'currency' },
      { header: 'Remarks', field: 'remarks', type: 'text' }
    ]
  }
};

/** Column headers array (reused by CSV / Excel / PDF). */
export function getHeaders(columns) {
  return columns.map(c => c.header);
}

/** Map a single data record to a row of formatted cells, per the column registry. */
export function toRow(record, columns) {
  return columns.map(col => {
    let raw = record == null ? '' : record[col.field];
    return formatCell(raw, col.type);
  });
}

export const EXPORT_FORMATS = ['csv', 'excel', 'pdf'];

export function buildFilename(prefix) {
  const d = new Date();
  const date = d.toISOString().split('T')[0];
  let file;
  try { file = prefix.replace('{date}', date); } catch { file = prefix; }
  return file;
}

/** Trigger a browser download for a Blob (CSV / file). */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Trigger a browser download for a byte array (Excel / PDF). */
export function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  downloadBlob(blob, filename);
}

/** Convert CSV rows to a UTF-8 BOM CSV string (Excel-friendly + UTF-8 safe). */
export function rowsToCsv(headers, rows) {
  const lines = [headers.map(h => csvEscape(h)).join(',')];
  for (const row of rows) {
    lines.push(row.map(v => csvEscape(v)).join(','));
  }
  // UTF-8 BOM ensures Excel interprets the file correctly.
  return '\uFEFF' + lines.join('\r\n');
}
