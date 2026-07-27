/**
 * Senthil Enterprises ERP - Feedback Components
 * Purpose: Toast Notifications, Loading States, Empty States.
 */

/**
 * Empty State
 * @param {Object} props - { title, description, iconSvg, actionButton }
 */
export function EmptyState({ title, description, iconSvg, actionButton = '' }) {
  return `
    <div class="flex flex-col items-center justify-center p-12 text-center bg-white border border-border border-dashed rounded-xl">
      <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <div class="w-8 h-8 text-gray-400">${iconSvg || '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>'}</div>
      </div>
      <h3 class="text-sm font-semibold text-text">${title}</h3>
      <p class="text-sm text-gray-400 mt-1 max-w-sm">${description}</p>
      ${actionButton ? `<div class="mt-6">${actionButton}</div>` : ''}
    </div>
  `;
}

/**
 * Loading Skeleton - Card
 */
export function SkeletonCard() {
  return `
    <div class="bg-white rounded-xl border border-border p-5 animate-pulse">
      <div class="flex items-start justify-between mb-4">
        <div class="w-10 h-10 rounded-lg bg-gray-200"></div>
        <div class="w-16 h-4 bg-gray-200 rounded-full"></div>
      </div>
      <div class="w-24 h-8 bg-gray-200 rounded mb-2"></div>
      <div class="w-32 h-3 bg-gray-200 rounded"></div>
    </div>
  `;
}

/**
 * Toast Notification Structure
 * Note: Actual rendering logic will belong in a Toast service.
 * @param {Object} props - { title, message, type }
 */
export function Toast({ title, message, type = 'success' }) {
  let icon = '';
  let iconBg = '';
  let iconColor = '';

  if (type === 'success') {
    icon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
    iconBg = 'bg-success/10';
    iconColor = 'text-success';
  } else if (type === 'error') {
    icon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
    iconBg = 'bg-danger/10';
    iconColor = 'text-danger';
  } else if (type === 'warning') {
    icon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>';
    iconBg = 'bg-warning/10';
    iconColor = 'text-warning';
  }

  return `
    <div class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition-all transform ease-out duration-300">
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 rounded-full ${iconBg} flex items-center justify-center">
              <svg class="w-4 h-4 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icon}</svg>
            </div>
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-text">${title}</p>
            <p class="mt-1 text-sm text-gray-500">${message}</p>
          </div>
          <div class="ml-4 flex flex-shrink-0">
            <button type="button" class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <span class="sr-only">Close</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
