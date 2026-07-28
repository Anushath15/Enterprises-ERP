/**
 * Reusable Product Card Component
 */
export function ProductCard({ title, subtitle, price, stock, iconSvg, stockStatus = 'normal' }) {
  const stockColor = stockStatus === 'critical' ? 'danger' : stockStatus === 'low' ? 'warning' : 'gray-400';
  
  return `
    <div class="product-card p-3 rounded-xl border border-border cursor-pointer bg-white flex flex-col h-full">
      <div class="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center shrink-0">
        ${iconSvg || '<i data-lucide="package" class="w-8 h-8 text-gray-300"></i>'}
      </div>
      <p class="text-xs font-semibold text-text truncate">${title}</p>
      <p class="text-[10px] text-gray-400 truncate">${subtitle}</p>
      <div class="flex items-center justify-between mt-auto pt-2">
        <p class="text-sm font-bold text-primary">${price}</p>
        <span class="text-[10px] text-${stockColor} ${stockStatus !== 'normal' ? 'font-medium' : ''}">Stock: ${stock}</span>
      </div>
    </div>
  `;
}

