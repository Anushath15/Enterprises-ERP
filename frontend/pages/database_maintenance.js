/**
 * Senthil Enterprises ERP - Production Database Maintenance Center
 * ------------------------------------------------------------------
 * Six tools, all reusing MaintenanceService (which reuses BackupService /
 * RestoreService / DataProvider / NotificationService):
 *   1. Database Statistics   4. Storage Usage
 *   2. Database Health Check  5. Database Cleanup
 *   3. Database Repair        6. Database Reset
 *
 * No inline JavaScript: every handler is attached via addEventListener in
 * onMount(). All user-derived values are escaped before rendering.
 */
import { MaintenanceService } from '../services/maintenanceService.js';
import { NotificationService } from '../services/notificationService.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { formatCurrency, formatDate } from '../utils/exportUtils.js';

const TABS = [
  ['stats', 'Database Statistics'],
  ['health', 'Database Health Check'],
  ['repair', 'Database Repair'],
  ['storage', 'Storage Usage'],
  ['cleanup', 'Database Cleanup'],
  ['reset', 'Database Reset']
];

const SEV_ICON = { error: 'x', warn: 'alert-triangle', ok: 'check' };

function icon(name) {
  return `<i data-lucide='${name}' class='w-4 h-4 inline-block mr-1 -mt-0.5'></i>`;
}

function fmtDate(v) {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : formatDate(v);
}

function badge(sev) {
  const cls = sev === 'error' ? 'bg-red-100 text-red-800' : sev === 'warn' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800';
  const label = sev === 'error' ? 'Error' : sev === 'warn' ? 'Warning' : 'OK';
  return `<span class='inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${cls}'>${icon(SEV_ICON[sev])} ${label}</span>`;
}

function statCard(label, value, sub) {
  return `<div class='bg-gray-50 erp-card p-4'><div class='text-2xl font-bold'>${escapeHtml(value)}</div><div class='text-sm text-gray-500'>${escapeHtml(label)}</div>${sub ? `<div class='text-xs text-gray-400'>${escapeHtml(sub)}</div>` : ''}</div>`;
}

function renderStats(stats) {
  const ts = MaintenanceService.getTimestamps();
  return `
    <div class='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4'>
      ${statCard('Total Products', stats.products.toLocaleString('en-IN'), 'master catalog')}
      ${statCard('Total Customers', stats.customers.toLocaleString('en-IN'), 'active accounts')}
      ${statCard('Total Dealers', stats.dealers.toLocaleString('en-IN'), 'supply partners')}
      ${statCard('Sales Invoices', stats.sales.toLocaleString('en-IN'))}
      ${statCard('Purchase Invoices', stats.purchases.toLocaleString('en-IN'))}
      ${statCard('Expenses', stats.expenses.toLocaleString('en-IN'))}
      ${statCard('Inventory Value', formatCurrency(stats.inventoryValue), 'at buying cost')}
      ${statCard('Database Size (approx.)', (stats.dbSizeBytes / 1024).toFixed(1) + ' KB',
        Math.round(stats.dbSizeBytes / 1024) + ' of data')}
    </div>
    <div class='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
      <div class='bg-gray-50 erp-card p-4'><div class='text-sm text-gray-500'>Last Backup Date</div><div class='font-medium'>${escapeHtml(fmtDate(ts.lastBackup))}</div></div>
      <div class='bg-gray-50 erp-card p-4'><div class='text-sm text-gray-500'>Last Restore Date</div><div class='font-medium'>${escapeHtml(fmtDate(ts.lastRestore))}</div></div>
    </div>
    <p class='text-xs text-gray-500 mt-3'>Checksum (FNV-1a): <span class='font-mono'>${escapeHtml(stats.checksum)}</span> · App: ${escapeHtml(stats.app)} v${escapeHtml(stats.version)}</p>
  `;
}

function renderHealth(result) {
  const { findings, summary } = result;
  const summaryRow = `<div class='text-sm text-gray-600 mb-3'>${badge('error')} ${summary.errors} error(s) · ${badge('warn')} ${summary.warnings} warning(s) · ${badge('ok')} ${summary.ok} ok (${summary.total} total)</div>`;
  let body;
  if (!findings.length) {
    body = `<tr><td colspan='5' class='py-6 text-center text-gray-500'>${icon('check-circle')} No issues found — database looks healthy.</td></tr>`;
  } else {
    body = findings.map(f => `
      <tr class='border-b border-gray-100'>
        <td class='py-2 pr-2'>${badge(f.severity)}</td>
        <td class='py-2 pr-2 font-mono text-xs text-gray-500'>${escapeHtml(f.code)}</td>
        <td class='py-2 pr-2 text-sm'>${escapeHtml(f.collection || '')}</td>
        <td class='py-2 pr-2 text-sm text-gray-800'>${escapeHtml(f.message || '')}${f.id ? ` <span class="text-gray-500">(id: ${escapeHtml(String(f.id))})</span>` : ''}${f.field ? ` <span class="font-mono text-gray-500">[${escapeHtml(f.field)}]</span>` : ''}${f.severity === 'warn' ? ` <span class="text-amber-600 font-mono">(advisory)</span>` : ''}</td>
      </tr>`).join('');
  }
  return `
    <div class='flex items-center gap-4 mb-3'>
      <button id='health-scan' type='button' class='btn btn-primary'>${icon('search')} Run Health Scan</button>
      ${summaryRow}
    </div>
    <div class='overflow-x-auto'>
      <table class='w-full text-sm table-auto'>
        <thead class='bg-gray-100'><tr class='text-left'><th class='py-2 pr-2'>Status</th><th class='py-2 pr-2'>Code</th><th class='py-2 pr-2'>Collection</th><th class='py-2 pr-2'>Detail</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
}

function renderRepair() {
  const ops = [
    ['dedupe', 'Remove duplicate records', true],
    ['recalcTotals', 'Recalculate invoice totals', true],
    ['normalizeNumbers', 'Normalize negative / invalid numerics', false],
    ['fixReferences', 'Clear dangling references', false]
  ];
  const rows = ops.map(o => `
    <label class='flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50'>
      <input type='checkbox' name='repair-op' value='${o[0]}' class='rounded border-gray-300 text-primary' ${o[2] ? 'checked' : ''} />
      <span class='text-sm text-gray-700'>${escapeHtml(o[1])}</span>
    </label>`).join('');
  return `
    <p class='text-sm text-gray-500 mb-4'>Select repair operations, then click Repair. All changes are applied atomically (snapshot → write → rollback on failure) and can be reverted from your last backup.</p>
    <div class='grid grid-cols-1 md:grid-cols-2 gap-3 mb-4'>${rows}</div>
    <div class='flex gap-3'>
      <button id='repair-run' type='button' class='btn btn-warning'>${icon('wrench')} Run Selected Repairs</button>
      <span id='repair-result' class='text-sm text-gray-500'></span>
    </div>
  `;
}

function renderStorage(s) {
  const pct = s.percent;
  const color = pct > 85 ? 'text-red-600' : pct > 70 ? 'text-amber-600' : 'text-green-600';
  const rows = s.largestCollections.map(c => `
    <tr class='border-b border-gray-100'>
      <td class='py-1 pr-2 font-mono text-xs'>${escapeHtml(c.key)}</td>
      <td class='py-1 pr-2 text-right'>${(c.bytes / 1024).toFixed(1)} KB</td>
    </tr>`).join('');
  return `
    <div class='space-y-3'>
      <div class='flex justify-between items-end'>
        <div><div class='text-sm text-gray-500'>ERP localStorage usage</div>
          <div class='text-2xl font-bold ${color}'>${(s.usedBytes / 1024).toFixed(1)} KB / ${(s.quotaBytes / 1024 / 1024).toFixed(1)} MB</div>
        </div>
        <div class='text-right'><span class='text-3xl font-bold ${color}'>${pct}%</span>
          <div class='w-32 h-3 bg-gray-200 rounded'><div class='h-3 rounded bg-primary' style='width:${pct}%'></div></div>
        </div>
      </div>
      <div class='text-xs text-gray-500'>(ERP data: ${(s.erpBytes / 1024).toFixed(1)} KB · other app data: ${(s.otherBytes / 1024).toFixed(1)} KB)</div>
      <button id='storage-refresh' type='button' class='btn btn-ghost'>${icon('refresh-cw')} Refresh</button>
      <table class='w-full text-sm mt-2'>
        <thead class='bg-gray-100'><tr class='text-left'><th class='py-1 pr-2'>Largest collections (raw bytes)</th><th class='py-1 pr-2 text-right'>Size</th></tr></thead>
        <tbody>${rows || '<tr><td colspan=2 class="py-4 text-center text-gray-400">empty</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function renderCleanup(c) {
  const list = (c.tempCache || []).concat(c.expiredBackups || []).concat((c.orphans || []).map(o => ({ key: o.collection + '#' + o.id, bytes: 0, type: 'Orphan (' + o.productId + ')' })));
  let body;
  if (!list.length) {
    body = `<tr><td colspan='3' class='py-6 text-center text-gray-500'>${icon('check-circle')} No temporary/expired data found.</td></tr>`;
  } else {
    body = list.map(it => `
      <tr class='border-b border-gray-100'>
        <td class='py-1 pr-2 font-mono text-xs'>${escapeHtml(it.key || it.type || '')}</td>
        <td class='py-1 pr-2 text-right'>${it.bytes ? (it.bytes / 1024).toFixed(1) + ' KB' : '—'}</td>
        <td class='py-1 pr-2 text-sm'>${escapeHtml(it.type || 'Temp cache')}</td>
      </tr>`).join('');
  }
  return `
    <div class='space-y-3'>
      <label class='flex items-center gap-2'><input type='checkbox' id='cleanup-orphans' class='rounded border-gray-300 text-primary' /> <span class='text-sm'>Also remove orphan records (entries referencing missing products)</span></label>
      <div class='overflow-x-auto'>
        <table class='w-full text-sm table-auto'>
          <thead class='bg-gray-100'><tr class='text-left'><th class='py-1 pr-2'>Item</th><th class='py-1 pr-2 text-right'>Size</th><th class='py-1 pr-2'>Type</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      <div class='flex gap-3'>
        <button id='cleanup-run' type='button' class='btn btn-warning'>${icon('trash-2')} Clean Up Selected</button>
        <span id='cleanup-result' class='text-sm text-gray-500'></span>
      </div>
      <p class='text-xs text-gray-500'>Safe cleanup: removes temporary caches, expired backups and orphan records only. Business records are never deleted.</p>
    </div>
  `;
}

function renderReset() {
  return `
    <div class='bg-red-50 border border-red-200 rounded-lg p-4 space-y-4'>
      <h3 class='font-bold text-red-800 flex items-center gap-2'>${icon('alert-triangle')} Permanent Database Reset</h3>
      <p class='text-sm text-red-800'>This completely wipes ALL ERP data (products, customers, dealers, invoices, expenses, settings, daily closings, stock adjustments and every erp_* collection). This action cannot be undone. After completion the application reloads to a fresh install state.</p>
      <p class='text-sm text-red-800'>A backup is strongly recommended before resetting.</p>
      <label class='flex items-center gap-2 text-sm'><input type='checkbox' id='reset-backup-got-it' class='rounded border-red-300 text-red-600' /> <span>I have created a backup (or understand the risk)</span></label>
      <label class='flex items-center gap-2 text-sm'><input type='text' id='reset-confirmation' class='font-mono border border-red-300 rounded px-2 py-1 w-40' placeholder='Type ERASE' /> <span class='text-xs text-red-700'>Type <b>ERASE</b> to enable reset</span></label>
      <div class='flex gap-3'><button id='reset-run' type='button' class='btn bg-red-600 hover:bg-red-700 text-white' disabled>${icon('power')} Reset Database</button><span id='reset-result' class='text-sm text-gray-500'></span></div>
    </div>
  `;
}

export async function render() {
  const nav = TABS.map(t => `<button type='button' data-tab='${t[0]}' class='tab-btn px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary border-b-2 border-transparent'>${t[1]}</button>`).join('');
  const sections = TABS.map(t => `<section id='section-${t[0]}' class='tab-section hidden pb-2'><div id='content-${t[0]}' class='text-center text-gray-500 py-8'>Loading…</div></section>`).join('');
  return `
    <div class='p-6 max-w-6xl mx-auto fade-in pb-16'>
      <div class='bg-white erp-card p-6 mb-6 border-t-4 border-t-primary'>
        <h1 class='text-2xl font-bold text-text mb-1'>Production Database Maintenance Center</h1>
        <p class='text-sm text-gray-500'>Inspect, repair and maintain the offline ERP database. All operations reuse the existing BackupService / RestoreService / DataProvider and require explicit confirmation before any change.</p>
      </div>
      <nav class='flex gap-1 mb-4 border-b bg-white erp-card px-2' id='maint-nav'>${nav}</nav>
      <div class='bg-white erp-card p-6'>${sections}</div>
    </div>
  `;
}

export function onMount() {
  let state = 'stats';

  async function loadSection(id, box) {
    const set = (html) => { box.innerHTML = html; };
    box.innerHTML = '<span class=\'text-gray-400\'>Loading…</span>';
    try {
      if (id === 'stats') {
        set(renderStats(MaintenanceService.getStatistics()));
      } else if (id === 'health') {
        set(renderHealth({ findings: [], summary: { errors: 0, warnings: 0, ok: 0, total: 0 } }));
        const scan = () => set(renderHealth(MaintenanceService.healthCheck()));
        document.getElementById('health-scan').addEventListener('click', scan);
      } else if (id === 'repair') {
        set(renderRepair());
        document.getElementById('repair-run').addEventListener('click', async () => {
          const ops = {};
          document.querySelectorAll('input[name="repair-op"]:checked').forEach(cb => { ops[cb.value] = true; });
          const confirmed = await window.confirm('Apply the selected repair operations? This modifies the database atomically.');
          const out = document.getElementById('repair-result');
          if (!confirmed) { out.textContent = 'Repair cancelled.'; return; }
          out.textContent = 'Applying repairs…';
          const r = await MaintenanceService.repair(ops, true);
          out.textContent = r.ok ? `Repair applied: ${r.actions.length} operation(s).` : 'Repair failed: ' + r.reason;
        });
      } else if (id === 'storage') {
        set(renderStorage(MaintenanceService.storageUsage()));
        document.getElementById('storage-refresh').addEventListener('click', () => set(renderStorage(MaintenanceService.storageUsage())));
      } else if (id === 'cleanup') {
        const refresh = () => { set(renderCleanup(MaintenanceService.cleanupPreview())); wireCleanup(); };
        function wireCleanup() {
          document.getElementById('cleanup-run').addEventListener('click', async () => {
            const removeOrphans = document.getElementById('cleanup-orphans').checked;
            const confirmed = await window.confirm('Remove the listed temporary/expired items and/or orphans? This cannot be undone (use a backup to reverse).');
            const out = document.getElementById('cleanup-result');
            if (!confirmed) { out.textContent = 'Cleanup cancelled.'; return; }
            out.textContent = 'Cleaning…';
            const r = await MaintenanceService.cleanup({ removeOrphans }, true);
            out.textContent = r.ok ? `Cleanup complete: removed ${r.removed || 0} item(s).` : 'Cleanup failed: ' + r.reason;
            refresh();
          });
        }
        refresh();
      } else if (id === 'reset') {
        set(renderReset());
        const btn = document.getElementById('reset-run');
        const chk = document.getElementById('reset-backup-got-it');
        const input = document.getElementById('reset-confirmation');
        const out = document.getElementById('reset-result');
        const updateBtn = () => { btn.disabled = !(chk.checked && input.value === 'ERASE'); };
        chk.addEventListener('change', updateBtn);
        input.addEventListener('input', updateBtn);
        updateBtn();
        btn.addEventListener('click', async () => {
          if (!chk.checked || input.value !== 'ERASE') { out.textContent = 'Confirm via checkbox and typing ERASE.'; return; }
          const c1 = await window.confirm('FINAL WARNING: you are about to destroy ALL ERP data and reload.');
          if (!c1) { out.textContent = 'Reset cancelled.'; return; }
          const c2 = await window.confirm('Type ERASE to confirm this final dialog. All data will be lost.');
          if (!c2) { out.textContent = 'Reset cancelled.'; return; }
          out.textContent = 'Resetting database…';
          const r = await MaintenanceService.resetDatabase({ confirmed: true, confirmationText: 'ERASE' });
          out.textContent = r.ok ? `Reset complete — wiped ${r.wipedKeys} collections. Reloading…` : 'Reset failed: ' + r.reason;
        });
      }
    } catch (e) {
      set('<span class=\'text-red-600\'>Error loading section: ' + escapeHtml(e && e.message ? e.message : 'unknown') + '</span>');
    }
  }

  const showTab = (id) => {
    state = id;
    document.querySelectorAll('.tab-section').forEach(s => s.classList.add('hidden'));
    document.getElementById('section-' + id).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === id));
    const box = document.getElementById('content-' + id);
    if (box && box.dataset.loaded !== 'true') { box.dataset.loaded = 'true'; loadSection(id, box); }
  };

  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  // mark first tab active, show stats.
  const first = document.querySelector('[data-tab]');
  if (first) { first.classList.add('active', 'border-primary', 'text-primary'); first.classList.remove('border-transparent'); }
  showTab('stats');
  setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);

  return function cleanup() {};
}
