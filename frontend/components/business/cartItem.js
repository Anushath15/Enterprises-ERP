/**
 * Reusable Cart Item Component
 */
export function CartItem({ id, title, calculation, quantity, total, iconSvg }) {
  return `
    <div class="cart-item px-4 py-3 border-b border-border flex items-center gap-3" data-id="${id}">
      <div class="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <i data-lucide="${iconSvg || 'package'}" class="w-6 h-6 text-gray-400"></i>
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
      <button class="cart-del-btn p-1 rounded hover:bg-danger/10 text-gray-400 hover:text-danger transition-colors shrink-0">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    </div>
  `;
}

