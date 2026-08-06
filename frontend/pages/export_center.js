/**
 * Senthil Enterprises ERP - Production Export Center
 * ------------------------------------------------------------------
 * Single screen to export any dataset (Products, Customers, Dealers,
 * Sales Invoices, Purchase Invoices, Expenses, Inventory, Daily Closing)
 * in CSV / Excel (.xlsx) / PDF formats, reusing shared utilities.
 */
import { ExportService } from '../services/exportService.js';
import { NotificationService } from '../services/notificationService.js';

function rowOf(label, count) {
  return `<tr class="border-b border-gray-100">
    <td class="py-3 pr-4 font-medium text-gray-900">${label}</td>
    <td class="py-3 text-right font-mono text-gray-600">${count.toLocaleString('en-IN')}</td>
  </tr>`;
}

export async function render() {
  const datasets = ExportService.getDatasets();
  const counts = {};
  const ds = datasets.map(d => {
    try {
      counts[d.key] = ExportService._count(d.key);
    } catch { counts[d.key] = '?'; }
    return d;
  });

  const options = ds.map(d =>
    `<option value="${d.key}">${d.label} (${counts[d.key]})</option>`
  ).join('');

  return `
    <div class="p-6 max-w-3xl mx-auto fade-in pb-16">
      <div class="bg-white erp-card p-6 mb-6 border-t-4 border-t-primary">
        <h1 class="text-2xl font-bold text-text mb-1">Production Export Center</h1>
        <p class="text-sm text-gray-500">
          Export master data, invoices, expenses, inventory and daily-closing records
          in CSV, Excel (.xlsx) or PDF. All values use Indian currency formatting;
          dates are preserved as entered.
        </p>
      </div>

      <div class="bg-white erp-card p-6 space-y-5">
        <div class="space-y-2">
          <label for="export-dataset" class="block text-sm font-medium text-gray-700">Dataset</label>
          <select id="export-dataset" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary">${options}</select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button id="export-csv"   type="button"
            class="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2.5 px-4 rounded-md transition">
            <i data-lucide="file-text" class="w-4 h-4"></i> CSV
          </button>
          <button id="export-excel" type="button"
            class="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-md transition">
            <i data-lucide="file-spreadsheet" class="w-4 h-4"></i> Excel (.xlsx)
          </button>
          <button id="export-pdf"   type="button"
            class="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-md transition">
            <i data-lucide="file-type-2" class="w-4 h-4"></i> PDF
          </button>
        </div>

        <div class="border-t border-gray-100 pt-4">
          <p class="text-xs text-gray-500 mb-2">Record counts by dataset:</p>
          <table class="w-full text-sm">
            <tbody>
              ${datasets.map(d => rowOf(d.label, counts[d.key])).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  const __listeners = [];
  const _origAddEventListener = rootElement.addEventListener;
  rootElement.addEventListener = function(type, listener, options) {
    __listeners.push({ target: rootElement, type, listener, options });
    _origAddEventListener.call(rootElement, type, listener, options);
  };
  const _origWindowAdd = window.addEventListener;
  const _origDocAdd = document.addEventListener;
  const trackedWindowDoc = [];
  window.addEventListener = function(type, listener, options) {
     trackedWindowDoc.push({ target: window, type, listener, options });
     _origWindowAdd.call(window, type, listener, options);
  };
  document.addEventListener = function(type, listener, options) {
     trackedWindowDoc.push({ target: document, type, listener, options });
     _origDocAdd.call(document, type, listener, options);
  };
  
  const dropdown = document.getElementById('export-dataset');
  const summary = () => {
    const key = dropdown ? dropdown.value : '';
    if (key) {
      const count = ExportService._count(key);
      const label = ExportService.getLabel(key);
    }
  };

  const bind = (id, format) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const key = dropdown ? dropdown.value : '';
      ExportService.export(key, format);
    });
  };
  bind('export-csv', 'csv');
  bind('export-excel', 'excel');
  bind('export-pdf', 'pdf');

  // Refresh counts when the dataset changes.
  if (dropdown) dropdown.addEventListener('change', summary);

  // Re-render lucide icons (icons used in nav) if available.
  if (window.lucide) {
    window.lucide.createIcons();
  }

  return function cleanup() {
    __listeners.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    trackedWindowDoc.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    window.addEventListener = _origWindowAdd;
    document.addEventListener = _origDocAdd;

    // No persistent timers/subscriptions held.
  };
}
