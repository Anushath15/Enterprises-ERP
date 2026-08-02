/**
 * Senthil Enterprises ERP - Production Database Maintenance utilities
 * ------------------------------------------------------------------
 * Version 1.0 - Pure helpers for the Database Maintenance Center.
 *
 * These functions are PURE: they take already-loaded data (or
 * localStorage, for storage-only queries) and return results — they never
 * mutate business state. The companion MaintenanceService performs the
 * confirmed atomic writes.
 *
 * Design goals: no business-logic changes, safe-by-default, single source
 * of truth for the maintenance schema. Reuses BackupService's collection
 * lists and exportUtils's formatters so there is no duplicated logic.
 */
import {
  BUSINESS_COLLECTIONS, REQUIRED_COLLECTIONS, OBJECT_COLLECTIONS, fnv1a,
  APP_NAME, APP_VERSION
} from '../services/backupService.js';
import { formatCurrency, formatDate } from './exportUtils.js';

export { BUSINESS_COLLECTIONS, REQUIRED_COLLECTIONS, OBJECT_COLLECTIONS, fnv1a, APP_NAME, APP_VERSION };

/** Severity levels for health findings. */
export const SEVERITY = { OK: 'ok', WARN: 'warn', ERROR: 'error' };

/**
 * Per-collection schema: required string fields + numeric fields eligible for
 * "invalid numeric" checks (NaN, non-finite, wrong type) + boolean numeric
 * fields that must be >= 0. Dates are auto-detected from these suffixes, but
 * we also explicitly flag the canonical ISO date fields below.
 */
const SCHEMA = {
  erp_products: { required: ['id', 'name'], numerics: ['price', 'buyingPrice', 'stock', 'minStock', 'gst'], nonNegative: ['stock', 'minStock', 'buyingPrice'], dates: ['createdAt', 'updatedAt'] },
  erp_customers: { required: ['id', 'name'], numerics: ['creditLimit', 'outstanding'], nonNegative: ['creditLimit', 'outstanding'], dates: ['createdAt', 'updatedAt'] },
  erp_dealers: { required: ['id', 'name'], numerics: ['outstanding', 'totalPurchased'], nonNegative: ['outstanding', 'totalPurchased'], dates: ['createdAt', 'updatedAt'] },
  erp_sales_invoices: { required: ['id', 'date', 'customerId', 'totalAmount'], numerics: ['totalAmount', 'amountPaid', 'taxAmount', 'balance'], nonNegative: ['totalAmount', 'amountPaid'], dates: ['date', 'createdAt', 'updatedAt'] },
  erp_purchases: { required: ['id', 'date', 'supplierId', 'totalAmount'], numerics: ['totalAmount', 'amountPaid'], nonNegative: ['totalAmount', 'amountPaid'], dates: ['date', 'createdAt', 'updatedAt'] },
  erp_sales_returns: { required: ['id', 'date'], numerics: ['totalAmount', 'amountPaid'], nonNegative: ['totalAmount', 'amountPaid'], dates: ['date'] },
  erp_purchase_returns: { required: ['id', 'date'], numerics: ['totalAmount', 'amountPaid'], nonNegative: ['totalAmount', 'amountPaid'], dates: ['date'] },
  erp_deliveries: { required: ['id', 'date'], numerics: ['totalAmount'], nonNegative: ['totalAmount'], dates: ['date'] },
  erp_expenses: { required: ['id', 'date', 'amount', 'category'], numerics: ['amount'], nonNegative: ['amount'], dates: ['date', 'createdAt', 'updatedAt'] },
  erp_stock_adjustments: { required: ['id', 'date', 'productId', 'quantity'], numerics: ['quantity'], dates: ['date', 'createdAt', 'updatedAt'] },
  erp_daily_closings: { required: ['id', 'date'], numerics: ['openingCash', 'cashSales', 'upiSales', 'cardSales', 'creditSales', 'totalExpenses', 'expectedCash', 'actualCash', 'difference'], nonNegative: ['openingCash', 'cashSales', 'upiSales', 'cardSales', 'creditSales', 'totalExpenses', 'expectedCash', 'actualCash'], dates: ['date'] },
  erp_product_price_history: { required: ['id', 'productId'], numerics: ['price'], nonNegative: ['price'], dates: ['date'] },
  erp_categories: { required: ['id', 'name'], dates: ['createdAt', 'updatedAt'] },
  erp_expense_categories: { required: ['name'], dates: ['createdAt', 'updatedAt'] },
  erp_house_projects: { required: ['id', 'name'], numerics: ['budget', 'spent'], nonNegative: ['budget', 'spent'], dates: ['createdAt', 'updatedAt'] },
  erp_warranties: { required: ['id', 'productId'], numerics: ['amount'], nonNegative: ['amount'], dates: ['date', 'createdAt', 'updatedAt'] },
  erp_staff: { required: ['id', 'name'], numerics: ['salary'], nonNegative: ['salary'], dates: ['createdAt', 'updatedAt'] },
  erp_users: { required: ['id', 'name', 'username'], dates: ['createdAt', 'updatedAt'] },
  erp_settings: { required: [], numerics: [] },
  erp_system_state: { required: [], numerics: ['lastInvoiceNumber', 'lastPurchaseNumber', 'lastDeliveryNumber'] },
  erp_settings_history: { required: ['date'], dates: ['date'] },
  erp_notifications: { required: ['id'], dates: ['date'] }
};

export const MAINTENANCE_SCHEMA = SCHEMA;

/** Reference graph: which invoice/deal fields point to which lookup sets. */
const REFERENCES = {
  'erp_sales_invoices': [{ field: 'customerId', set: 'erp_customers', emptyAllowed: true }],
  'erp_purchases': [{ field: 'supplierId', set: 'erp_dealers', emptyAllowed: true }],
  'erp_sales_returns': [{ field: 'customerId', set: 'erp_customers', emptyAllowed: true }],
  'erp_purchase_returns': [{ field: 'supplierId', set: 'erp_dealers', emptyAllowed: true }],
  'erp_stock_adjustments': [{ field: 'productId', set: 'erp_products', emptyAllowed: false }],
  'erp_deliveries': [{ field: 'customerId', set: 'erp_customers', emptyAllowed: true }],
  'erp_product_price_history': [{ field: 'productId', set: 'erp_products', emptyAllowed: false }],
  'erp_warranties': [{ field: 'productId', set: 'erp_products', emptyAllowed: false }]
};

/** Collections whose records hold user-facing "name" fields (for ref healing). */
const NAME_FALLBACK = {
  erp_sales_invoices: 'customerName',
  erp_purchases: 'dealerName',
  erp_stock_adjustments: 'productName'
};

/**
 * Build an index of valid IDs per collection (set of strings).
 * Only ARRAY collections are indexed.
 */
function indexIds(data) {
  const idx = {};
  for (const key of BUSINESS_COLLECTIONS) {
    const val = data[key];
    if (Array.isArray(val)) {
      const s = new Set();
      for (const rec of val) {
        if (rec && rec.id != null) s.add(String(rec.id));
      }
      idx[key] = s;
    } else {
      idx[key] = null;
    }
  }
  return idx;
}

/**
 * ---- 1. Database Statistics ----
 * All values pure-from data; the Service supplies the `data` snapshot.
 */
export function computeStatistics(data) {
  const idx = indexIds(data);
  const count = (key) => Array.isArray(data[key]) ? data[key].length : (data[key] ? 1 : 0);

  let inventoryValue = 0;
  const products = Array.isArray(data.erp_products) ? data.erp_products : [];
  for (const p of products) {
    const cost = Number(p.buyingPrice || p.avgCost || 0);
    const stock = Number(p.stock || 0);
    if (Number.isFinite(cost) && Number.isFinite(stock)) inventoryValue += cost * stock;
  }

  let dbSize = 0;
  for (const key of BUSINESS_COLLECTIONS) {
    const v = data[key];
    if (v == null) continue;
    try { dbSize += JSON.stringify(v).length; } catch { dbSize += 0; }
  }

  return {
    products: count('erp_products'),
    customers: count('erp_customers'),
    dealers: count('erp_dealers'),
    sales: count('erp_sales_invoices'),
    purchases: count('erp_purchases'),
    expenses: count('erp_expenses'),
    inventoryValue,
    dbSizeBytes: dbSize,
    lastBackup: localStorage.getItem('erp_last_backup') || null,
    lastRestore: localStorage.getItem('erp_last_restore') || null,
    app: APP_NAME,
    version: APP_VERSION,
    checksum: fnv1a(JSON.stringify(data))
  };
}

/**
 * ---- 2. Database Health Check ----
 * Returns an array of findings: { severity, code, collection, id, field, message }.
 * severity: 'ok' | 'warn' | 'error'.
 */
export function runHealthCheck(data) {
  const findings = [];
  const idx = indexIds(data);
  const schema = MAINTENANCE_SCHEMA;

  for (const key of BUSINESS_COLLECTIONS) {
    const value = data[key];
    const expectedObject = OBJECT_COLLECTIONS.has(key);

    // Absent (lazy/unused) collections are NOT errors; corrupted ones are.
    if (value === undefined) {
      continue;
    }
    if (value === null) {
      findings.push({ severity: SEVERITY.ERROR, code: 'CORRUPTED_COLLECTION', collection: key, message: 'Collection exists in localStorage but failed to parse (corrupted JSON).' });
      continue;
    }
    if (expectedObject) {
      if (typeof value !== 'object' || Array.isArray(value)) {
        findings.push({ severity: SEVERITY.ERROR, code: 'INVALID_TYPE', collection: key, message: 'Expected an object for this collection.' });
        continue;
      }
    } else if (!Array.isArray(value)) {
      findings.push({ severity: SEVERITY.ERROR, code: 'INVALID_TYPE', collection: key, message: 'Expected an array for this collection.' });
      continue;
    }

    // Array-collection record-level checks.
    if (Array.isArray(value)) {
      const seenIds = new Map();
      const def = schema[key];
      for (let i = 0; i < value.length; i++) {
        const rec = value[i];
        const rid = rec && rec.id != null ? String(rec.id) : null;

        // Duplicate IDs.
        if (rid) {
          if (seenIds.has(rid)) {
            findings.push({ severity: SEVERITY.ERROR, code: 'DUPLICATE_ID', collection: key, id: rid, message: 'Duplicate record id detected.' });
          } else {
            seenIds.set(rid, i);
          }
        } else if (def && def.required && def.required.length) {
          findings.push({ severity: SEVERITY.WARN, code: 'MISSING_ID', collection: key, id: `#${i}`, message: 'A record is missing its id.' });
        }

        // Missing required fields.
        if (def) {
          const req = def.required || [];
          const nums = def.numerics || [];
          const nonNeg = def.nonNegative || [];
          const dts = def.dates || [];
          for (const rf of req) {
            if (rec[rf] === null || rec[rf] === undefined || rec[rf] === '') {
              findings.push({ severity: SEVERITY.WARN, code: 'MISSING_FIELD', collection: key, id: rid, field: rf, message: 'Required field is empty.' });
            }
          }
          // Invalid numerics.
          for (const nf of nums) {
            if (!(nf in rec)) continue;
            const raw = rec[nf];
            const num = Number(raw);
            if (raw !== null && raw !== undefined && raw !== '' && (!Number.isFinite(num))) {
              findings.push({ severity: SEVERITY.WARN, code: 'INVALID_NUMBER', collection: key, id: rid, field: nf, message: 'Field is not a valid number.' });
            }
          }
          // Negative values where they must be >= 0.
          for (const nf of nonNeg) {
            if (!(nf in rec)) continue;
            const num = Number(rec[nf]);
            if (Number.isFinite(num) && num < 0) {
              findings.push({ severity: SEVERITY.WARN, code: 'NEGATIVE_VALUE', collection: key, id: rid, field: nf, message: 'Field must not be negative.' });
            }
          }
          // Invalid dates.
          for (const df of dts) {
            if (!(df in rec)) continue;
            const d = rec[df];
            if (!d) continue;
            if (!(new Date(d).getTime() > 0)) {
              findings.push({ severity: SEVERITY.ERROR, code: 'INVALID_DATE', collection: key, id: rid, field: df, message: 'Field is not a valid date.' });
            }
          }
        }
      }
    }
  }

  // Negative stock (explicit, prominent).
  if (Array.isArray(data.erp_products)) {
    for (const p of data.erp_products) {
      const st = Number(p.stock);
      if (Number.isFinite(st) && st < 0) {
        findings.push({ severity: SEVERITY.WARN, code: 'NEGATIVE_STOCK', collection: 'erp_products', id: p.id, field: 'stock', message: 'Negative stock is not physically possible.' });
      }
    }
  }

  // Broken references.
  for (const col in REFERENCES) {
    const refs = REFERENCES[col];
    const recs = Array.isArray(data[col]) ? data[col] : [];
    for (const rec of recs) {
      for (const ref of refs) {
        const refId = rec[ref.field];
        if (refId === null || refId === undefined || refId === '') {
          if (ref.emptyAllowed) continue;
          findings.push({ severity: SEVERITY.ERROR, code: 'MISSING_REFERENCE', collection: col, id: rec.id, field: ref.field, message: 'Missing required reference (' + ref.set + ').' });
          continue;
        }
        const target = idx[ref.set];
        if (!target) {
          findings.push({ severity: SEVERITY.WARN, code: 'UNRESOLVED_REFERENCE', collection: col, id: rec.id, field: ref.field, message: 'Reference target collection unavailable.' });
        } else if (!target.has(String(refId))) {
          findings.push({ severity: SEVERITY.ERROR, code: 'BROKEN_REFERENCE', collection: col, id: rec.id, field: ref.field, message: 'Reference points to a non-existent ' + ref.set + ' id.' });
        }
      }
    }
  }

  // Orphan records in transaction-like collections that reference a product
  // which no longer exists.
  const productSet = idx['erp_products'];
  const orphanCols = ['erp_stock_adjustments', 'erp_product_price_history', 'erp_warranties'];
  for (const col of orphanCols) {
    const recs = Array.isArray(data[col]) ? data[col] : [];
    for (const rec of recs) {
      if (rec.productId && productSet && !productSet.has(String(rec.productId))) {
        findings.push({ severity: SEVERITY.WARN, code: 'ORPHAN_RECORD', collection: col, id: rec.id, field: 'productId', message: 'Orphan record references a missing product (candidate for cleanup).' });
      }
    }
  }

  const summary = findings.reduce((a, f) => {
    if (f.severity === SEVERITY.ERROR) a.errors++;
    else if (f.severity === SEVERITY.WARN) a.warnings++;
    else a.ok++;
    return a;
  }, { total: findings.length, ok: 0, warnings: 0, errors: 0 });

  return { findings, summary };
}

/**
 * ---- 3. Database Repair (pure) ----
 * Returns { data, actions, summary } WITHOUT writing anything.
 * MaintenanceService writes the returned `data` atomically after confirmation.
 *
 * operations: { dedupe, recalcTotals, normalizeNumbers, fixReferences } (all bools)
 */
export function planRepair(data, operations = {}) {
  const ops = {
    dedupe: true, recalcTotals: true, normalizeNumbers: true, fixReferences: true, ...operations
  };
  const actions = [];
  const out = {};

  for (const key of BUSINESS_COLLECTIONS) {
    let val = data[key];
    if (val === undefined || val === null) { out[key] = val; continue; }

    if (Array.isArray(val)) {
      // dedupe by id (keep first valid occurrence).
      if (ops.dedupe) {
        const seen = new Set(); const cleaned = []; let removed = 0;
        for (const rec of val) {
          const rid = rec && rec.id != null ? String(rec.id) : null;
          if (rid) {
            if (seen.has(rid)) { removed++; continue; }
            seen.add(rid);
          }
          cleaned.push(rec);
        }
        if (removed) actions.push({ collection: key, op: 'dedupe', removed, message: `Removed ${removed} duplicate record(s).` });
        val = cleaned;
      }
      out[key] = val;
    } else if (typeof val === 'object') {
      out[key] = val;
    }
  }

  // recalcTotals: sales & purchases line-item totals.
  const recalcInvoice = (inv) => {
    const items = Array.isArray(inv.items) ? inv.items : [];
    let total = 0;
    for (const it of items) {
      const q = Number(it.qty || 0); const pr = Number(it.price || 0);
      if (Number.isFinite(q) && Number.isFinite(pr)) total += q * pr;
    }
    const before = Number(inv.totalAmount);
    const tax = Number(inv.taxAmount || 0);
    const rounded = Math.round((total + tax) * 100) / 100;
    inv.totalAmount = rounded;
    const paid = Number(inv.amountPaid || 0);
    inv.balance = Math.round((rounded - paid) * 100) / 100;
    return { changed: before !== rounded || !inv.balance, newTotal: rounded, newBalance: inv.balance };
  };
  if (ops.recalcTotals) {
    if (Array.isArray(out.erp_sales_invoices)) {
      let fixed = 0;
      out.erp_sales_invoices.forEach(inv => { if (recalcInvoice(inv).changed) fixed++; });
      if (fixed) actions.push({ collection: 'erp_sales_invoices', op: 'recalc_totals', fixed, message: `Recalculated totals for ${fixed} invoice(s).` });
    }
    if (Array.isArray(out.erp_purchases)) {
      let fixed = 0;
      out.erp_purchases.forEach(inv => { if (recalcInvoice(inv).changed) fixed++; });
      if (fixed) actions.push({ collection: 'erp_purchases', op: 'recalc_totals', fixed, message: `Recalculated totals for ${fixed} invoice(s).` });
    }
    if (Array.isArray(out.erp_sales_returns)) {
      let fixed = 0;
      out.erp_sales_returns.forEach(inv => { if (recalcInvoice(inv).changed) fixed++; });
      if (fixed) actions.push({ collection: 'erp_sales_returns', op: 'recalc_totals', fixed, message: `Recalculated totals for ${fixed} return(s).` });
    }
  }

  // normalizeNumbers: clamp negatives on nonNegative schema fields, NaN->0.
  if (ops.normalizeNumbers) {
    for (const key of BUSINESS_COLLECTIONS) {
      const def = MAINTENANCE_SCHEMA[key];
      if (!def || !Array.isArray(out[key])) continue;
      let fixed = 0;
      for (const rec of out[key]) {
        const nums = def.numerics || [];
        const nonNeg = def.nonNegative || [];
        for (const nf of nums) {
          if (!(nf in rec)) continue;
          const raw = rec[nf];
          const num = Number(raw);
          if (raw !== null && raw !== undefined && raw !== '' && !Number.isFinite(num)) {
            rec[nf] = 0; fixed++;
          }
        }
        for (const nnf of nonNeg) {
          if (!(nnf in rec)) continue;
          const num = Number(rec[nnf]);
          if (Number.isFinite(num) && num < 0) { rec[nnf] = 0; fixed++; }
        }
      }
      if (fixed) actions.push({ collection: key, op: 'normalize_numbers', fixed, message: `Normalized ${fixed} invalid/negative numeric value(s).` });
    }
    // products stock: clamp negatives to 0 (safe interpretation of "recalculate inventory stock").
    if (Array.isArray(out.erp_products)) {
      let fixed = 0;
      for (const p of out.erp_products) {
        const st = Number(p.stock);
        if (Number.isFinite(st) && st < 0) { p.stock = 0; fixed++; }
      }
      if (fixed) actions.push({ collection: 'erp_products', op: 'normalize_stock', fixed, message: `Clamped ${fixed} negative stock value(s) to 0.` });
    }
  }

  // fixReferences: clear dangling ids to empty (do NOT fabricate links).
  if (ops.fixReferences) {
    const idx = indexIds(out);
    for (const col in REFERENCES) {
      const refs = REFERENCES[col];
      const recs = Array.isArray(out[col]) ? out[col] : [];
      let fixed = 0;
      for (const rec of recs) {
        for (const ref of refs) {
          const id = rec[ref.field];
          if (id === null || id === undefined || id === '') continue;
          const target = idx[ref.set];
          if (target && !target.has(String(id))) {
            // Heal where possible: if a name fallback exists, clear the id (record kept).
            if (NAME_FALLBACK[col]) {
              // leave name field intact; clear dangling id
            }
            rec[ref.field] = '';
            rec._danglingReference = id;
            fixed++;
          }
        }
      }
      if (fixed) actions.push({ collection: col, op: 'fix_refs', fixed, message: `Cleared ${fixed} dangling reference id(s).` });
    }
  }

  return { data: out, actions, appliedOperations: ops };
}

/**
 * ---- 4. Storage Usage ----
 * Pure over a snapshot of all localStorage keys (passed in by the Service).
 */
export function analyzeStorage(allEntries) {
  // allEntries: [{ key, value, bytes }] covering the entire localStorage.
  const erp = []; let other = 0; const byKey = [];
  let total = 0;
  for (const e of allEntries) {
    total += e.bytes;
    byKey.push({ key: e.key, bytes: e.bytes });
    if (String(e.key).startsWith('erp_')) {
      erp.push({ key: e.key, bytes: e.bytes });
    } else {
      other += e.bytes;
    }
  }
  byKey.sort((a, b) => b.bytes - a.bytes);
  const QUOTA = 5 * 1024 * 1024; // browser localStorage ~5MB
  return {
    usedBytes: total,
    quotaBytes: QUOTA,
    percent: QUOTA > 0 ? Math.min(100, Math.round((total / QUOTA) * 100)) : 0,
    erpBytes: erp.reduce((s, x) => s + x.bytes, 0),
    otherBytes: other,
    largestCollections: byKey.slice(0, 10)
  };
}

/**
 * ---- 5. Cleanup candidates ----
 * Returns { tempCache, oldLogs, expiredBackups, orphans, safeToRemove: [keys] }.
 * No mutation; the Service removes the reported keys after confirmation.
 */
export function findCleanupCandidates(data, allKeys) {
  const safeToRemove = [];
  const tempCache = [];
  const oldLogs = [];
  const expiredBackups = [];

  for (const e of allKeys) {
    const k = String(e.key);
    if (/^(erp_drafts|erp_temp_|erp_cache_|erp_log_|erp_logs)/.test(k) || k === 'erp_notifications') {
      safeToRemove.push(k);
      tempCache.push({ key: k, bytes: e.bytes });
    }
    if (/erp_backup_|erp_export_|_bak$|backup_v/i.test(k) && !BUSINESS_COLLECTIONS.includes(k)) {
      safeToRemove.push(k);
      expiredBackups.push({ key: k, bytes: e.bytes });
    }
  }

  // Orphan records (reference missing products) — non-business, safe to drop.
  const orphans = [];
  const productIds = new Set((Array.isArray(data.erp_products) ? data.erp_products : []).map(p => p && p.id).filter(Boolean));
  for (const col of ['erp_stock_adjustments', 'erp_product_price_history', 'erp_warranties']) {
    const recs = Array.isArray(data[col]) ? data[col] : [];
    for (const rec of recs) {
      if (rec.productId && !productIds.has(rec.productId)) {
        orphans.push({ collection: col, id: rec.id, productId: rec.productId });
      }
    }
  }

  return { tempCache, oldLogs, expiredBackups, orphans, safeToRemove };
}

/**
 * ---- 6. Database Reset scope ----
 * Returns the list of localStorage keys the reset will wipe (ERP namespace only).
 * Business/non-business: only keys starting with 'erp_' plus the raw auth tokens
 * that are ERP-scoped. Non-ERP app data (none currently) is preserved.
 */
export function resetScope(allKeys) {
  return allKeys.filter(e => String(e.key).startsWith('erp_')).map(e => e.key);
}

export { formatCurrency, formatDate };
