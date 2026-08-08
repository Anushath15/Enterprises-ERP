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
              <button type="button" class="text-gray-400 hover:text-gray-500 focus:outline-none" data-close-modal="${id}">
                <span class="sr-only">Close</span>
                <i data-lucide="x" class="h-5 w-5"></i>
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

document.addEventListener('click', (e) => {
  const closeBtn = e.target.closest('[data-close-modal]');
  if (closeBtn) {
    const modal = document.getElementById(closeBtn.getAttribute('data-close-modal'));
    if (modal) modal.classList.add('hidden');
  }
});

