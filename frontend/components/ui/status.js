/**
 * Senthil Enterprises ERP - Status Components
 * Purpose: Badges, Status Chips, Progress Bars.
 */

/**
 * Badge / Status Chip
 * @param {Object} props - { text, type, size }
 * type: 'success', 'warning', 'danger', 'primary', 'default'
 * size: 'sm', 'md'
 */
export function Badge({ text, type = 'default', size = 'md' }) {
  let colorClasses = 'bg-gray-100 text-gray-500';
  if (type === 'success') colorClasses = 'bg-success/10 text-success';
  else if (type === 'warning') colorClasses = 'bg-warning/10 text-warning';
  else if (type === 'danger') colorClasses = 'bg-danger/10 text-danger';
  else if (type === 'primary') colorClasses = 'bg-primary/10 text-primary';

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]';

  return `
    <span class="inline-flex items-center ${sizeClasses} rounded-full font-medium ${colorClasses}">
      ${text}
    </span>
  `;
}

/**
 * Progress Bar
 * @param {Object} props - { percentage, color }
 */
export function ProgressBar({ percentage = 0, color = 'primary' }) {
  let bgClass = 'bg-primary';
  if (color === 'success') bgClass = 'bg-success';
  if (color === 'warning') bgClass = 'bg-warning';
  if (color === 'danger') bgClass = 'bg-danger';

  return `
    <div class="w-full bg-gray-100 rounded-full h-1.5">
      <div class="progress-bar ${bgClass} h-1.5 rounded-full" style="width: ${percentage}%"></div>
    </div>
  `;
}

