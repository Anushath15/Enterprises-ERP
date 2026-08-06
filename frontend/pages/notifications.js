/**
 * Senthil Enterprises ERP - Notifications
 */
import { DataProvider } from '../services/dataProvider.js';
import { escapeHtml } from '../utils/escapeHtml.js';

export async function render() {
  const notifications = DataProvider.getNotifications() || [];
  const unread = notifications.filter(n => !n.read);

  const getIconPath = (type) => {
    if (type === 'warning') return 'alert-triangle';
    if (type === 'danger')  return 'alert-circle';
    if (type === 'success') return 'check-circle';
    return 'info';
  };

  const formatTime = (iso) => {
    if (!iso) return 'Just now';
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch(e) { return escapeHtml(iso); }
  };

  return `
    <div class="p-6 max-w-[800px] mx-auto fade-in">
      <div class="flex items-center justify-between mb-6 border-b border-border pb-4">
        <div>
          <h1 class="text-2xl font-bold text-text">Notifications</h1>
          <p class="text-sm text-gray-400 mt-1">Recent system alerts, reminders, and updates. ${unread.length > 0 ? `<span class="text-primary font-medium">${unread.length} unread</span>` : ''}</p>
        </div>
        <button id="mark-all-read-btn" class="text-sm font-medium text-primary hover:underline ${notifications.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}">Mark all as read</button>
      </div>

      <div class="space-y-3" id="notifications-list">
        ${notifications.length > 0 ? notifications.map(n => `
          <div class="p-4 bg-white border ${n.read ? 'border-border opacity-70' : 'border-primary/20 shadow-sm'} rounded-xl flex items-start gap-4 hover:border-primary/30 transition-colors cursor-pointer notification-item" data-id="${escapeHtml(n.id)}">
            <div class="p-2 bg-${n.type === 'warning' ? 'warning' : n.type === 'danger' ? 'danger' : n.type === 'success' ? 'success' : 'primary'}/10 rounded-lg shrink-0">
              <i data-lucide="${getIconPath(n.type)}" class="w-5 h-5 text-${n.type === 'warning' ? 'warning' : n.type === 'danger' ? 'danger' : n.type === 'success' ? 'success' : 'primary'}"></i>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-text">${escapeHtml(n.title || 'Notification')}</h4>
              <p class="text-sm text-gray-600 mt-0.5">${escapeHtml(n.message || '')}</p>
            </div>
            <div class="flex flex-col items-end gap-2 shrink-0">
              <span class="text-[10px] text-gray-400 font-medium whitespace-nowrap">${formatTime(n.time)}</span>
              ${!n.read ? '<span class="w-2 h-2 bg-primary rounded-full"></span>' : ''}
            </div>
          </div>
        `).join('') : '<div class="text-center py-12"><div class="text-4xl mb-3">🔔</div><p class="text-gray-500">No notifications yet.</p></div>'}
      </div>
    </div>
  `;
}

export function onMount(rootElement) {
  if (window.lucide) window.lucide.createIcons();
  
  const __listeners = [];
  const addListener = (el, evt, handler) => {
    if (!el) return;
    el.addEventListener(evt, handler);
    __listeners.push({el, evt, handler});
  };

  // Mark all as read
  const markAllBtn = rootElement.querySelector('#mark-all-read-btn');
  if (markAllBtn) {
    addListener(markAllBtn, 'click', () => {
      DataProvider.markAllNotificationsRead();
      // Update UI
      rootElement.querySelectorAll('.notification-item').forEach(el => {
        el.classList.remove('border-primary/20', 'shadow-sm');
        el.classList.add('border-border', 'opacity-70');
        const dot = el.querySelector('.bg-primary.rounded-full');
        if (dot) dot.remove();
      });
      const badge = rootElement.querySelector('#notifications-list + div span.text-primary');
      markAllBtn.classList.add('opacity-50', 'cursor-not-allowed');
    });
  }

  return function cleanup() {
    __listeners.forEach(l => {
      if (l.el) l.el.removeEventListener(l.evt, l.handler);
    });
    __listeners.length = 0;
  };
}
