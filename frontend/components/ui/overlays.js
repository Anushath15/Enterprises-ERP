/**
 * Senthil Enterprises ERP - Overlay Components
 * Purpose: Modals and Side Drawers.
 */

/**
 * Modal Wrapper
 * @param {Object} props - { id, title, content, footerActions }
 */
export function Modal({ id, title, content, footerActions = '' }) {
  return `
    <div id="${id}" class="relative z-50 hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity opacity-0 fade-in-backdrop"></div>

      <div class="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          
          <!-- Modal Panel -->
          <div class="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95 fade-in-modal">
            
            <!-- Header -->
            <div class="bg-white px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 class="text-base font-semibold leading-6 text-text" id="modal-title">${title}</h3>
              <button type="button" class="text-gray-400 hover:text-gray-500 focus:outline-none" onclick="document.getElementById('${id}').classList.add('hidden')">
                <span class="sr-only">Close</span>
                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
              </button>
            </div>

            <!-- Body -->
            <div class="bg-white px-6 py-5">
              ${content}
            </div>

            <!-- Footer -->
            ${footerActions ? `
              <div class="bg-gray-50 px-6 py-4 border-t border-border flex justify-end gap-3">
                ${footerActions}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}
