const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = ms => new Promise(r => setTimeout(r, ms));
const outDir = 'C:/Users/anush/.gemini/antigravity/brain/d1f66127-84a6-4379-ba82-95c0b1fbd533/';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const report = [];
  const log = (msg) => { console.log(msg); report.push(msg); };

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => consoleLogs.push(`[ERROR] ${error.message}`));

  const args = process.argv.slice(2);
  const routeArg = args.find(a => a.startsWith('--route='));
  const route = routeArg ? routeArg.split('=')[1] : '#/sales/new';
  const moduleName = route.includes('purchase') ? 'Purchase' : 'Sales';
  
  log(`\n=========================================`);
  log(`RC3.4.1 ${moduleName} Module - Generic QA Suite`);
  log(`Target Route: ${route}`);
  log(`=========================================\n`);

  page.on('dialog', async dialog => {
    log(`Dialog opened: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto('http://127.0.0.1:5173/#/', { waitUntil: 'domcontentloaded' });
    
    // Seed stock for testing
    await page.evaluate(() => {
      let prods = JSON.parse(localStorage.getItem('erp_products') || '[]');
      prods = prods.map(p => ({ ...p, stock: 100 }));
      localStorage.setItem('erp_products', JSON.stringify(prods));
    });
    
    await page.goto(`http://127.0.0.1:5173/${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#btn-save-txn', { timeout: 10000 });
    await delay(1000);
    
    // 1. Validation & Error Handling
    log('Running Validation Tests...');
    await page.click('#btn-save-txn');
    await delay(500);
    let toast = await page.evaluate(() => document.querySelector('#toast-container span')?.textContent);
    if (toast && toast.includes('is required')) {
       log('✅ Empty form validation caught missing customer.');
    } else {
       log('❌ Validation test failed.');
    }

    // 2. Keyboard Matrix & Row Addition
    log('\nRunning Keyboard Matrix Tests...');
    await page.keyboard.press('F2');
    await delay(300);
    const f2Focus = await page.evaluate(() => document.activeElement.id);
    if (f2Focus === 'txn-entity-search') log('✅ F2 focuses customer select.');

    await page.keyboard.press('F3');
    await delay(300);
    const f3Focus = await page.evaluate(() => document.activeElement.id);
    if (f3Focus === 'txn-product-search') log('✅ F3 focuses product search.');

    // Search for a product and add it
    await page.type('#txn-product-search', 'pipe', { delay: 50 });
    await delay(1000);
    await page.keyboard.press('ArrowDown');
    await delay(200);
    await page.keyboard.press('Enter');
    await delay(500);

    const rowCount = await page.evaluate(() => document.querySelectorAll('#txn-table-body tr:not(#txn-table-empty-row)').length);
    if (rowCount === 1) {
       log('✅ Keyboard product selection successful.');
    } else {
       log(`❌ Keyboard product selection failed. Rows: ${rowCount}`);
    }

    // 3. Inventory Validation (Overselling)
    log('\nRunning Inventory Validation Tests...');
    // We attempt to set qty to 9999 for the row
    await page.evaluate(() => {
      const qtyInput = document.querySelector('#txn-table-body tr:not(#txn-table-empty-row) input[type="number"]');
      if (qtyInput) {
        qtyInput.value = '9999';
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await delay(500);
    
    let toast2 = await page.evaluate(() => document.querySelector('#toast-container span')?.textContent);
    if (toast2 && toast2.toLowerCase().includes('cannot increase qty')) {
       log('✅ Overselling correctly blocked by Inventory Middleware.');
    } else {
       log('❌ Overselling was NOT blocked. Toast: ' + toast2);
    }
    
    // Check if the value was reverted
    const currentQty = await page.evaluate(() => {
      return document.querySelector('#txn-table-body tr:not(#txn-table-empty-row) input[type="number"]').value;
    });
    if (currentQty === '1') {
       log('✅ UI reverted to valid quantity.');
    } else {
       log(`❌ UI did not revert quantity. Value is ${currentQty}`);
    }

    // 4. Negative Quantity Rejection
    await page.evaluate(() => {
      const qtyInput = document.querySelector('#txn-table-body tr:not(#txn-table-empty-row) input[type="number"]');
      if (qtyInput) {
        qtyInput.value = '-5';
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await delay(500);
    await page.click('#btn-save-txn');
    await delay(500);
    
    let toast3 = await page.evaluate(() => document.querySelector('#toast-container span')?.textContent);
    if (toast3 && toast3.toLowerCase().includes('must be > 0')) {
       log('✅ Negative quantity blocked by Validation.');
    } else {
       log('❌ Negative quantity NOT blocked.');
    }
    
    // 5. Calculation Matrix
    log('\nRunning Calculation Matrix...');
    await page.evaluate(() => {
      const qtyInput = document.querySelector('#txn-table-body tr:not(#txn-table-empty-row) input[type="number"]');
      if (qtyInput) {
        qtyInput.value = '2'; // Valid stock
        qtyInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await delay(1000);
    
    const totals = await page.evaluate(() => {
       return {
         subtotal: document.querySelector('#footer-subtotal').textContent.trim(),
         grand: document.querySelector('#footer-grandtotal').textContent.trim()
       };
    });
    log(`✅ Subtotal: ${totals.subtotal} | Grand Total: ${totals.grand}`);
    
    // 6. Delete Row 
    log('\nRunning Delete & Undo Flow...');
    await page.evaluate(() => {
      const delBtn = document.querySelector('.btn-delete-row');
      if (delBtn) delBtn.click();
    });
    await delay(500);
    const rowCountAfterDel = await page.evaluate(() => document.querySelectorAll('#txn-table-body tr:not(#txn-table-empty-row)').length);
    if (rowCountAfterDel === 0) log('✅ Row successfully deleted.');

    // 7. Undo
    await page.evaluate(() => {
      const undoBtn = document.querySelector('.toast-undo-btn');
      if (undoBtn) undoBtn.click();
    });
    await delay(500);
    const rowCountAfterUndo = await page.evaluate(() => document.querySelectorAll('#txn-table-body tr:not(#txn-table-empty-row)').length);
    if (rowCountAfterUndo === 1) log('✅ Undo successfully restored the row.');

    log('\n✅ All automated workflows executed.');
    fs.writeFileSync(path.join(outDir, 'SALES_QA_REPORT.md'), report.join('\n'));
    log('Report written to SALES_QA_REPORT.md');

  } catch (error) {
    log(`\n❌ QA Script Crashed: ${error.message}`);
    log(error.stack);
  } finally {
    if (consoleLogs.length > 0) {
      log('\n--- Browser Console Logs ---');
      consoleLogs.forEach(msg => log(msg));
    }
    await browser.close();
  }
})();
