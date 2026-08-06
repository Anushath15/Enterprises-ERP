/**
 * Senthil Enterprises ERP - Local-Date Utilities
 * Fixes AUDIT-H05: `new Date().toISOString().split('T')[0]` returns the UTC date,
 * which is YESTERDAY for Asia/Calcutta (UTC+5:30) between 00:00 and 05:30 local.
 * All "today" / date-key logic must use these local-date helpers instead.
 */

/**
 * Returns today's date as 'YYYY-MM-DD' in the LOCAL timezone.
 */
export function todayISO() {
  return toLocalDateString(new Date());
}

/**
 * Converts a Date (or date-string) to 'YYYY-MM-DD' using LOCAL timezone components.
 * Safe for invoices, expenses, returns, and daily-closing day keys.
 */
export function toLocalDateString(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the ISO timestamp for a local date string 'YYYY-MM-DD' at LOCAL midnight.
 * Used to build reliable date ranges (start-of-day) without UTC drift.
 */
export function localDateStartISO(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, d || 1);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

/**
 * Returns the last `count` local dates (inclusive of today), oldest first:
 * ['2026-08-03', '2026-08-02', ...]
 */
export function lastLocalDays(count) {
  const days = [];
  const today = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    days.push(toLocalDateString(d));
  }
  return days;
}

/**
 * Returns true when `dateStr` ('YYYY-MM-DD' or ISO) falls on a local day in `dayList`.
 * Falls back to startsWith matching for legacy ISO timestamps.
 */
export function isLocalDateIn(dateStr, dayList) {
  if (!dateStr) return false;
  let str = typeof dateStr === 'string' ? dateStr : new Date(dateStr).toISOString();
  const localDay = str.length >= 10 ? toLocalDateString(str) : str;
  return dayList.includes(localDay);
}

