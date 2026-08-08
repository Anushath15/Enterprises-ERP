/**
 * Senthil Enterprises ERP - Settings Service
 *
 * Reads/writes the single `erp_settings` object via LocalStorageService.
 * Validation is delegated to settingsSchema so the same rules apply everywhere.
 */

import { LocalStorageService } from './storage/localStorageService.js';
import {
  SETTINGS_DEFAULTS,
  sanitizeSettings,
  validateSettings
} from '../utils/settingsSchema.js';
import { APP_NAME, APP_VERSION } from './backupService.js';

const KEY = 'erp_settings';

export const settingsService = {
  load() {
    const stored = LocalStorageService.get(KEY) || {};
    return sanitizeSettings(stored);
  },

  loadField(field, fallback) {
    const settings = this.load();
    return settings[field] !== undefined ? settings[field] : (fallback === undefined ? SETTINGS_DEFAULTS[field] : fallback);
  },

  /**
   * Atomically persist the entire settings object after validation.
   * Unknown keys are stripped, defaults fill gaps.
   * Returns { ok, errors } .
   */
  save(changed) {
    const merged = sanitizeSettings(changed);
    const result = validateSettings(merged);
    if (!result.valid) {
      return { ok: false, errors: result.errors };
    }
    LocalStorageService.set(KEY, merged);
    if (merged.theme) {
      this.applyTheme(merged.theme);
    }
    if (merged.fontSize) {
      this.applyFontSize(merged.fontSize);
    }
    if (merged.compactMode !== undefined) {
      this.applyCompactMode(merged.compactMode);
    }
    return { ok: true };
  },

  saveField(field, value) {
    const current = this.load();
    current[field] = value;
    return this.save(current);
  },

  reset() {
    LocalStorageService.remove(KEY);
    return this.load();
  },

  applyTheme(theme) {
    if (!theme || typeof document === 'undefined') return;
    document.body.classList.remove('theme-light', 'theme-dark');
    if (theme === 'dark') {
      document.body.classList.add('theme-dark');
    } else if (theme === 'light') {
      document.body.classList.add('theme-light');
    }
    // 'auto' maps to system (no class => light by default)
  },

  applyFontSize(size) {
    if (!size || typeof document === 'undefined') return;
    document.documentElement.classList.remove('font-small', 'font-normal', 'font-large');
    const cls = 'font-' + size;
    document.documentElement.classList.add(cls);
  },

  applyCompactMode(compact) {
    if (typeof document === 'undefined') return;
    if (compact) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  },

  getBackupStatus() {
    const lastManual = localStorage.getItem('erp_last_backup');
    const lastAuto = localStorage.getItem('erp_last_auto_backup');
    return {
      lastManualBackup: lastManual || null,
      lastAutoBackup: lastAuto || null,
      hasBackup: !!lastManual
    };
  },

  getAppInfo() {
    const settings = this.load();
    return {
      appName: APP_NAME,
      appVersion: APP_VERSION,
      dbVersion: settings.dbVersion,
      buildDate: '2026-07-28'
    };
  }
};
