/**
 * Senthil Enterprises ERP - Table Components
 * Purpose: Reusable table elements.
 */

/**
 * Standard Table
 * @param {Object} props - { headers, rows, renderRow }
 * headers: Array of strings e.g. ['Invoice #', 'Customer', 'Items', 'Amount', 'Status']
 * rows: Array of data objects
 * renderRow: Function that takes (row, index) and returns an HTML string for the <tr>
 */
export function Table({ headers = [], rows = [], renderRow }) {
  const renderHeaders = headers.map(header => {
    // Basic alignment logic based on header name (just an example, usually passed in config)
    let alignClass = 'text-left';
    if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('price') || header.toLowerCase().includes('total')) alignClass = 'text-right';
    if (header.toLowerCase() === 'status' || header.toLowerCase() === 'action') alignClass = 'text-center';
    
    return `<th class="${alignClass} text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">${header}</th>`;
  }).join('');

  const renderBody = rows.length > 0 
    ? rows.map((row, idx) => renderRow(row, idx)).join('')
    : `<tr><td colspan="${headers.length}" class="px-6 py-8 text-center text-sm text-gray-400">No data available</td></tr>`;

  return `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-border bg-gray-50/50">
            ${renderHeaders}
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          ${renderBody}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Helper to wrap table cells with standard padding
 */
export function TableCell({ content, align = 'left' }) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return `<td class="px-6 py-3.5 ${alignClass}">${content}</td>`;
}
