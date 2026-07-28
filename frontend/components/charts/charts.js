/**
 * Senthil Enterprises ERP - Chart Components
 * Purpose: Wrapper for Charts.
 */

/**
 * CSS Bar Chart Wrapper (From Dashboard Design)
 * Note: A full chart library like Chart.js should be used later. 
 * This mimics the pure CSS approach from the existing HTML.
 * @param {Object} props - { title, subtitle, data }
 * data: Array of { label, value, percentage, isHighlight }
 */
export function CSSBarChart({ title, subtitle, data = [] }) {
  const renderBars = data.map(item => {
    const barClass = item.isHighlight 
      ? 'bg-primary shadow-sm shadow-primary/30' 
      : 'bg-primary/10';
    const textClass = item.isHighlight ? 'text-primary font-semibold' : 'text-gray-400 font-medium';

    return `
      <div class="flex-1 flex flex-col items-center gap-2">
        <div class="w-full ${barClass} rounded-t-lg relative group cursor-pointer transition-all hover:bg-primary/20" style="height: ${item.percentage}%;">
          <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-text text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            ${item.value}
          </div>
        </div>
        <span class="text-[10px] ${textClass}">${item.label}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="bg-white rounded-xl border border-border p-6 card-hover">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h3 class="text-base font-semibold text-text">${title}</h3>
          ${subtitle ? `<p class="text-xs text-gray-400 mt-0.5">${subtitle}</p>` : ''}
        </div>
      </div>
      <div class="flex items-end justify-between gap-3 h-48 px-2">
        ${renderBars}
      </div>
    </div>
  `;
}

