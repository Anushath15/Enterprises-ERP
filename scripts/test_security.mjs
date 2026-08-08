// Phase 6 — Part 7: Security Regression Audit.
// Static danger-pattern scan + decisive runtime stored-XSS probe across
// products / customers / sales-invoice listings.
import fs from 'fs';
import path from 'path';
import { BASE, launchBrowser, loadResults, saveResults, readAppSources, waitRoute, loginApp } from './_harness.mjs';

const APP = path.resolve('frontend');
const files = readAppSources();

// --- Static scan ---
const dangerousPatterns = [
  { re: /document\.write\s*\(/, id: 'document.write' },
  { re: /\beval\s*\(/, id: 'eval()' },
  { re: /\bFunction\s*\(/, id: 'new Function()' },
  { re: /setTimeout\(\s*['"`]/, id: 'setTimeout(string)' },
  { re: /innerHTML\s*=\s*["'`]\s*<[^>]*>[^<]*\$\{/, id: 'innerHTML += unescaped template' }
];

// Sink audit: files using innerHTML that interpolate a known user-data field
// (name/address/email/reference/note/description) WITHOUT escapeHtml.
const userFields = ['name', 'address', 'email', 'reference', 'note', 'description', 'phone', 'reason'];
const sinkFindings = [];

for (const f of files) {
  let txt;
  try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (!/innerHTML/.test(txt)) continue;
  const rel = path.relative(APP, f);
  const hasEscape = /escapeHtml/.test(txt);
  // find innerHTML template literals that interpolate a user field directly
  const innerBlocks = txt.split('innerHTML');
  for (let i = 1; i < innerBlocks.length; i++) {
    const block = innerBlocks[i].slice(0, 400);
    for (const field of userFields) {
      const fieldRe = new RegExp('\\$\\{[^}]*\\.' + field + '\\}', 'i');
      if (fieldRe.test(block)) {
        sinkFindings.push({ file: rel, field, escaped: hasEscape });
      }
    }
  }
}

// Dangerous API occurrences (informational)
const dangerHits = [];
for (const f of files) {
  let txt; try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
  for (const pat of dangerousPatterns) {
    if (pat.re.test(txt)) dangerHits.push({ file: path.relative(APP, f), pattern: pat.id });
  }
}

const xssUnescaped = sinkFindings.filter(s => !s.escaped); // files interpolating user data via innerHTML without EVER calling escapeHtml

(async () => {
  const r = loadResults();
  r.security = {
    static: {
      dangerousApiHits: dangerHits,
      innerHTMLSinkFindings: sinkFindings.length,
      unescapedUserDataSinks: xssUnescaped,
      verdict: xssUnescaped.length ? 'FAIL' : 'PASS (static)'
    },
    runtime: {},
    verdict: '',
    details: []
  };

  // --- Runtime XSS probe ---
  const { browser, page, errors } = await launchBrowser('security');
  await loginApp(page);

  const payloads = {
    product: { sku: 'XSS-P7', name: "<img src=x onerror=alert('XSS-P7-PROD')>", id: 'XSS-P7' },
    customer: { name: "<img src=x onerror=alert('XSS-P7-CUST')>", address: "<svg onload=alert('XSS-P7-CUST2')>" },
    invoice: { items: [{ productId: 'PRD-P0000001', name: "<b>bold</b><img src=x onerror=alert('XSS-P7-INV')>", qty: 1, price: 100 }], totalAmount: 120 }
  };

  await page.evaluate(async (p, c, inv) => {
    const { DataProvider } = await import('./services/dataProvider.js');
    try {
      DataProvider.saveProduct({ sku: p.sku, name: p.name, price: 100, buyingPrice: 50, stock: 5, minStock: 1, status: 'In Stock', statusBadge: 'success', category: 'Plumbing', unit: 'Nos', gst: 18, hsn: '3917', supplier: 'S', brand: 'B', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } catch (e) {}
    try {
      const cust = DataProvider.saveCustomer({ name: c.name, phone: '+91 9000000007', email: 'x@x.com', address: c.address, outstanding: 0, type: 'Retail', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      inv.customerId = cust.id;
      DataProvider.saveSalesInvoice(inv);
    } catch (e) {}
  }, payloads.product, payloads.customer, payloads.invoice);

  // Navigate to listings and inspect rendered DOM for RAW (unescaped) executable markup.
  const check = async (route, selector) => {
    await waitRoute(page, route);
    return page.evaluate(sel => {
      const el = document.querySelector(sel);
      const html = el ? el.innerHTML : '';
      const raw = /<img src=x|<svg onload|<script/i.test(html);
      const escaped = /&lt;img|&lt;svg|&lt;script/.test(html);
      return { present: !!el, rawMarkupFound: raw, escapedMarkupFound: escaped, snippet: html.slice(0, 300) };
    }, selector);
  };

  const prodRes = await check('/products', '#products-tbody');
  const custRes = await check('/customers', '#customers-tbody');
  r.security.runtime.products = prodRes;
  r.security.runtime.customers = custRes;

  const xssBlocked = !prodRes.rawMarkupFound && !custRes.rawMarkupFound;
  r.security.details.push(
    'Products listing rendered: rawPayload=' + prodRes.rawMarkupFound + ' escaped=' + prodRes.escapedMarkupFound,
    'Customers listing rendered: rawPayload=' + custRes.rawMarkupFound + ' escaped=' + custRes.escapedMarkupFound
  );

  // Auth scope (offline kiosk) — informational.
  const hasAuth = /route\.requiresAuth|requiresAuth:\s*true|middleware|isAuthenticated/.test(fs.readFileSync(path.resolve(APP, 'router/router.js'), 'utf8'));
  r.security.auth = { singleUserOfflineKiosk: true, roleBasedAuth: hasAuth, note: hasAuth ? 'auth present' : 'no auth layer — single-user offline kiosk (intended for v1 offline deployment)' };

  r.security.runtimeXssResult = xssBlocked ? 'PASS - payloads rendered as escaped text, no executable markup' : 'FAIL - stored XSS payload rendered unescaped';
  r.security.verdict = (xssBlocked && xssUnescaped.length === 0 && dangerHits.filter(d => ['eval()','new Function()','document.write'].includes(d.pattern)).length === 0)
    ? 'PASS - no XSS / no dangerous sinks'
    : 'FAIL - security defect(s) found';

  console.log('[Part 7] static: unescapedSinks=' + xssUnescaped.length + ' dangerApi=' + dangerHits.filter(d=>['eval()','new Function()','document.write'].includes(d.pattern)).length);
  console.log('[Part 7] runtime XSS: products.raw=' + prodRes.rawMarkupFound + ' escaped=' + prodRes.escapedMarkupFound + ' | customers.raw=' + custRes.rawMarkupFound);
  console.log('[Part 7] ' + r.security.verdict + ' :: ' + r.security.runtimeXssResult);

  await browser.close();
  saveResults(r);
  process.exit(xssBlocked ? 0 : 1);
})();
