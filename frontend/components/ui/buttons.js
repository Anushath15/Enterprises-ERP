/**
 * Senthil Enterprises ERP - Button Components
 * Purpose: Reusable button elements matching the ERP design language.
 */

/**
 * Creates a primary filled button
 * @param {Object} props - { label, id, onClick, type, fullWidth, iconSvg }
 */
export function PrimaryButton({ label, id = '', type = 'button', fullWidth = false, iconSvg = '' }) {
  const widthClass = fullWidth ? 'w-full' : '';
  return `
    <button type="${type}" id="${id}" class="${widthClass} inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50">
      ${iconSvg ? `<span class="mr-2">${iconSvg}</span>` : ''}
      ${label}
    </button>
  `;
}

/**
 * Creates a secondary outlined button
 */
export function SecondaryButton({ label, id = '', type = 'button', fullWidth = false, iconSvg = '' }) {
  const widthClass = fullWidth ? 'w-full' : '';
  return `
    <button type="${type}" id="${id}" class="${widthClass} inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-text bg-white border border-border rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200">
      ${iconSvg ? `<span class="mr-2 text-gray-500">${iconSvg}</span>` : ''}
      ${label}
    </button>
  `;
}

/**
 * Creates a success button (e.g. Save, Confirm)
 */
export function SuccessButton({ label, id = '', type = 'button', fullWidth = false, iconSvg = '' }) {
  const widthClass = fullWidth ? 'w-full' : '';
  return `
    <button type="${type}" id="${id}" class="${widthClass} inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-success rounded-lg hover:bg-success/90 transition-colors shadow-sm shadow-success/20 focus:outline-none focus:ring-2 focus:ring-success/50">
      ${iconSvg ? `<span class="mr-2">${iconSvg}</span>` : ''}
      ${label}
    </button>
  `;
}

/**
 * Creates a danger button (e.g. Delete, Cancel)
 */
export function DangerButton({ label, id = '', type = 'button', fullWidth = false, iconSvg = '' }) {
  const widthClass = fullWidth ? 'w-full' : '';
  return `
    <button type="${type}" id="${id}" class="${widthClass} inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-danger rounded-lg hover:bg-danger/90 transition-colors shadow-sm shadow-danger/20 focus:outline-none focus:ring-2 focus:ring-danger/50">
      ${iconSvg ? `<span class="mr-2">${iconSvg}</span>` : ''}
      ${label}
    </button>
  `;
}

/**
 * Creates a ghost/transparent button (used in quick actions)
 */
export function GhostButton({ label, id = '', type = 'button', fullWidth = false, color = 'primary' }) {
  const widthClass = fullWidth ? 'w-full' : '';
  let colorClasses = 'text-primary border-primary/20 hover:bg-primary/5'; // Default primary
  
  if (color === 'gray') colorClasses = 'text-gray-600 border-border hover:bg-gray-50';
  if (color === 'danger') colorClasses = 'text-danger border-danger/20 hover:bg-danger/5';

  return `
    <button type="${type}" id="${id}" class="${widthClass} inline-flex items-center justify-center py-2 px-4 text-xs font-medium border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-${color}/20 ${colorClasses}">
      ${label}
    </button>
  `;
}

/**
 * Creates a quick action square button with an icon on top
 * @param {Object} props - { label, id, iconSvg, color, dataAttrs }
 * dataAttrs: additional static attributes (e.g. data-route, data-action) for delegated click handling.
 */
export function IconButton({ label, id = '', iconSvg, color = 'primary', dataAttrs = '' }) {
  // Mapping color to tailwind classes explicitly since dynamic concatenation in Tailwind sometimes fails in JIT without safelist.
  let colorClasses = {
    wrapper: 'hover:border-primary/30 hover:bg-primary/5',
    iconBg: 'bg-primary/10 group-hover:bg-primary/20',
    iconText: 'text-primary'
  };

  if (color === 'success') {
    colorClasses = { wrapper: 'hover:border-success/30 hover:bg-success/5', iconBg: 'bg-success/10 group-hover:bg-success/20', iconText: 'text-success' };
  } else if (color === 'warning') {
    colorClasses = { wrapper: 'hover:border-warning/30 hover:bg-warning/5', iconBg: 'bg-warning/10 group-hover:bg-warning/20', iconText: 'text-warning' };
  } else if (color === 'danger') {
    colorClasses = { wrapper: 'hover:border-danger/30 hover:bg-danger/5', iconBg: 'bg-danger/10 group-hover:bg-danger/20', iconText: 'text-danger' };
  }

  return `
    <button id="${id}" ${dataAttrs} class="flex flex-col items-center justify-center p-4 rounded-lg border border-border transition-all group ${colorClasses.wrapper} focus:outline-none">
      <div class="w-9 h-9 rounded-lg flex items-center justify-center mb-2 transition-colors ${colorClasses.iconBg}">
        <div class="w-4 h-4 ${colorClasses.iconText}">${iconSvg}</div>
      </div>
      <span class="text-xs font-medium text-gray-600">${label}</span>
    </button>
  `;
}

