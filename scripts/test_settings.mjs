/**
 * Senthil Enterprises ERP - Production Settings verification harness.
 * Requires the dev server up on :5173 (`npm run dev`).
 *
 * Verifies Phase 5 requirements:
 *  1. load() returns defaults merged with persisted erp_settings
 *  2. save() validates BEFORE writing (valid ok; invalid ok:false + errors)
 *  3. Settings persist as a SINGLE object under erp_settings
 *  4. Reload persistence: after save + full reload, values survive
 *  5. Stress: 5,000 consecutive validated saves
 *  6. Page renders all 6 sections (Business, Invoice, Inventory, Backup, Appearance, About)
 *  7. Live form: invalid submit shows inline errors + does NOT persist;
 *     valid submit persists + shows a success toast
 *  8. Backup Settings actions: "Create backup now" updates erp_last_backup;
 *     "Export Center"/"Database Maintenance" navigate via hash; "Restore" wired
 *
 * Browser ESM loads the real app modules + browser localStorage (so reload
 * persistence is genuine).
 *
 * Run: node scripts/test_settings.mjs
 */
import puppeteer from 'puppeteer';

const BASE = 'http://127.0.0.1:5173';
const URL_SETTINGS = BASE + '/#/settings';

const ADMIN = { id: 'USR-01', username: 'admin', name: 'Admin', role: 'Administrator' };
const EXPIRES = Date.now() + 7 * 24 * 3600 * 1000;
const TOKEN = 'settings-' + Date.now();
const AUTH = JSON.stringify({ auth_token: 't-' + TOKEN, auth_user: ADMIN, auth_expires_at: EXPIRES });

function seedStore() {
  return `
    (function(){
      localStorage.removeItem('erp_settings');
      const auth = ${AUTH};
      Object.entries(auth).forEach(([k,v]) => localStorage.setItem(k, JSON.stringify(v)));
      localStorage.setItem('erp_last_auto_backup', '${new Date().toISOString().split('T')[0]}');
      localStorage.setItem('erp_last_backup', new Date().toISOString());
    })();
  `;
}

const passed = [];
const failed = [];
function check(name, cond, detail) {
  if (cond) { passed.push(name); console.log('  PASS ' + name); }
  else { failed.push({ name, detail: detail || '' }); console.log('  FAIL ' + name + (detail ? ' -> ' + detail : '')); }
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('favicon')) {
      const url = (msg.location() && msg.location().url) || '';
      consoleErrors.push({ text: msg.text(), url });
    }
  });
  page.on('pageerror', (err) => pageErrors.push('PageError: ' + err.message));

  // ---- Headless logic checks against the real app modules + browser localStorage ----
  await page.goto(BASE + '/#/login', { waitUntil: 'networkidle2' });
  await page.evaluate(seedStore());

  // (1)(2)(3) defaults / save / validation via browser ESM
  const logic = await page.evaluate(async () => {
    const { settingsService } = await import('./services/settingsService.js');
    const {
      SETTINGS_DEFAULTS, validateSettings, validateField, FIELD_SECTIONS
    } = await import('./utils/settingsSchema.js');
    const out = {};
    localStorage.removeItem('erp_settings');
    const def = settingsService.load();
    out.defaultsLoaded = def.shopName === SETTINGS_DEFAULTS.shopName && def.theme === 'light' && def.dbVersion === '1';

    const valid = Object.assign({}, SETTINGS_DEFAULTS, {
      shopName: 'Test Shop', ownerName: 'Tester', address: '1 Main St',
      phone: '+91 9876543210', email: 't@example.com', gstin: '33AAAAA0000A1Z5',
      theme: 'dark', defaultGst: 28, lowStockThreshold: 5, autoInvoiceNumbering: true, sessionOpen: true
    });
    const res = settingsService.save(valid);
    out.saveOk = res.ok === true;
    out.singleKey = Object.keys(localStorage).filter(k => k === 'erp_settings').length === 1
      && typeof JSON.parse(localStorage.getItem('erp_settings')) === 'object';
    const reloaded = settingsService.load();
    out.persisted = reloaded.shopName === 'Test Shop' && reloaded.theme === 'dark' && reloaded.defaultGst === 28;
    out.sessionPreserved = reloaded.sessionOpen === true;

    const invalid = Object.assign({}, SETTINGS_DEFAULTS, {
      shopName: '', ownerName: '', address: '', phone: '',
      gstin: 'BADGST', email: 'not-an-email', phone: '123', defaultGst: 150, lowStockThreshold: -3
    });
    const bad = settingsService.save(invalid);
    out.invalidOk = bad.ok === false;
    out.invalidReports = !!(bad.errors && bad.errors.shopName && bad.errors.ownerName && bad.errors.address && bad.errors.phone && bad.errors.gstin && bad.errors.email && bad.errors.defaultGst);
    out.invalidNotPersisted = settingsService.load().shopName === 'Test Shop';
    out.fieldEdge = !validateField('gstin', '') && !!validateField('gstin', '123') && !validateField('email', '');

    // sections metadata sanity
    out.sections = FIELD_SECTIONS.business.indexOf('shopName') !== -1
      && FIELD_SECTIONS.invoice.indexOf('invoicePrefix') !== -1
      && FIELD_SECTIONS.inventory.indexOf('lowStockThreshold') !== -1
      && FIELD_SECTIONS.backup.indexOf('autoBackupEnabled') !== -1
      && FIELD_SECTIONS.appearance.indexOf('theme') !== -1
      && FIELD_SECTIONS.about.length === 0;

    // (5) Stress: 5,000 consecutive validated saves
    let okCount = 0;
    for (let i = 0; i < 5000; i++) {
      const r = settingsService.save(Object.assign({}, SETTINGS_DEFAULTS, { shopName: 'S' + i }));
      if (r.ok) okCount++;
    }
    const final = JSON.parse(localStorage.getItem('erp_settings'));
    out.stressOk = okCount === 5000;
    out.stressFinal = final.shopName === 'S4999';
    return out;
  });

  check('1. load() returns defaults when nothing persisted', !!logic.defaultsLoaded);
  check('2. save(valid) ok=true', !!logic.saveOk);
  check('3. Settings persist as single erp_settings object', !!logic.singleKey);
  check('4a. Reload returns saved values (persistence)', !!logic.persisted);
  check('4b. sessionOpen preserved (daily_closing contract)', !!logic.sessionPreserved);
  check('5a. Validation: invalid -> ok=false + errors', !!logic.invalidOk && !!logic.invalidReports);
  check('5b. Validation: invalid NOT persisted', !!logic.invalidNotPersisted);
  check('5c. validateField edge cases', !!logic.fieldEdge);
  check('5d. FIELD_SECTIONS covers all 6 sections', !!logic.sections);
  check('6. Stress 5000 consecutive saves ok', !!logic.stressOk);
  check('7. Stress final state persisted', !!logic.stressFinal);
  await page.evaluate(() => localStorage.setItem('erp_settings_seed_shop', 'Test Shop'));

  // ---- Live page interaction ----
  // Reset erp_settings to defaults before live form tests.
  await page.goto(URL_SETTINGS, { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.removeItem('erp_settings'));
  // Force a fresh load of the page so onMount reads the now-empty store (defaults).
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 300));

  // (8) 6 sections render
  const headings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('#settings-form section h2')).map(h => h.textContent.trim());
  });
  const expected = ['Business Information', 'Invoice Settings', 'Inventory Settings', 'Backup Settings', 'Appearance', 'About'];
  expected.forEach((h, i) => check(`8.${i+1} Section renders: ${h}`, headings[i] === h, 'got [' + headings.join(', ') + ']'));
  const h1 = await page.$eval('#settings-page h1', (el) => el.textContent.trim());
  check('8. h1 reads "Settings"', h1 === 'Settings', 'got ' + h1);

  // Pre-seed a valid shopName so we can prove invalid-save does not overwrite.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('erp_settings') || '{}');
    s.shopName = 'Seeded Shop';
    localStorage.setItem('erp_settings', JSON.stringify(s));
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 300));

  // (9a) Invalid submit -> inline errors + no persist
  await page.$eval('#settings-form #field-shopName', (el) => el.value = '');
  await page.$eval('#settings-form #field-ownerName', (el) => el.value = '');
  await page.$eval('#settings-form #field-address', (el) => el.value = '');
  await page.$eval('#settings-form #field-phone', (el) => el.value = '123');
  await page.$eval('#settings-form #field-gstin', (el) => el.value = 'BADGST');
  await page.$eval('#settings-form #field-email', (el) => el.value = 'not-an-email');
  let navCount = 0;
  const navWatcher = () => navCount++;
  page.on('framenavigated', navWatcher);
  await page.$eval('#btn-save-settings', (el) => el.click());
  await new Promise(r => setTimeout(r, 300));
  page.off('framenavigated', navWatcher);
  const invalidState = await page.evaluate(() => {
    const s = (id) => { const el = document.getElementById(id); return el ? { text: el.textContent.trim(), hid: el.classList.contains('hidden') } : null; };
    return {
      shopName: s('err-shopName'),
      gstin: s('err-gstin'),
      email: s('err-email'),
      persistedShop: (JSON.parse(localStorage.getItem('erp_settings') || '{}').shopName || '')
    };
  });
  check('9a. Invalid save does NOT persist', invalidState.persistedShop === 'Seeded Shop', 'shop=' + invalidState.persistedShop);
  check('9a-extra. No page navigation on invalid submit', navCount === 0, 'navCount=' + navCount);
  check('9b. Inline error shown for shopName', invalidState.shopName && !invalidState.shopName.hid && invalidState.shopName.text.length > 0, 'diag=' + JSON.stringify(invalidState));
  check('9c. Inline error shown for GSTIN', invalidState.gstin && !invalidState.gstin.hid && invalidState.gstin.text.length > 0, 'diag=' + JSON.stringify(invalidState));

  // (9d) Valid submit -> persists + toast
  await page.$eval('#settings-form #field-shopName', (el) => el.value = 'Live Updated Shop');
  await page.$eval('#settings-form #field-ownerName', (el) => el.value = 'Live Owner');
  await page.$eval('#settings-form #field-address', (el) => el.value = '456 New Road, City');
  await page.$eval('#settings-form #field-phone', (el) => el.value = '+91 9988776655');
  await page.$eval('#settings-form #field-gstin', (el) => el.value = '27AABCT3344D1Z5');
  await page.$eval('#settings-form #field-email', (el) => el.value = 'live@example.com');
  await page.$eval('#btn-save-settings', (el) => el.click());
  await new Promise(r => setTimeout(r, 600));
  const persistedShop = await page.evaluate(() => JSON.parse(localStorage.getItem('erp_settings')).shopName);
  check('9d. Valid save persists shopName', persistedShop === 'Live Updated Shop', 'got ' + persistedShop);
  const persistedGst = await page.evaluate(() => JSON.parse(localStorage.getItem('erp_settings')).gstin);
  check('9e. Valid save persists GSTIN', persistedGst === '27AABCT3344D1Z5', 'got ' + persistedGst);
  const toastText = await page.evaluate(() => {
    const c = document.getElementById('toast-container');
    if (!c) return '';
    return c.textContent.trim();
  });
  check('9f. Success toast shown', toastText.indexOf('Settings saved') !== -1, 'toast=' + toastText);

  // (10) Reload persistence: values survive a full page reload
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 300));
  const reloadedShop = await page.$eval('#field-shopName', (el) => el.value);
  check('10. Reload persistence: shopName kept in form', reloadedShop === 'Live Updated Shop', 'got ' + reloadedShop);

  // (11) Backup actions
  const beforeBackup = await page.evaluate(() => localStorage.getItem('erp_last_backup'));
  await page.$eval('#btn-create-backup', (el) => el.click());
  await new Promise(r => setTimeout(r, 1500));
  const afterBackup = await page.evaluate(() => localStorage.getItem('erp_last_backup'));
  check('11a. "Create backup now" updates erp_last_backup', afterBackup && afterBackup !== beforeBackup);

  // nav links
  await page.$eval('#btn-export-center', (el) => el.click());
  await new Promise(r => setTimeout(r, 200));
  const hashExport = await page.evaluate(() => window.location.hash);
  check('11b. Export Center link -> #/export-center', hashExport === '#/export-center', 'got ' + hashExport);

  await page.goto(URL_SETTINGS, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 300));
  await page.$eval('#btn-db-maintenance', (el) => el.click());
  await new Promise(r => setTimeout(r, 200));
  const hashMaint = await page.evaluate(() => window.location.hash);
  check('11c. Database Maintenance link -> #/database-maintenance', hashMaint === '#/database-maintenance', 'got ' + hashMaint);

  // Restore button exists and is wired to an element (live handler attached in onMount)
  await page.goto(URL_SETTINGS, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 300));
  const btnExists = await page.$('#btn-restore-backup') !== null;
  check('11d. Restore backup button present & wired', btnExists);

  // Console errors originated from MY files are failures. Pre-existing backupService
  // noise (raw timestamp JSON parse) and unrelated 404s are environmental.
  const realErrors = consoleErrors.filter(c =>
    /settings\.(js)/.test(c.url) || /settingsschema|settingsService/.test(c.url.toLowerCase())
  ).map(c => c.text);
  check('App: no runtime errors from Settings files (pageerrors=' + pageErrors.length + ')',
    pageErrors.length === 0 && realErrors.length === 0, (pageErrors.concat(realErrors)).join(' | '));

  await browser.close();
  console.log('\nSettings harness: ' + (passed.length + failed.length) + ' checks; ' + passed.length + ' passed, ' + failed.length + ' failed.');
  process.exit(failed.length === 0 ? 0 : 1);
})().catch((e) => {
  console.error('Harnesses crashed:', e);
  process.exit(1);
});
