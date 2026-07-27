/**
 * Senthil Enterprises ERP - Notifications
 */
import { DataProvider } from '../services/DataProvider.js';

export async function render() {
  const notifications = DataProvider.getNotifications() || [];


  return `
    <div class="p-6 max-w-[800px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6 border-b border-border pb-4">
        <div>
          <h1 class="text-2xl font-bold text-text">Notifications</h1>
          <p class="text-sm text-gray-400 mt-1">Recent system alerts, reminders, and updates.</p>
        </div>
        <button class="text-sm font-medium text-primary hover:underline">Mark all as read</button>
      </div>

      <div class="space-y-4">
        \${notifications.length > 0 ? notifications.map(n => \`
          <div class="p-4 bg-white border border-border rounded-xl shadow-sm flex items-start gap-4 hover:border-primary/30 transition-colors cursor-pointer">
            <div class="p-2 bg-\${n.type || 'primary'}/10 text-\${n.type || 'primary'} rounded-lg shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="\${n.icon || 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}"/></svg>
            </div>
            <div class="flex-1">
              <h4 class="text-sm font-semibold text-text">\${n.title}</h4>
              <p class="text-sm text-gray-600 mt-0.5">\${n.message}</p>
            </div>
            <span class="text-[10px] text-gray-400 font-medium whitespace-nowrap">\${n.time || 'Just now'}</span>
          </div>
        \`).join('') : '<p class="text-center text-gray-500 py-8">No new notifications.</p>'}
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  // Logic for handling notifications
}
