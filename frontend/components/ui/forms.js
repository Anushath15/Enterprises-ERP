/**
 * Senthil Enterprises ERP - Form Components
 * Purpose: Reusable form inputs and controls.
 */

/**
 * Text Input
 */
export function TextInput({ label, id, placeholder = '', value = '', type = 'text', required = false, disabled = false, error = '' }) {
  const baseClasses = "w-full px-4 py-2 bg-white border rounded-lg text-sm text-text placeholder-gray-400 focus:outline-none transition-all";
  const stateClasses = error 
    ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger" 
    : disabled 
      ? "border-border bg-gray-50 text-gray-400 cursor-not-allowed"
      : "border-border focus:border-primary focus:ring-1 focus:ring-primary";

  return `
    <div class="mb-4">
      ${label ? `<label for="${id}" class="block text-sm font-medium text-gray-700 mb-1.5">${label}${required ? ' <span class="text-danger">*</span>' : ''}</label>` : ''}
      <input 
        type="${type}" 
        id="${id}" 
        name="${id}"
        placeholder="${placeholder}" 
        value="${value}"
        ${required ? 'required' : ''}
        ${disabled ? 'disabled' : ''}
        class="${baseClasses} ${stateClasses}"
      >
      ${error ? `<p class="mt-1.5 text-xs text-danger">${error}</p>` : ''}
    </div>
  `;
}

/**
 * Dropdown (Select)
 */
export function Dropdown({ label, id, options = [], value = '', required = false, disabled = false }) {
  const baseClasses = "w-full px-4 py-2 bg-white border rounded-lg text-sm text-text focus:outline-none transition-all appearance-none cursor-pointer";
  const stateClasses = disabled 
      ? "border-border bg-gray-50 text-gray-400 cursor-not-allowed"
      : "border-border focus:border-primary focus:ring-1 focus:ring-primary";

  const renderOptions = options.map(opt => 
    `<option value="${opt.value}" ${opt.value === value ? 'selected' : ''}>${opt.label}</option>`
  ).join('');

  return `
    <div class="mb-4 relative">
      ${label ? `<label for="${id}" class="block text-sm font-medium text-gray-700 mb-1.5">${label}${required ? ' <span class="text-danger">*</span>' : ''}</label>` : ''}
      <div class="relative">
        <select 
          id="${id}" 
          name="${id}"
          ${required ? 'required' : ''}
          ${disabled ? 'disabled' : ''}
          class="${baseClasses} ${stateClasses}"
        >
          ${renderOptions}
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  `;
}

/**
 * Textarea
 */
export function Textarea({ label, id, placeholder = '', value = '', rows = 3, required = false }) {
  return `
    <div class="mb-4">
      ${label ? `<label for="${id}" class="block text-sm font-medium text-gray-700 mb-1.5">${label}${required ? ' <span class="text-danger">*</span>' : ''}</label>` : ''}
      <textarea 
        id="${id}" 
        name="${id}"
        rows="${rows}"
        placeholder="${placeholder}" 
        ${required ? 'required' : ''}
        class="w-full px-4 py-2 bg-white border border-border rounded-lg text-sm text-text placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-y"
      >${value}</textarea>
    </div>
  `;
}

/**
 * Checkbox
 */
export function Checkbox({ label, id, checked = false }) {
  return `
    <div class="flex items-center mb-4">
      <input id="${id}" name="${id}" type="checkbox" ${checked ? 'checked' : ''} class="w-4 h-4 text-primary bg-white border-border rounded focus:ring-primary focus:ring-2 cursor-pointer transition-all">
      <label for="${id}" class="ml-2 text-sm text-gray-700 cursor-pointer select-none">${label}</label>
    </div>
  `;
}
