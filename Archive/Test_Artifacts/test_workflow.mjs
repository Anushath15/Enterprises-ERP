import puppeteer from 'puppeteer';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8080/';
const TEST_NAME = 'Chaos Monkey - Phase 1: Full Business Workflow';

(async () => {
  console.log(`\n=== ${TEST_NAME} ===`);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Track errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`Console: ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`PageError: ${err.message}`));
  
  try {
    console.log('Navigating to BASE...');
    await page.setCacheEnabled(false);
    await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 120000 });
    
    // Wait for the Dashboard to render
    await page.waitForSelector('#page-root', { timeout: 60000 });

    console.log('1. Creating Product...');
    await page.evaluate(() => { window.location.hash = '#/products'; });
    await page.waitForSelector('#btn-add-product', { timeout: 10000 });
    await page.click('#btn-add-product');
    
    await page.waitForSelector('#p-name', { timeout: 5000 });
    // Fill out form
    await page.type('#p-name', 'Test Hammer 500g');
    await page.type('#p-sku', 'HAM-500');
    await page.type('#p-barcode', '8901234567890');
    await page.type('#p-price', '250');
    await page.type('#p-stock', '50');
    // Wait for drawer animation to finish
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => document.getElementById('save-p-btn').click());
    
    // Wait for save to complete
    await page.waitForFunction(() => {
      const productInDB = JSON.parse(localStorage.getItem('erp_products') || '[]');
      return productInDB.find(p => p.sku === 'HAM-500');
    }, { timeout: 10000 });
    console.log('Product saved.');
    
    console.log('2. Creating Customer...');
    await page.evaluate(() => { window.location.hash = '#/customers'; });
    await page.waitForSelector('#btn-add-new-customer', { timeout: 10000 });
    await page.click('#btn-add-new-customer');
    
    await page.waitForSelector('#c-name', { timeout: 5000 });
    await page.type('#c-name', 'Ramesh Builder');
    await page.type('#c-phone', '9876543210');
    // Wait for drawer animation to finish
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => document.getElementById('save-c-btn').click());
    
    // Wait for save to complete
    await page.waitForFunction(() => {
      const modal = document.getElementById('customer-modal-overlay');
      const drawer = document.getElementById('customer-drawer');
      // Just wait for toast
      const toast = document.querySelector('.toast-success');
      return (drawer && drawer.classList.contains('translate-x-full')) || toast;
    }, { timeout: 10000 });
    console.log('Customer saved.');

    console.log('3. Selling Product in POS...');
    await page.evaluate(() => { window.location.hash = '#/pos'; });
    await page.waitForSelector('#pos-search-input', { timeout: 10000 });
    // Wait for POS Mount completion
    await new Promise(r => setTimeout(r, 1000));
    await page.type('#pos-search-input', 'HAM-500');
    await new Promise(r => setTimeout(r, 300));
    
    // We need to click the search result
    await page.waitForSelector('.pos-product', { timeout: 5000 });
    await page.click('.pos-product');


    // Select payment mode
    await page.click('button[data-mode="Cash"]');
    
    // Confirm checkout
    await page.click('#btn-save-invoice');
    console.log('Checkout completed.');
    await new Promise(r => setTimeout(r, 2000));

    console.log('4. Verifying Stock in Products...');
    await page.evaluate(() => { window.location.hash = '#/products'; });
    await page.waitForSelector('#product-search', { timeout: 10000 });
    
    await page.type('#product-search', 'HAM-500');
    await new Promise(r => setTimeout(r, 1000)); // wait for debounce
    
    await page.waitForSelector('#products-tbody tr', { timeout: 10000 });
    
    const stock = await page.evaluate(() => {
      // Find row with HAM-500
      const rows = Array.from(document.querySelectorAll('#products-tbody tr'));
      const hammerRow = rows.find(r => r.innerText.includes('HAM-500'));
      return hammerRow ? hammerRow.innerText : null;
    });
    console.log('Product row in DB: ', stock);
    if (stock && stock.includes('49')) {
      console.log('Stock correctly deducted! (50 -> 49)');
    } else {
      errors.push('Stock deduction failed or product not found: ' + stock);
    }
    
  } catch (err) {
    errors.push(`Test Exception: ${err.message}`);
  } finally {
    await browser.close();
  }

  console.log(`\n=== RESULTS ===`);
  if (errors.length > 0) {
    console.log(`❌ FAILED with ${errors.length} errors:`);
    errors.forEach(e => console.log(`- ${e}`));
    process.exit(1);
  } else {
    console.log('✅ PASSED Workflow Test successfully.');
  }
})();
