/**
 * Senthil Enterprises ERP - Card Components
 * Purpose: Reusable card containers matching the ERP design language.
 */

/**
 * Base Card Container (Summary Card / Information Card)
 * @param {Object} props - { title, subtitle, children, headerAction }
 */
export function Card({ title, subtitle, children, headerAction = '' }) {
  return `
    <div class="bg-white rounded-xl border border-border overflow-hidden card-hover">
      ${title ? `
        <div class="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-text">${title}</h3>
            ${subtitle ? `<p class="text-xs text-gray-400 mt-0.5">${subtitle}</p>` : ''}
          </div>
          ${headerAction ? `<div>${headerAction}</div>` : ''}
        </div>
      ` : ''}
      <div class="p-6">
        ${children}
      </div>
    </div>
  `;
}

/**
 * KPI Card / Statistic Card 
 * (Matches the top row cards on the Dashboard)
 * @param {Object} props - { title, value, iconSvg, color, badgeText, badgeColor }
 */
export function KPICard({ title, value, iconSvg, color = 'primary', badgeText = '', badgeColor = 'success' }) {
  // Map colors explicitly for JIT compiler safety
  let iconBg = 'bg-primary/10';
  let iconText = 'text-primary';
  
  if (color === 'success') { iconBg = 'bg-success/10'; iconText = 'text-success'; }
  else if (color === 'warning') { iconBg = 'bg-warning/10'; iconText = 'text-warning'; }
  else if (color === 'danger') { iconBg = 'bg-danger/10'; iconText = 'text-danger'; }

  // Badge mapping
  let badgeClasses = 'bg-gray-100 text-gray-500';
  if (badgeColor === 'success') badgeClasses = 'bg-success/10 text-success';
  else if (badgeColor === 'danger') badgeClasses = 'bg-danger/10 text-danger';

  return `
    <div class="stat-card bg-white rounded-xl border border-border p-5">
      <div class="flex items-start justify-between mb-3">
        <div class="w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}">
          <div class="w-5 h-5 ${iconText}">${iconSvg}</div>
        </div>
        ${badgeText ? `
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeClasses}">
            ${badgeText}
          </span>
        ` : ''}
      </div>
      <p class="text-2xl font-bold text-text">${value}</p>
      <p class="text-xs text-gray-400 mt-1">${title}</p>
    </div>
  `;
}

/**
 * Minimal Stat Card without icon (useful for secondary metrics)
 */
export function MinimalStatCard({ title, value, subtitle }) {
  return `
    <div class="bg-gray-50 rounded-lg border border-border p-4">
      <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">${title}</p>
      <p class="text-xl font-bold text-text mt-1">${value}</p>
      ${subtitle ? `<p class="text-[10px] text-gray-400 mt-1">${subtitle}</p>` : ''}
    </div>
  `;
}

