/**
 * Reusable Product Card Component
 */
export function ProductCard({ title, subtitle, price, stock, iconSvg, stockStatus = 'normal' }) {
  const stockColor = stockStatus === 'critical' ? 'danger' : stockStatus === 'low' ? 'warning' : 'gray-400';
  
  return `
    <div class="product-card p-3 rounded-xl border border-border cursor-pointer bg-white flex flex-col h-full">
      <div class="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center shrink-0">
        <svg class="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          ${iconSvg || '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>'}
        </svg>
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
