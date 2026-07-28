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
        <div class="w-8 h-8 text-gray-400 flex items-center justify-center">${iconSvg || '<i data-lucide="inbox" class="w-8 h-8"></i>'}</div>
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
    icon = 'check-circle';
    iconBg = 'bg-success/10';
    iconColor = 'text-success';
  } else if (type === 'error') {
    icon = 'alert-circle';
    iconBg = 'bg-danger/10';
    iconColor = 'text-danger';
  } else if (type === 'warning') {
    icon = 'alert-triangle';
    iconBg = 'bg-warning/10';
    iconColor = 'text-warning';
  }

  return `
    <div class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition-all transform ease-out duration-300">
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 rounded-full ${iconBg} flex items-center justify-center">
              <i data-lucide="${icon}" class="w-4 h-4 ${iconColor}"></i>
            </div>
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-text">${title}</p>
            <p class="mt-1 text-sm text-gray-500">${message}</p>
          </div>
          <div class="ml-4 flex flex-shrink-0">
            <button type="button" class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <span class="sr-only">Close</span>
              <i data-lucide="x" class="h-5 w-5"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

