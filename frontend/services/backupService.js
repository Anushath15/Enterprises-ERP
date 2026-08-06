/**
 * Senthil Enterprises ERP - Automatic Backup Service
 * ------------------------------------------------------------------
 * Version 1.0 - Production backup subsystem for the offline
 * (LocalStorage / OfflineDataProvider) architecture.
 *
 * Responsibilities:
 *  - Daily automatic backup (once per calendar day; on app boot,
 *    on returning to the tab, and hourly while the app stays open)
 *  - Manual backup (triggered by the Settings page button)
 *  - Whitelisted business-data extraction (never temporary UI state)
 *  - Round-trip validation + checksum BEFORE the file is offered
 *  - Success / error feedback through the global toast system
 */
import { LocalStorageService } from './storage/localStorageService.js';
import { NotificationService } from './notificationService.js';

export const APP_NAME = 'Senthil Enterprises ERP';
export const APP_VERSION = '1.0.0';
export const BACKUP_TYPE = 'full';
const AUTO_CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly while the app is open
const AUTO_BACKUP_TAG = 'erp_last_auto_backup'; // raw localStorage date string (no JSON)
const LAST_BACKUP_TAG = 'erp_last_backup';      // raw localStorage ISO string; dashboard reads it directly

/**
 * Business-only whitelist.
 * Deliberately excludes temporary / UI state:
 *  - erp_drafts (DraftManager form autosave)
 *  - erp_last_backup / erp_last_auto_backup (derived timestamps)
 *  - erp_db_version (schema metadata; migration re-runs on restore)
 *  - erp_notifications (transient inbox state)
 *  - erp_projects / erp_purchase_invoices (legacy, unused collections)
 */
export const BUSINESS_COLLECTIONS = [
  'erp_system_state',            // ID counters / sequences - required for restore integrity
  'erp_settings',                // shop configuration
  'erp_products',                // products (stock lives on these records)
  'erp_customers',
  'erp_dealers',
  'erp_sales_invoices',          // sales
  'erp_sales_returns',
  'erp_purchases',               // purchases (POs)
  'erp_purchase_returns',
  'erp_deliveries',
  'erp_expenses',
  'erp_stock_adjustments',       // inventory movement log
  'erp_daily_closings',          // daily closing submissions
  'erp_daily_closing_history',
  'erp_product_price_history',
  'erp_categories',
  'erp_expense_categories',
  'erp_users',                   // user accounts (salted hashes; needed for auth restore)
  'erp_settings_history',
  'erp_house_projects',
  'erp_warranties',
  'erp_staff'
];

/** Collections the requirements guarantee must exist in every backup. */
export const REQUIRED_COLLECTIONS = [
  'erp_products',
  'erp_customers',
  'erp_dealers',
  'erp_sales_invoices',
  'erp_purchases',
  'erp_expenses',
  'erp_settings',
  'erp_daily_closings',
  'erp_system_state'
];

export const OBJECT_COLLECTIONS = new Set(['erp_settings', 'erp_system_state']);

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function buildFilename(date = new Date()) {
  return `ERP_Backup_${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}_${pad2(date.getHours())}-${pad2(date.getMinutes())}.json`;
}

function emptyValueFor(key) {
  return OBJECT_COLLECTIONS.has(key) ? {} : [];
}

/** FNV-1a 32-bit - deterministic, dependency-free checksum. */
export function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function collectBusinessData() {
  const data = {};
  let arrayRecords = 0;
  let totalRecords = 0;
  for (const key of BUSINESS_COLLECTIONS) {
    const value = LocalStorageService.get(key);
    if (value === null || value === undefined) {
      // Structural completeness: missing lazy collections are written as empty
      // so every restore sees the full schema.
      data[key] = emptyValueFor(key);
      continue;
    }
    data[key] = value;
    if (Array.isArray(value)) {
      arrayRecords += value.length;
      totalRecords += value.length;
    } else {
      totalRecords += 1;
    }
  }
  return { data, arrayRecords, totalRecords };
}

export function validatePayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    errors.push('Backup payload is not an object');
    return { ok: false, errors };
  }
  if (!payload.meta || typeof payload.meta !== 'object') errors.push('Backup meta section missing');
  if (!payload.data || typeof payload.data !== 'object') errors.push('Backup data section missing');

  if (payload.data) {
    for (const key of REQUIRED_COLLECTIONS) {
      const value = payload.data[key];
      if (value === undefined) {
        errors.push(`Required collection missing: ${key}`);
        continue;
      }
      if (OBJECT_COLLECTIONS.has(key)) {
        if (typeof value !== 'object' || Array.isArray(value)) errors.push(`Invalid type for ${key}: expected object`);
      } else if (!Array.isArray(value)) {
        errors.push(`Invalid type for ${key}: expected array`);
      }
    }
  }

  if (payload.meta && typeof payload.meta.checksum === 'string') {
    const recomputed = fnv1a(JSON.stringify(payload.data || {}));
    if (recomputed !== payload.meta.checksum) errors.push('Checksum mismatch: backup content corrupted or modified');
  }

  return { ok: errors.length === 0, errors };
}

function triggerDownload(serialized, filename) {
  const blob = new Blob([serialized], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Deferred revoke so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const BackupService = {
  _intervalId: null,
  _visibilityHandler: null,
  _initialized: false,

  /**
   * Boot hook. Called once by app.js after the data layer is ready.
   * Schedules the first daily check without ever blocking first paint.
   */
  init() {
    if (this._initialized) return;
    this._initialized = true;

    const boot = () => {
      this.checkAutoBackup();
      this._installTimers();
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(boot, 0);
    } else {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    }
  },

  _installTimers() {
    if (this._intervalId === null) {
      this._intervalId = setInterval(() => this.checkAutoBackup(), AUTO_CHECK_INTERVAL_MS);
    }
    if (this._visibilityHandler === null) {
      this._visibilityHandler = () => {
        if (document.visibilityState === 'visible') this.checkAutoBackup();
      };
      document.addEventListener('visibilitychange', this._visibilityHandler);
    }
  },

  /** Removes all timers/listeners (used by tests; app never unmounts). */
  dispose() {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    if (this._visibilityHandler !== null) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
      this._visibilityHandler = null;
    }
    this._initialized = false;
  },

  /**
   * Daily guard: generates the automatic backup once per calendar day.
   * Returns true when a backup was actually generated by this call.
   * Skips silently when the database is entirely empty (fresh installs
   * do not produce useless daily files).
   */
  checkAutoBackup() {
    let settings = {};
    try {
      settings = JSON.parse(localStorage.getItem('erp_settings') || '{}');
    } catch (e) {
      console.warn('[Backup] Could not parse erp_settings, using defaults');
    }

    if (settings.autoBackupEnabled === false) return false;

    const freq = settings.backupFrequency || 'daily';
    const lastStr = localStorage.getItem(AUTO_BACKUP_TAG);
    
    if (lastStr) {
      if (lastStr === todayKey()) return false; // Already did it today

      const lastDate = new Date(lastStr);
      const today = new Date(todayKey());
      const diffTime = Math.abs(today - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (freq === 'weekly' && diffDays < 7) return false;
      if (freq === 'monthly' && diffDays < 30) return false;
    }

    const result = this.createBackup({ auto: true });
    return !!result.ok;
  },

  createManualBackup() {
    return this.createBackup({ auto: false });
  },

  createBackup({ auto = false } = {}) {
    try {
      const filename = buildFilename();
      const { data, arrayRecords, totalRecords } = collectBusinessData();

      // Fresh-install guard for the automatic path only.
      if (auto && arrayRecords === 0) {
        return { ok: false, reason: 'empty' };
      }

      const payload = {
        meta: {
          app: APP_NAME,
          version: APP_VERSION,
          type: BACKUP_TYPE,
          generatedAt: new Date().toISOString(),
          filename,
          collections: Object.keys(data).length,
          records: totalRecords,
          checksum: fnv1a(JSON.stringify(data))
        },
        data
      };

      // Round-trip: serialize, re-parse, then validate the exact bytes offered.
      const serialized = JSON.stringify(payload, null, 2);
      const parsed = JSON.parse(serialized);
      const validation = validatePayload(parsed);

      if (!validation.ok) {
        const detail = validation.errors[0] || 'validation failed';
        NotificationService.error('Backup failed: ' + detail);
        console.error('[Backup] validation failed:', validation.errors);
        return { ok: false, filename, errors: validation.errors };
      }

      triggerDownload(serialized, filename);

      // Timestamps are written raw (no JSON.stringify) because the dashboard
      // reads them with localStorage.getItem directly.
      localStorage.setItem(LAST_BACKUP_TAG, new Date().toISOString());
      if (auto) localStorage.setItem(AUTO_BACKUP_TAG, todayKey());

      if (auto) {
        NotificationService.info('Daily backup created: ' + filename);
      } else {
        NotificationService.success('Backup generated successfully!');
      }

      return { ok: true, filename, records: totalRecords, collections: Object.keys(data).length };
    } catch (error) {
      NotificationService.error('Backup failed: ' + (error && error.message ? error.message : 'unknown error'));
      console.error('[Backup] error:', error);
      return { ok: false, filename: buildFilename(), error: error && error.message };
    }
  }
};
