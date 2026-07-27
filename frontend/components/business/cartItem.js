/**
 * Reusable Cart Item Component
 */
export function CartItem({ id, title, calculation, quantity, total, iconSvg }) {
  return `
    <div class="cart-item px-4 py-3 border-b border-border flex items-center gap-3" data-id="${id}">
      <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <svg class="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          ${iconSvg || '<path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>'}
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold text-text truncate">${title}</p>
        <p class="text-[10px] text-gray-400">${calculation}</p>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button class="qty-btn w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">-</button>
        <span class="text-xs font-semibold w-6 text-center">${quantity}</span>
        <button class="qty-btn w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">+</button>
      </div>
      <p class="text-sm font-bold text-text w-16 text-right shrink-0">${total}</p>
      <button class="p-1 rounded hover:bg-danger/10 text-gray-400 hover:text-danger transition-colors shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  `;
}
