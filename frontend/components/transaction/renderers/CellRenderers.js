import { TransactionCalculator } from '../TransactionCalculator.js';

export const CellRenderers = {
  IndexCell: (item, index, col) => {
    const align = col.align || 'text-left';
    return `<td class="px-2 py-3 ${align} text-xs text-gray-500 font-medium select-none row-index">${index + 1}</td>`;
  },
  
  BarcodeCell: (item, index, col) => {
    const align = col.align || 'text-left';
    const val = item[col.key] || item.sku || '-';
    return `<td class="px-2 py-3 text-xs text-gray-500 truncate max-w-[100px] ${align}" title="${val}">${val}</td>`;
  },
  
  TextCell: (item, index, col) => {
    const align = col.align || 'text-left';
    const val = item[col.key] || '';
    return `<td class="px-2 py-3 text-sm font-medium text-text truncate max-w-[200px] ${align}" title="${val}">${val}</td>`;
  },
  
  UnitCell: (item, index, col) => {
    const align = col.align || 'text-left';
    return `<td class="px-2 py-3 text-xs text-gray-500 ${align}">${item[col.key] || 'pcs'}</td>`;
  },
  
  NumberInputCell: (item, index, col) => {
    const align = col.align || 'text-center';
    const val = item[col.key] || 0;
    const min = col.min !== undefined ? col.min : 1;
    return `<td class="px-2 py-2">
      <input type="number" data-field="${col.key}" value="${val}" min="${min}" step="any" class="po-input w-20 px-2 py-1.5 text-sm font-semibold border border-border rounded bg-white ${align} focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
    </td>`;
  },
  
  CurrencyInputCell: (item, index, col) => {
    const align = col.align || 'text-right';
    const val = Number(item[col.key] || 0).toFixed(2);
    const min = col.min !== undefined ? col.min : 0;
    return `<td class="px-2 py-2">
      <input type="number" data-field="${col.key}" value="${val}" min="${min}" step="0.01" class="po-input w-24 px-2 py-1.5 text-sm border border-border rounded bg-white ${align} focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
    </td>`;
  },
  
  CurrencyCell: (item, index, col) => {
    const align = col.align || 'text-right';
    const val = Number(item[col.computedKey || col.key] || 0).toFixed(2);
    const classes = col.bold ? 'text-sm font-bold text-text' : 'text-xs text-gray-500';
    return `<td class="px-2 py-3 ${align} ${classes} po-${col.key}">Rs.${val}</td>`;
  },
  
  ActionCell: (item, index, col) => {
    const align = col.align || 'text-right';
    return `<td class="px-2 py-3 ${align}">
      <button class="po-btn-delete p-1.5 text-gray-400 hover:text-danger hover:bg-danger/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-danger/20" title="Delete Row (Alt+Delete)">
        <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
      </button>
    </td>`;
  },

  ComputedLineCell: (item, index, col, config) => {
    const align = col.align || 'text-right';
    const calc = TransactionCalculator.calculateLine(item, config?.pricing?.field || 'price');
    const val = col.compute === 'gstAmt' ? calc.gstAmt : calc.lineTotal;
    const classes = col.bold ? 'text-sm font-bold text-text' : 'text-xs text-gray-500';
    return `<td class="px-2 py-3 ${align} ${classes} po-${col.key}">Rs.${val.toFixed(2)}</td>`;
  }
};
