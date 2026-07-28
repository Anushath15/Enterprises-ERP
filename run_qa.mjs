import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const pagesToTest = [
  { route: '', name: 'Dashboard' },
  { route: 'pos', name: 'POS' },
  { route: 'sales', name: 'Sales' },
  { route: 'purchases', name: 'Purchases' },
  { route: 'inventory', name: 'Products' },
  { route: 'customers', name: 'Customers' },
  { route: 'dealers', name: 'Dealers' },
  { route: 'delivery', name: 'Delivery' },
  { route: 'sales-returns', name: 'Sales Return' },
  { route: 'purchase-returns', name: 'Purchase Return' },
  { route: 'expenses', name: 'Expenses' },
  { route: 'house-projects', name: 'House Projects' },
  { route: 'warranty', name: 'Warranty' },
  { route: 'reports', name: 'Reports' },
  { route: 'daily-closing', name: 'Daily Closing' },
  { route: 'credit-management', name: 'Credit Management' },
  { route: 'staff', name: 'Staff' },
  { route: 'users', name: 'Users' },
  { route: 'settings', name: 'Settings' }
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const dir = path.join(process.cwd(), 'QA_Screenshots');
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }

  let allPassed = true;
  let testResults = '# Manual QA Verification Results\n\n';

  for (const p of pagesToTest) {
    console.log(`\n--- Testing ${p.name} ---`);
    const errors = [];
    const url = `http://localhost:5500/#/${p.route}`;

    // Setup listeners
    const onPageError = err => errors.push(`PageError: ${err.message}`);
    const onConsole = msg => {
      const text = msg.text();
      const mUrl = msg.location().url || '';
      if (msg.type() === 'error' && !text.includes('favicon') && !mUrl.includes('favicon') && !text.includes('chrome-extension')) {
        errors.push(`ConsoleError: ${text} at ${mUrl}`);
      }
    };
    
    page.on('pageerror', onPageError);
    page.on('console', onConsole);

    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 1000)); // wait for Lucide to replace icons

      // Check for raw SVG tags inside the #app that don't have lucide classes
      // Lucide icons have class "lucide". Any raw SVG we missed might not have it.
      const rawSvgs = await page.$$eval('svg:not(.lucide)', els => els.length);
      const lucideIcons = await page.$$eval('svg.lucide', els => els.length);
      
      console.log(`Icons: ${lucideIcons} Lucide SVGs, ${rawSvgs} Raw SVGs.`);
      
      if (rawSvgs > 0) {
          // Some SVGs might be perfectly valid, like empty states or charts. But let's log it.
          console.log(`WARNING: Found ${rawSvgs} raw SVGs.`);
      }

      const filepath = path.join(dir, `${p.name.replace(/ /g, '_')}.png`);
      await page.screenshot({ path: filepath, fullPage: true });

      if (errors.length > 0) {
        console.error(`FAILED ${p.name}. Errors:`, errors);
        testResults += `## ${p.name} ❌ FAILED\n- **Console Errors:** ${errors.join(', ')}\n\n`;
        allPassed = false;
      } else {
        console.log(`SUCCESS ${p.name}.`);
        testResults += `## ${p.name} ✅ PASSED\n- Zero console errors.\n- Lucide icons loaded (${lucideIcons}).\n- Raw SVGs: ${rawSvgs}\n\n`;
      }
    } catch (e) {
      console.error(`Exception on ${p.name}:`, e.message);
      testResults += `## ${p.name} ❌ FAILED\n- **Exception:** ${e.message}\n\n`;
      allPassed = false;
    } finally {
      page.off('pageerror', onPageError);
      page.off('console', onConsole);
    }
  }

  fs.writeFileSync('TEST_RESULTS.md', testResults);
  console.log('\nTesting Complete. See TEST_RESULTS.md');
  await browser.close();
  
  if (!allPassed) {
      process.exit(1);
  }
})();
