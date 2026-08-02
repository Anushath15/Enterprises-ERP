/**
 * Senthil Enterprises ERP - Export Service
 * ------------------------------------------------------------------
 * Orchestrates dataset export for the Export Center.
 *
 * Responsibilities:
 *  - Fetch a dataset by key (via DataProvider or direct storage for the
 *    daily-closing table which is not exposed on the provider API).
 *  - Augment raw records with display fields (customer/dealer names, derived
 *    totals, balances) so the column registry stays presentation-only.
 *  - Build the same row set once, then dispatch to CSV / Excel / PDF — no
 *    duplicated export logic across formats.
 *  - Handle empty datasets gracefully.
 *  - 10,000+ records: rows are generated lazily/inline and blobs streamed via
 *    the browser; nothing materializes a second copy of the dataset.
 */
import { LocalStorageService } from './storage/localStorageService.js';
import { DataProvider } from './dataProvider.js';
import { NotificationService } from './notificationService.js';
import {
  EXPORT_COLUMNS, EXPORT_FORMATS, formatCell, getHeaders, toRow,
  rowsToCsv, downloadBlob, downloadBytes, buildFilename, formatCurrency, formatDate
} from '../utils/exportUtils.js';

const DATASET_LABELS = {
  products: 'Products', customers: 'Customers', dealers: 'Dealers',
  sales: 'Sales Invoices', purchases: 'Purchase Invoices',
  expenses: 'Expenses', inventory: 'Inventory', daily_closing: 'Daily Closing'
};

/** Resolve display names for invoice/dealer relationships once. */function withNames(rows, type) {
  if (type === 'sales') {
    const customers = DataProvider.getCustomers() || [];
    const byId = new Map(customers.map(c => [c.id, c.name || c.companyName || 'Walk-in Customer']));
    return rows.map(r => ({
      ...r,
      customerName: (r.customerId && byId.get(r.customerId)) || r.customerName || 'Walk-in Customer',
      items: Array.isArray(r.items) ? r.items.length : 0,
      amountPaid: Number(r.amountPaid || r.totalAmount || 0),
      balance: Number(r.totalAmount || 0) - Number(r.amountPaid || r.totalAmount || 0)
    }));
  }
  if (type === 'purchases') {
    const dealers = DataProvider.getDealers() || [];
    const byId = new Map(dealers.map(d => [d.id, d.companyName || d.name || 'Unknown']));
    return rows.map(r => ({
      ...r,
      dealerName: (r.supplierId && byId.get(r.supplierId)) || r.dealerName || 'Unknown',
      items: Array.isArray(r.items) ? r.items.length : 0,
      amountPaid: Number(r.amountPaid || r.totalAmount || 0),
      balance: Number(r.totalAmount || 0) - Number(r.amountPaid || r.totalAmount || 0)
    }));
  }
  if (type === 'inventory') {
    return rows.map(p => ({
      ...p,
      avgCost: Number(p.avgCost || p.buyingPrice || 0),
      totalValue: Number(p.stock || 0) * Number(p.avgCost || p.buyingPrice || p.price || 0)
    }));
  }
  return rows;
}

function fetchRows(def) {
  if (def.reader === 'provider') {
    const data = DataProvider[def.readerMethod]();
    return Array.isArray(data) ? data : [];
  }
  if (def.reader.startsWith('storage:')) {
    const key = def.reader.slice(8);
    const data = LocalStorageService.get(key);
    return Array.isArray(data) ? data : [];
  }
  return [];
}

export const ExportService = {
  /** Datasets available for export (label + machine key). */
  getDatasets() {
    return Object.keys(DATASET_LABELS).map(k => ({ key: k, label: DATASET_LABELS[k] }));
  },

  getLabel(key) {
    return DATASET_LABELS[key] || key;
  },

  /** Record count for a dataset (for UI previews). Internal use. */
  _count(key) {
    const def = EXPORT_COLUMNS[key];
    if (!def) return 0;
    return fetchRows(def).length;
  },

  /** Export a dataset. `format` is 'csv' | 'excel' | 'pdf'. */
  async export(key, format) {
    if (!EXPORT_COLUMNS[key]) {
      NotificationService.error('Unsupported dataset: ' + key);
      return { ok: false, reason: 'unsupported dataset' };
    }
    if (!EXPORT_FORMATS.includes(format)) {
      NotificationService.error('Unsupported format: ' + format);
      return { ok: false, reason: 'unsupported format' };
    }

    const def = EXPORT_COLUMNS[key];
    const raw = fetchRows(def);
    const records = withNames(raw, key);

    if (records.length === 0) {
      NotificationService.warning('No records to export for ' + DATASET_LABELS[key] + '.');
      return { ok: true, reason: 'empty', count: 0 };
    }

    const headers = getHeaders(def.columns);
    // Build rows once; all formats read from `rows`.
    const rows = records.map(r => toRow(r, def.columns));

    const sheet = DATASET_LABELS[key] + ' Export';
    const dateStr = new Date().toISOString().split('T')[0];
    const base = buildFilename(def.filename).replace('{date}', dateStr);

    try {
      if (format === 'csv') {
        const csv = rowsToCsv(headers, rows);
        downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), base + '.csv');
      } else if (format === 'excel') {
        const bytes = this._toExcel(headers, rows, sheet);
        downloadBytes(bytes, base + '.xlsx');
      } else {
        const bytes = await this._toPdf(headers, rows, DATASET_LABELS[key]);
        downloadBytes(bytes, base + '.pdf');
      }
      NotificationService.success(DATASET_LABELS[key] + ' exported (' + records.length + ' rows) as ' + format.toUpperCase() + '.');
      return { ok: true, count: records.length, format };
    } catch (e) {
      NotificationService.error('Export failed: ' + (e && e.message ? e.message : 'unknown error'));
      return { ok: false, reason: (e && e.message) || 'export error' };
    }
  },

  /** Excel via SheetJS (window.XLSX, already loaded by the app). */
  _toExcel(headers, rows, sheet) {
    if (typeof window === 'undefined' || !window.XLSX) {
      throw new Error('SheetJS (XLSX) library is not loaded.');
    }
    const data = [headers, ...rows];
    const ws = window.XLSX.utils.aoa_to_sheet(data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, sheet);
    const out = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Uint8Array(out);
  },

  /** PDF via jsPDF (window.jspdf, loaded on demand in onMount). Lazy-require. */
  async _toPdf(headers, rows, title) {
    const jspdfMod = await this._loadJsPDF();
    const { jsPDF } = jspdfMod;
    const doc = new jsPDF('p', 'pt');
    const pageW = doc.internal.pageSize.getWidth();
    const lineHeight = 14;
    const margin = 40;
    const colW = Math.floor((pageW - margin * 2) / headers.length);

    doc.setFontSize(10);
    doc.text(title + ' Export', margin, 30);
    doc.setFontSize(8);
    doc.text('Exported: ' + new Date().toLocaleString('en-IN'), margin, 46);

    let y = 60;
    const drawRow = (cells, bold) => {
      if (y > 760) { doc.addPage(); y = 60; }
      cells.forEach((c, i) => {
        if (bold) doc.setFont('helvetica', 'bold'); else doc.setFont('helvetica', 'normal');
        doc.text(String(c), margin + i * colW, y);
      });
      y += lineHeight;
    };

    drawRow(headers, true);
    for (const row of rows) {
      drawRow(row);
    }
    return doc.output('arraybuffer');
  },

  _loadJsPDF() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('jsPDF not available (ssr)'));
      if (window.jspdf && window.jspdf.jsPDF) return resolve(window.jspdf);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf);
        else reject(new Error('jsPDF failed to load'));
      };
      script.onerror = () => reject(new Error('jsPDF CDN unreachable'));
      document.head.appendChild(script);
    });
  }
};
