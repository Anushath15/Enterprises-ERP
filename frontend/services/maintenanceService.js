/**
 * Senthil Enterprises ERP - Production Database Maintenance Service
 * ------------------------------------------------------------------
 * Orchestrates the Database Maintenance Center operations.
 *
 * Safety model:
 *  - All reads come from LocalStorageService (raw, so corrupted JSON is
 *    detectable) OR DataProvider (non-deleted records) for live views.
 *  - All writes are ATOMIC (snapshot -> write -> rollback-on-failure).
 *  - Every mutating operation REQUIRES an explicit `confirmed: true`
 *    argument; the Service refuses silently otherwise, so a UI wiring bug
 *    can never corrupt data by accident.
 *  - Reset requires a typed confirmation token ('ERASE') in addition to
 *    `confirmed: true` (multiple confirmation barriers).
 *  - BackupService / RestoreService / DataProvider / NotificationService
 *    are reused; no business logic is duplicated or changed.
 */
import { LocalStorageService } from './storage/localStorageService.js';
import { DataProvider } from './dataProvider.js';
import { NotificationService } from './notificationService.js';
import { BackupService } from './backupService.js';
import {
  BUSINESS_COLLECTIONS, OBJECT_COLLECTIONS, fnv1a, APP_NAME, APP_VERSION,
  computeStatistics, runHealthCheck, planRepair, analyzeStorage,
  findCleanupCandidates, resetScope
} from '../utils/maintenanceUtils.js';

/** Snapshot all ERP business collections.
 *  - key absent from localStorage  -> omitted (lazy/unused collection, NOT an error)
 *  - present but unparseable JSON  -> null (corrupted)
 *  - present & valid               -> parsed value
 *  This distinction lets the health check report corruption without false-positiving on
 *  lazily-initialized collections.
 */
function snapshotData() {
  const data = {};
  for (const key of BUSINESS_COLLECTIONS) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;                 // absent -> omit
    try { data[key] = JSON.parse(raw); } catch { data[key] = null; } // corrupt
  }
  return data;
}

/** Read every raw localStorage entry { key, value, bytes }. */
function readAllEntries() {
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key === null) continue;
    const value = localStorage.getItem(key);
    entries.push({ key, value, bytes: value ? value.length : 0 });
  }
  return entries;
}

/** Atomic multi-key write. `updates` is {key: parsedValue|null(remove)}. */
function atomicWrite(updates) {
  const scope = Object.keys(updates);
  const snapshot = new Map();
  for (const k of scope) snapshot.set(k, localStorage.getItem(k));
  const written = [];
  for (const k of scope) {
    try {
      const v = updates[k];
      if (v === null) {
        localStorage.removeItem(k);
      } else {
        LocalStorageService.set(k, v);
      }
      written.push(k);
    } catch (e) {
      // Rollback.
      for (const k2 of scope) {
        try {
          const prev = snapshot.get(k2);
          if (prev === null || prev === undefined) localStorage.removeItem(k2);
          else localStorage.setItem(k2, prev);
        } catch { /* best-effort rollback */ }
      }
      return { ok: false, reason: 'Write failed at ' + k + ': ' + (e && e.message) };
    }
  }
  return { ok: true, written };
}

export const MaintenanceService = {
  /** Live collection counts via DataProvider (excludes deleted records). */
  getCollectionCounts() {
    const counts = {};
    for (const key of BUSINESS_COLLECTIONS) {
      let data;
      if (key === 'erp_products') data = DataProvider.getProducts();
      else if (key === 'erp_customers') data = DataProvider.getCustomers();
      else if (key === 'erp_dealers') data = DataProvider.getDealers();
      else if (key === 'erp_sales_invoices') data = DataProvider.getSalesInvoices();
      else if (key === 'erp_purchases') data = DataProvider.getPurchaseInvoices();
      else if (key === 'erp_expenses') data = DataProvider.getExpenses();
      else if (key === 'erp_categories') data = DataProvider.getCategories();
      else if (key === 'erp_stock_adjustments') data = DataProvider.getStockAdjustments();
      else data = LocalStorageService.get(key);
      counts[key] = Array.isArray(data) ? data.length : (data ? 1 : 0);
    }
    return counts;
  },

  /** ---- 1. Statistics ---- */
  getStatistics() {
    const data = snapshotData();
    return computeStatistics(data);
  },

  /** ---- 2. Health check ---- */
  healthCheck() {
    const data = snapshotData();
    return runHealthCheck(data);
  },

  /** ---- 3. Repair ---- */
  async repair(operations = {}, confirmed = false) {
    if (!confirmed) {
      NotificationService.warning('Repair not confirmed — no changes made.');
      return { ok: false, reason: 'not confirmed' };
    }
    const data = snapshotData();
    const { data: repaired, actions, appliedOperations } = planRepair(data, operations);

    if (actions.length === 0) {
      NotificationService.info('No repair work to do — database is clean.');
      return { ok: true, actions: [], changes: 0 };
    }

    // Atomic write of all business collections back.
    const updates = {};
    for (const key of BUSINESS_COLLECTIONS) {
      updates[key] = repaired[key] !== undefined ? repaired[key] : null;
    }
    const result = atomicWrite(updates);
    if (!result.ok) {
      NotificationService.error('Repair failed: ' + result.reason + '. Rollback applied.');
      return { ok: false, reason: result.reason, actions };
    }

    // Track repair history (non-business audit metadata).
    const history = LocalStorageService.get('erp_maintenance_history') || [];
    history.push({
      at: new Date().toISOString(),
      operations: appliedOperations,
      actions: actions.map(a => ({ collection: a.collection, op: a.op, message: a.message }))
    });
    LocalStorageService.set('erp_maintenance_history', history);

    NotificationService.success(`Database repair complete — ${actions.length} operation(s) applied.`);
    return { ok: true, actions, historyEntries: history.length };
  },

  /** ---- 4. Storage usage ---- */
  storageUsage() {
    const entries = readAllEntries();
    return analyzeStorage(entries);
  },

  /** ---- 5. Cleanup ---- */
  async cleanup(options = {}, confirmed = false) {
    if (!confirmed) {
      NotificationService.warning('Cleanup not confirmed — no changes made.');
      return { ok: false, reason: 'not confirmed' };
    }
    const data = snapshotData();
    const entries = readAllEntries();
    const candidates = findCleanupCandidates(data, entries);

    const toRemove = new Set(candidates.safeToRemove);
    // Optionally drop orphan records.
    if (options.removeOrphans) {
      const productIds = new Set((Array.isArray(data.erp_products) ? data.erp_products : []).map(p => p && p.id).filter(Boolean));
      for (const col of ['erp_stock_adjustments', 'erp_product_price_history', 'erp_warranties']) {
        let recs = Array.isArray(data[col]) ? data[col] : [];
        const filtered = recs.filter(r => !(r.productId && !productIds.has(r.productId)));
        if (filtered.length !== recs.length) {
          toRemove.delete(col); // we will rewrite this collection instead
          const updates = {};
          updates[col] = filtered;
          const res = atomicWrite(updates);
          if (!res.ok) {
            NotificationService.error('Cleanup failed on ' + col + ': ' + res.reason);
            return { ok: false, reason: res.reason };
          }
        }
      }
    }

    if (toRemove.size === 0 && !options.removeOrphans) {
      NotificationService.info('No temporary/expired data found to clean up.');
      return { ok: true, removed: 0, candidates, message: 'nothing to remove' };
    }

    const updates = {};
    if (toRemove.size > 0) {
      for (const k of toRemove) updates[k] = null;
      const res = atomicWrite(updates);
      if (!res.ok) {
        NotificationService.error('Cleanup failed: ' + res.reason);
        return { ok: false, reason: res.reason };
      }
    }

    const removedCount = toRemove.size;
    NotificationService.success(`Cleanup complete — removed ${removedCount} temporary/expired item(s).`);
    return { ok: true, removed: removedCount, candidates };
  },

  /** ---- 5b. Cleanup preview (no mutation) ---- */
  cleanupPreview() {
    const data = snapshotData();
    const entries = readAllEntries();
    return findCleanupCandidates(data, entries);
  },

  /** ---- 6. Database reset ---- */
  async resetDatabase({ confirmed = false, confirmationText = '' } = {}) {
    if (!confirmed || confirmationText !== 'ERASE') {
      NotificationService.warning('Database reset not fully confirmed — no changes made.');
      return { ok: false, reason: 'not confirmed' };
    }

    // Backup reminder: warn (do not block) if no recent backup exists.
    const lastBackup = localStorage.getItem('erp_last_backup');
    if (!lastBackup || Date.now() - new Date(lastBackup).getTime() > 24 * 3600 * 1000) {
      NotificationService.warning('No recent backup found. A backup is strongly recommended before resetting.');
    }

    const entries = readAllEntries();
    const keys = resetScope(entries);

    // Atomic wipe of the ERP namespace.
    const updates = {};
    for (const k of keys) updates[k] = null;
    const res = atomicWrite(updates);
    if (!res.ok) {
      NotificationService.error('Reset failed: ' + res.reason);
      return { ok: false, reason: res.reason };
    }

    // Record the reset timestamp (non-ERP audit metadata, preserved).
    localStorage.setItem('erp_last_restore', new Date().toISOString());

    NotificationService.success('Database has been reset to a fresh install state. Reloading...');
    setTimeout(() => { if (typeof window !== 'undefined' && window.location) window.location.reload(); }, 1200);
    return { ok: true, wipedKeys: keys.length };
  },

  /** Last backup / restore timestamps (raw ISO strings). */
  getTimestamps() {
    return {
      lastBackup: localStorage.getItem('erp_last_backup') || null,
      lastRestore: localStorage.getItem('erp_last_restore') || null,
      lastAutoBackup: localStorage.getItem('erp_last_auto_backup') || null
    };
  },

  /** Re-run a fresh backup now (used by the reset "backup reminder"). */
  async createBackupReminder() {
    return BackupService.createManualBackup();
  }
};

export { atomicWrite, snapshotData };
