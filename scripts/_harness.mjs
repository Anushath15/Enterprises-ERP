// Shared helpers for Phase 6 harnesses (v7+).
// Assumes scripts/_static_server.cjs is running on :5173.
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

export const BASE = 'http://127.0.0.1:5173';
export const RESULTS = path.resolve('scripts', 'phase6_results.json');

// Stable, post-auth routes (login/onboarding excluded).
export const MAIN_ROUTES = [
  '/', '/pos', '/sales', '/inventory', '/products', '/categories',
  '/stock-adjustments', '/customers', '/purchases', '/purchases/new',
  '/sales/new', '/dealers', '/sales-returns', '/purchase-returns',
  '/credit-management', '/daily-closing', '/expenses', '/delivery',
  '/reports', '/staff', '/house-projects', '/warranty', '/users',
  '/settings', '/export-center', '/database-maintenance', '/profile',
  '/about', '/help'
];

export const loadResults = () => { try { return JSON.parse(fs.readFileSync(RESULTS, 'utf8')); } catch { return {}; } };
export const saveResults = (r) => fs.writeFileSync(RESULTS, JSON.stringify(r, null, 2));
export const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Seed a valid offline session (admin/admin123 are the documented defaults) so the
// UI auth gate does not redirect to /#/login during navigation-based checks.
export const loginApp = async (page) => {
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const token = 'offline-test-session-' + Date.now();
    const user = { id: 'USR-000001', username: 'admin', name: 'Administrator', role: 'admin' };
    // Use the app's own LocalStorageService so tokens are JSON-stringified the same
    // way authService.login() stores them (raw setItem on a bare token would make
    // LocalStorageService.get -> JSON.parse throw -> auth_token null -> gate redirect).
    localStorage.setItem('auth_token', JSON.stringify(token));
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('auth_expires_at', JSON.stringify(Date.now() + 7 * 24 * 3600000));
    window.location.hash = '#/';
  });
  // Full reload so the auth gate sees the session and the dashboard settles
  // (lazy-loaded modules + network idle) before any further evaluate().
  await page.reload({ waitUntil: 'networkidle0' });
  await sleep(400);
};

export async function launchBrowser(label = 'harness') {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-precise-memory-info',
      '--js-flags=--expose-gc'
    ],
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Phase6 ' + label + ')');
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url() + ' :: ' + (r.failure() && r.failure().errorText)));
  return { browser, page, errors };
}

// Force GC + read Chrome heap stats + DOM node count from the page.
export const heap = async (page) => await page.evaluate(() => {
  try { if (window.gc) window.gc(); } catch (e) {}
  const m = window.performance && window.performance.memory;
  return {
    used: m ? m.usedJSHeapSize : 0,
    total: m ? m.totalJSHeapSize : 0,
    limit: m ? m.jsHeapSizeLimit : 0,
    nodes: document.querySelectorAll('*').length
  };
});

// Recursively read app source files (frontend + index.html), exclude node_modules.
const APP_ROOT = path.resolve('frontend');
export function readAppSources() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p); }
      else if (/\.(js|html|mjs)$/.test(e.name)) { out.push(p); }
    }
  };
  walk(APP_ROOT);
  out.push(path.resolve('frontend/index.html'));
  return out;
}

// Robust waits that work for both full reloads and SPA hash navigation.
export const waitReady = async (page) => {
  try { await page.waitForFunction(() => document.readyState === 'complete', { timeout: 15000 }); } catch (e) { console.log('  [warn] waitReady timeout'); }
  await sleep(300);
};

export const waitRoute = async (page, route) => {
  await page.evaluate(r => { window.location.hash = r; }, route);
  try { await page.waitForFunction(r => window.location.hash.includes(r), { timeout: 10000 }, route); } catch (e) {}
  await sleep(500);
};

// Emulate offline via CDP (page.setOffline is not available in this Puppeteer build).
export const setOffline = async (page, on) => {
  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: on,
    latency: 0,
    downloadThroughput: on ? 0 : -1,
    uploadThroughput: on ? 0 : -1,
    connectionType: on ? 'none' : 'cellular3g'
  });
};

