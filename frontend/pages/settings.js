/**
 * Senthil Enterprises ERP - Production Settings Page
 *
 * Hosts six configuration sections, all persisted to the single `erp_settings`
 * object via settingsService:
 *   1. Business Information
 *   2. Invoice Settings
 *   3. Inventory Settings
 *   4. Backup Settings
 *   5. Appearance
 *   6. About
 *
 * No inline JavaScript: all listeners are attached in onMount() and torn down
 * via the returned cleanup function. All dynamic text is escaped.
 */

import { escapeHtml } from '../utils/escapeHtml.js';
import {
  SETTINGS_DEFAULTS,
  validateField,
  ROUND_OFF_OPTIONS,
  THEME_OPTIONS,
  FONT_SIZE_OPTIONS
} from '../utils/settingsSchema.js';
import { formatCurrency, formatDate } from '../utils/exportUtils.js';
import { settingsService } from '../services/settingsService.js';
import { BackupService } from '../services/backupService.js';
import { RestoreService } from '../services/restoreService.js';
import { NotificationService } from '../services/notificationService.js';

const NOTIFICATION = NotificationService;

function renderSectionBusiness(settings) {
  return `
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Business Information</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${textInput('Shop Name', 'shopName', settings.shopName, { required: true })}
        ${textInput('Tagline', 'tagline', settings.tagline)}
        ${textInput('Owner Name', 'ownerName', settings.ownerName, { required: true })}
        ${textInput('GSTIN', 'gstin', settings.gstin)}
        ${textInput('Phone', 'phone', settings.phone, { required: true })}
        ${textInput('Email', 'email', settings.email)}
        ${textInput('Address', 'address', settings.address, { full: true, required: true })}
      </div>
    </section>
  `;
}

function renderSectionInvoice(settings) {
  return `
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Invoice Settings</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${textInput('Invoice Prefix', 'invoicePrefix', settings.invoicePrefix)}
        ${textInput('Invoice Number Format', 'invoiceNumberFormat', settings.invoiceNumberFormat)}
        ${selectInput('Default Tax Type', 'defaultTaxType', settings.defaultTaxType, [
          { value: 'Exclusive', label: 'Exclusive (before tax)' },
          { value: 'Inclusive', label: 'Inclusive (after tax)' }
        ])}
        ${textInput('Default GST Rate (%)', 'defaultGst', settings.defaultGst)}
        ${selectInput('Round Off Method', 'roundOffMethod', settings.roundOffMethod, ROUND_OFF_OPTIONS)}
        ${toggleInput('Auto Invoice Numbering', 'autoInvoiceNumbering', settings.autoInvoiceNumbering)}
        ${toggleInput('Show Logo on Invoice', 'showLogoOnInvoice', settings.showLogoOnInvoice)}
      </div>
      ${textareaInput('Footer Message', 'footerMessage', settings.footerMessage)}
      ${textareaInput('Terms & Conditions', 'terms', settings.terms, { tall: true })}
    </section>
  `;
}

function renderSectionInventory(settings) {
  return `
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Inventory Settings</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${textInput('Low Stock Threshold', 'lowStockThreshold', settings.lowStockThreshold)}
        ${selectInput('Default Unit', 'defaultUnit', settings.defaultUnit, [
          { value: 'Nos', label: 'Nos (units)' },
          { value: 'Kg', label: 'Kg' },
          { value: 'Litre', label: 'Litre' },
          { value: 'Box', label: 'Box' },
          { value: 'Pack', label: 'Pack' }
        ])}
        ${selectInput('Stock Warning Color', 'stockWarningColor', settings.stockWarningColor, [
          { value: 'amber', label: 'Amber' },
          { value: 'red', label: 'Red' },
          { value: 'orange', label: 'Orange' }
        ])}
        ${toggleInput('Allow Negative Stock', 'allowNegativeStock', settings.allowNegativeStock)}
        ${toggleInput('Auto Update Stock on Sales', 'autoUpdateStock', settings.autoUpdateStock)}
      </div>
    </section>
  `;
}

function renderSectionBackup(settings) {
  const status = settingsService.getBackupStatus();
  const lastManual = status.lastManualBackup
    ? formatDate(new Date(status.lastManualBackup))
    : 'Never';
  const lastAuto = status.lastAutoBackup
    ? formatDate(new Date(status.lastAutoBackup))
    : 'Never';

  return `
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Backup Settings</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${selectInput('Backup Frequency', 'backupFrequency', settings.backupFrequency, [
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
          { value: 'monthly', label: 'Monthly' }
        ])}
        ${toggleInput('Auto Backup Enabled', 'autoBackupEnabled', settings.autoBackupEnabled)}
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div class="p-3 bg-muted rounded">
          <span class="text-xs text-muted">Last manual backup</span>
          <div class="font-medium">${escapeHtml(lastManual)}</div>
        </div>
        <div class="p-3 bg-muted rounded">
          <span class="text-xs text-muted">Last automatic backup</span>
          <div class="font-medium">${escapeHtml(lastAuto)}</div>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 pt-2">
        <button type="button" id="btn-create-backup" class="btn btn-primary">
          Create Backup Now
        </button>
        <button type="button" id="btn-restore-backup" class="btn btn-secondary">
          Restore Backup…
        </button>
        <button type="button" id="btn-export-center" class="btn btn-outline">
          Open Export Center
        </button>
        <button type="button" id="btn-db-maintenance" class="btn btn-outline">
          Database Maintenance
        </button>
      </div>
    </section>
  `;
}

function renderSectionAppearance(settings) {
  return `
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">Appearance</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${selectInput('Theme', 'theme', settings.theme, THEME_OPTIONS)}
        ${selectInput('Font Size', 'fontSize', settings.fontSize, FONT_SIZE_OPTIONS)}
        ${toggleInput('Compact Mode', 'compactMode', settings.compactMode)}
        ${toggleInput('Collapse Sidebar by Default', 'sidebarCollapsed', settings.sidebarCollapsed)}
      </div>
      <div class="text-xs text-muted">
        Theme and font size apply immediately and persist across sessions.
      </div>
    </section>
  `;
}

function renderSectionAbout() {
  const info = settingsService.getAppInfo();
  const settings = settingsService.load();

  return `
    <section class="space-y-4">
      <h2 class="text-lg font-semibold">About</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="p-4 bg-muted rounded">
          <span class="text-xs text-muted">Application</span>
          <div class="font-medium">${escapeHtml(info.appName)}</div>
        </div>
        <div class="p-4 bg-muted rounded">
          <span class="text-xs text-muted">Version</span>
          <div class="font-medium">v${escapeHtml(info.appVersion)}</div>
        </div>
        <div class="p-4 bg-muted rounded">
          <span class="text-xs text-muted">Database Version</span>
          <div class="font-medium">${escapeHtml(info.dbVersion)}</div>
        </div>
        <div class="p-4 bg-muted rounded">
          <span class="text-xs text-muted">Build Date</span>
          <div class="font-medium">${escapeHtml(info.buildDate)}</div>
        </div>
        <div class="p-4 bg-muted rounded md:col-span-2">
          <span class="text-xs text-muted">Currency</span>
          <div class="font-medium">${escapeHtml(settings.currencySymbol)} ${escapeHtml(settings.currency)}</div>
        </div>
      </div>
      <div class="text-xs text-muted">
        Senthil Enterprises ERP is released under the MIT License.
      </div>
    </section>
  `;
}

function textInput(label, field, value, opts) {
  opts = opts || {};
  return `
    <div class="md:col-span-2">
      <label class="block text-sm font-medium mb-1" for="field-${field}">${escapeHtml(label)}${opts.required ? ' <span class="text-danger">*</span>' : ''}</label>
      <input id="field-${field}" data-field="${field}" type="${opts.type || 'text'}"
        class="input w-full" value="${escapeHtml(value === undefined ? '' : value)}"
        ${opts.required ? 'required' : ''}/>
      <div id="err-${field}" class="text-danger text-xs mt-1 hidden"></div>
    </div>
  `;
}

function selectInput(label, field, value, options) {
  const rendered = (options || []).map((opt) => {
    const selected = String(opt.value) === String(value) ? ' selected' : '';
    return `<option value="${escapeHtml(opt.value)}"${selected}>${escapeHtml(opt.label)}</option>`;
  }).join('');
  return `
    <div>
      <label class="block text-sm font-medium mb-1" for="field-${field}">${escapeHtml(label)}</label>
      <select id="field-${field}" data-field="${field}" class="input w-full">
        ${rendered}
      </select>
      <div id="err-${field}" class="text-danger text-xs mt-1 hidden"></div>
    </div>
  `;
}

function toggleInput(label, field, checked) {
  const isChecked = checked ? ' checked' : '';
  return `
    <div class="flex items-center gap-3 pt-6">
      <input id="field-${field}" data-field="${field}" type="checkbox" class="toggle" ${isChecked}/>
      <label class="text-sm font-medium" for="field-${field}">${escapeHtml(label)}</label>
    </div>
  `;
}

function textareaInput(label, field, value, opts) {
  opts = opts || {};
  return `
    <div class="md:col-span-2">
      <label class="block text-sm font-medium mb-1" for="field-${field}">${escapeHtml(label)}</label>
      <textarea id="field-${field}" data-field="${field}"
        class="input w-full" rows="${opts.tall ? '4' : '2'}">${escapeHtml(value === undefined ? '' : value)}</textarea>
      <div id="err-${field}" class="text-danger text-xs mt-1 hidden"></div>
    </div>
  `;
}

export function render() {
  const settings = settingsService.load();
  return `
    <div id="settings-page" class="max-w-4xl mx-auto py-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Settings</h1>
      </div>

      <form id="settings-form" novalidate class="space-y-8">
        ${renderSectionBusiness(settings)}
        ${renderSectionInvoice(settings)}
        ${renderSectionInventory(settings)}
        ${renderSectionBackup(settings)}
        ${renderSectionAppearance(settings)}
        ${renderSectionAbout()}
      </form>

      <div class="mt-8 flex justify-end gap-3">
        <button type="button" id="btn-reset-settings" class="btn btn-outline">Reset to Defaults</button>
        <button type="submit" form="settings-form" id="btn-save-settings" class="btn btn-primary">
          Save Settings
        </button>
      </div>
    </div>
  `;
}

function readForm(rootElement) {
  const form = rootElement.querySelector('#settings-form');
  const changed = {};
  const inputs = form.querySelectorAll('input[data-field], select[data-field], textarea[data-field]');
  inputs.forEach((el) => {
    const field = el.getAttribute('data-field');
    let val;
    if (el.type === 'checkbox') {
      val = el.checked;
    } else if (el.type === 'number' || ['defaultGst', 'lowStockThreshold'].indexOf(field) !== -1) {
      val = el.value === '' ? '' : parseFloat(el.value);
    } else {
      val = el.value;
    }
    changed[field] = val;
  });
  return changed;
}

function setFieldError(rootElement, field, message) {
  const el = rootElement.querySelector(`#err-${field}`);
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
    el.textContent = '';
  }
}

function clearAllErrors(rootElement) {
  rootElement.querySelectorAll('[id^="err-"]').forEach((el) => {
    el.classList.add('hidden');
    el.textContent = '';
  });
}

function showValidationErrors(rootElement, errors) {
  clearAllErrors(rootElement);
  Object.keys(errors).forEach((field) => {
    setFieldError(rootElement, field, errors[field]);
  });
}

export function onMount(rootElement) {
  const __listeners = [];
  const _origAddEventListener = rootElement.addEventListener;
  rootElement.addEventListener = function(type, listener, options) {
    __listeners.push({ target: rootElement, type, listener, options });
    _origAddEventListener.call(rootElement, type, listener, options);
  };
  const _origWindowAdd = window.addEventListener;
  const _origDocAdd = document.addEventListener;
  const trackedWindowDoc = [];
  window.addEventListener = function(type, listener, options) {
     trackedWindowDoc.push({ target: window, type, listener, options });
     _origWindowAdd.call(window, type, listener, options);
  };
  document.addEventListener = function(type, listener, options) {
     trackedWindowDoc.push({ target: document, type, listener, options });
     _origDocAdd.call(document, type, listener, options);
  };
  
  const form = rootElement.querySelector('#settings-form');

  const handleSave = (event) => {
    event.preventDefault();
    clearAllErrors(rootElement);
    const changed = readForm(rootElement);
    const result = settingsService.save(changed);
    if (result.ok) {
      NOTIFICATION.success('Settings saved successfully');
    } else {
      showValidationErrors(rootElement, result.errors);
      NOTIFICATION.error('Please fix the highlighted settings errors');
    }
  };

  const handleReset = () => {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
    const defaults = SETTINGS_DEFAULTS;
    Object.keys(defaults).forEach((field) => {
      const el = rootElement.querySelector(`#field-${field}`);
      if (!el) return;
      if (el.type === 'checkbox') {
        el.checked = !!defaults[field];
      } else {
        el.value = defaults[field] === undefined ? '' : defaults[field];
      }
    });
    clearAllErrors(rootElement);
    NOTIFICATION.info('Settings reset to defaults (not yet saved)');
  };

  const handleBackup = () => {
    NOTIFICATION.info('Creating backup...');
    BackupService.createManualBackup();
  };

  const handleRestore = () => {
    RestoreService.initiateRestore();
  };

  const handleExportCenter = () => {
    window.location.hash = '/export-center';
  };

  const handleDbMaintenance = () => {
    window.location.hash = '/database-maintenance';
  };

  const handleLiveValidate = (event) => {
    const el = event.target;
    const field = el.getAttribute('data-field');
    if (!field) return;
    const error = validateField(field, el.value);
    setFieldError(rootElement, field, error || '');
  };

  form.addEventListener('submit', handleSave);
  rootElement.querySelector('#btn-reset-settings').addEventListener('click', handleReset);
  rootElement.querySelector('#btn-create-backup').addEventListener('click', handleBackup);
  rootElement.querySelector('#btn-restore-backup').addEventListener('click', handleRestore);
  rootElement.querySelector('#btn-export-center').addEventListener('click', handleExportCenter);
  rootElement.querySelector('#btn-db-maintenance').addEventListener('click', handleDbMaintenance);

  rootElement.querySelectorAll('input[data-field], select[data-field], textarea[data-field]').forEach((el) => {
    el.addEventListener('blur', handleLiveValidate);
  });

  const currentTheme = settingsService.load().theme;
  settingsService.applyTheme(currentTheme);

  return function cleanup() {
    __listeners.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    trackedWindowDoc.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    window.addEventListener = _origWindowAdd;
    document.addEventListener = _origDocAdd;

    form.removeEventListener('submit', handleSave);
    rootElement.querySelector('#btn-reset-settings').removeEventListener('click', handleReset);
    rootElement.querySelector('#btn-create-backup').removeEventListener('click', handleBackup);
    rootElement.querySelector('#btn-restore-backup').removeEventListener('click', handleRestore);
    rootElement.querySelector('#btn-export-center').removeEventListener('click', handleExportCenter);
    rootElement.querySelector('#btn-db-maintenance').removeEventListener('click', handleDbMaintenance);
    rootElement.querySelectorAll('input[data-field], select[data-field], textarea[data-field]').forEach((el) => {
      el.removeEventListener('blur', handleLiveValidate);
    });
  };
}
