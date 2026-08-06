import puppeteer from 'puppeteer-core';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  console.log('=== Chaos Monkey - Phase 3: State Resilience ===');
  console.log('Navigating to Live Firebase...');
  await page.goto('https://myapplication-2adb30a9.web.app/', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#page-root', { timeout: 15000 });
  
  console.log('1. Creating a dummy product...');
  await page.evaluate(() => { window.location.hash = '#/products'; });
  await delay(2000);
  await page.waitForSelector('#btn-add-product', { timeout: 10000 });
  await page.click('#btn-add-product');
  await page.waitForSelector('#p-name', { timeout: 5000 });
  await page.type('#p-name', 'State Test Product');
  await page.type('#p-sku', 'STATE-123');
  await page.type('#p-price', '150');
  await page.type('#p-stock', '100');
  await page.evaluate(() => document.getElementById('save-p-btn').click());
  await delay(2000);

  console.log('2. Navigating to POS...');
  await page.evaluate(() => { window.location.hash = '#/pos'; });
  await delay(2000);
  await page.waitForSelector('#pos-search-input', { timeout: 10000 });
  
  console.log('3. Adding items to cart...');
  // Search for the product we just created
  await page.type('#pos-search-input', 'STATE-123');
  await delay(1000);
  
  // Click first product card
  await page.evaluate(() => {
    const card = document.querySelector('.pos-product');
    if(card) card.click();
  });
  await delay(1000);
  
  // Verify cart has 1 item
  const cartLengthBefore = await page.evaluate(() => {
    return document.querySelectorAll('#cart-container .cart-item').length;
  });
  console.log(`Cart items before reload: ${cartLengthBefore}`);
  if (cartLengthBefore === 0) {
    throw new Error('Failed to add item to cart!');
  }
  
  console.log('4. Simulating page reload (F5)...');
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('#page-root', { timeout: 15000 });
  // Make sure we are back in POS
  await page.evaluate(() => { window.location.hash = '#/pos'; });
  await delay(2000);
  await page.waitForSelector('#cart-container', { timeout: 10000 });
  
  console.log('5. Verifying cart state after reload...');
  const cartLengthAfter = await page.evaluate(() => {
    return document.querySelectorAll('#cart-container .cart-item').length;
  });
  console.log(`Cart items after reload: ${cartLengthAfter}`);
  
  if (cartLengthAfter === 0) {
    console.log('❌ FAIL: Cart state was lost on page reload!');
  } else {
    console.log('✅ PASS: Cart state persisted successfully!');
  }
  
  // Clean up cart
  console.log('6. Clearing cart...');
  await page.evaluate(() => {
     const clearBtn = document.getElementById('btn-clear-cart');
     if(clearBtn) clearBtn.click();
  });
  await delay(1000);

  console.log('=== RESULTS ===');
  console.log('State Resilience check complete.');

  await browser.close();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
