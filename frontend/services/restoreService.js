/**
 * Senthil Enterprises ERP - Restore Service
 * ------------------------------------------------------------------
 * Version 1.0 - Production restore subsystem for the offline
 * (LocalStorage / OfflineDataProvider) architecture.
 *
 * Responsibilities:
 *  - Validate a user-selected backup JSON against the Version 1.0 schema.
 *  - Reject corrupted / tampered backups (checksum mismatch) and any
 *    incompatible app version.
 *  - Ask the user to confirm before overwriting live data.
 *  - Restore every business collection ATOMICALLY: a snapshot of the
 *    current database is taken first; if any write fails mid-restore the
 *    snapshot is reapplied so the database is never left in a partial state.
 *  - Update backup status tags and reload the application on success.
 *  - Surface success/failure feedback via the global toast system.
 */
import { LocalStorageService } from './storage/localStorageService.js';
import { NotificationService } from './notificationService.js';
import {
  APP_NAME,
  APP_VERSION,
  BACKUP_TYPE,
  BUSINESS_COLLECTIONS,
  REQUIRED_COLLECTIONS,
  OBJECT_COLLECTIONS,
  fnv1a,
  todayKey
} from './backupService.js';

export const RestoreService = {
  /** Hidden file input reused across restores. */
  _fileInput: null,

  /** Build (once) a detached <input type="file"> bound to the change handler. */
  _ensureFileInput() {
    if (this._fileInput) return this._fileInput;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    input.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) {
        input.value = '';
        this._onFileSelected(file);
      }
    });
    document.body.appendChild(input);
    this._fileInput = input;
    return input;
  },

  /** Public entry: prompt the user to pick a backup file. */
  initiateRestore() {
    const input = this._ensureFileInput();
    input.click();
  },

  async _onFileSelected(file) {
    const text = await this._readFile(file);
    return this.restoreFromText(text);
  },

  _readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Could not read backup file'));
      reader.readAsText(file);
    });
  },

  /**
   * Validate + (after confirmation) apply + reload.
   * Returns { ok: boolean, reason?: string } for programmatic callers.
   */
  async restoreFromText(text) {
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return this._fail('This is not a valid JSON file.');
    }

    const validation = this._validateBackupPayload(payload);
    if (!validation.ok) {
      return this._fail(validation.reason);
    }

    // Confirmation dialog before destroying any live data.
    const confirmed = window.confirm(
      'Restoring will REPLACE all current ERP data with the backup contents.\n\n'
        + 'Any data created since the backup was made will be lost.\n\n'
        + 'Do you want to continue?'
    );
    if (!confirmed) {
      NotificationService.info('Restore cancelled');
      return { ok: false, reason: 'cancelled' };
    }

    const result = this._applyAtomic(payload.data);
    if (!result.ok) {
      return this._fail('Restore failed: ' + result.reason + '. The previous database was restored.');
    }

    // Tags are written as raw strings (dashboard reads them directly).
    LocalStorageService.set('erp_last_backup', result.backupDate);
    localStorage.setItem('erp_last_auto_backup', todayKey());

    NotificationService.success('Database restored successfully. Reloading...');
    // Let the toast flush before the page tears down.
    setTimeout(() => window.location.reload(), 1200);
    return { ok: true };
  },

  /** Structural + checksum + version validation. */
  _validateBackupPayload(payload) {
    if (!payload || typeof payload !== 'object') {
      return { ok: false, reason: 'Backup payload is not an object.' };
    }
    const meta = payload.meta || {};
    const data = payload.data;
    if (!data || typeof data !== 'object') {
      return { ok: false, reason: 'Backup data section missing.' };
    }

    if (meta.app !== APP_NAME) {
      return { ok: false, reason: 'Incompatible backup: app "' + meta.app + '" does not match "' + APP_NAME + '".' };
    }
    if (meta.type !== BACKUP_TYPE) {
      return { ok: false, reason: 'Incompatible backup type: expected "' + BACKUP_TYPE + '", got "' + meta.type + '".' };
    }

    // Version compatibility gate (exact match for v1.0).
    const backupVersion = String(meta.version || '');
    if (backupVersion !== APP_VERSION) {
      return { ok: false, reason: 'Incompatible backup version: restore expects app version ' + APP_VERSION + ', backup declares "' + (meta.version || 'unknown') + '".' };
    }

    // Required collections present with correct types.
    for (const key of REQUIRED_COLLECTIONS) {
      const value = data[key];
      if (value === undefined) {
        return { ok: false, reason: 'Corrupted backup: required collection missing (' + key + ').' };
      }
      if (OBJECT_COLLECTIONS.has(key)) {
        if (typeof value !== 'object' || Array.isArray(value)) {
          return { ok: false, reason: 'Corrupted backup: "' + key + '" must be an object.' };
        }
      } else if (!Array.isArray(value)) {
        return { ok: false, reason: 'Corrupted backup: "' + key + '" must be an array.' };
      }
    }

    // Reject an empty backup (no product records). An empty business DB is
    // almost always the result of a tampered/truncated file.
    const products = data.erp_products;
    if (Array.isArray(products) && products.length === 0) {
      return { ok: false, reason: 'Corrupted backup: no product records found.' };
    }

    // Integrity gate: FNV-1a checksum (must match the value computed by
    // BackupService over JSON.stringify(data)).
    if (typeof meta.checksum !== 'string') {
      return { ok: false, reason: 'Corrupted backup: checksum missing.' };
    }
    const recomputed = fnv1a(JSON.stringify(data));
    if (recomputed !== meta.checksum) {
      return { ok: false, reason: 'Corrupted backup: checksum mismatch (file was modified or truncated).' };
    }

    return { ok: true };
  },

  /**
   * Apply a validated backup.data object atomically.
   * Strategy: snapshot every current key -> write all -> on any failure,
   * rollback all keys from the snapshot; if the rollback itself can't
   * complete, surface that the DB may be partially modified.
   */
  _applyAtomic(data) {
    const scope = [...BUSINESS_COLLECTIONS, 'erp_last_backup', 'erp_last_auto_backup'];
    const snapshot = new Map();
    for (const key of scope) {
      snapshot.set(key, localStorage.getItem(key));
    }

    const written = [];
    let wroteAll = true;
    let failKey = null;
    try {
      for (const key of BUSINESS_COLLECTIONS) {
        const value = data[key];
        if (value === undefined) {
          throw new Error('Missing collection: ' + key);
        }
        const ok = LocalStorageService.set(key, value);
        if (!ok) { wroteAll = false; failKey = key; break; }
        written.push(key);
      }
    } catch (e) {
      wroteAll = false;
      failKey = e.message;
    }

    if (!wroteAll) {
      const rollback = this._rollbackAtomic(snapshot, scope, written);
      if (!rollback.ok) {
        return { ok: false, reason: failKey + (rollback.reason ? ' (rollback incomplete: ' + rollback.reason + ')' : '') };
      }
      return { ok: false, reason: 'Write failed at ' + failKey + '; rollback applied.' };
    }

    const backupDate = data.erp_system_state && data.erp_system_state.lastBackup
      ? String(data.erp_system_state.lastBackup)
      : new Date().toISOString();
    return { ok: true, backupDate };
  },

  _rollbackAtomic(snapshot, scope, written) {
    const failed = [];
    for (const key of scope) {
      try {
        const prev = snapshot.get(key);
        if (prev === null || prev === undefined) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, prev);
        }
      } catch (e) {
        failed.push(key);
      }
    }
    return { ok: failed.length === 0, reason: failed.length ? 'keys: ' + failed.join(',') : '' };
  },

  _fail(msg) {
    NotificationService.error(msg);
    return { ok: false, reason: msg };
  }
};
