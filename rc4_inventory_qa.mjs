import puppeteer from 'puppeteer-core';

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function run() {
  console.log('Starting RC4 Inventory QA (Live Firebase)...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  
  // Go to live app
  await page.goto('https://myapplication-2adb30a9.web.app/#/products', { waitUntil: 'networkidle2' });
  await page.waitForSelector('#page-root', { timeout: 15000 });
  
  console.log('Navigated to Products page.');
  
  const testCases = [
    { desc: "Tamil Name", data: { name: "சுத்தியல்", sku: "TML-001", price: "500", stock: "10" } },
    { desc: "Emoji Name", data: { name: "Hammer 🔨", sku: "EMJ-001", price: "300", stock: "5" } },
    { desc: "Huge Stock", data: { name: "Screws", sku: "SCW-001", price: "2", stock: "999999999" } },
    { desc: "Negative Stock", data: { name: "Ghost Item", sku: "GST-001", price: "100", stock: "-50" } },
    { desc: "Decimal Quantity", data: { name: "Wire (Meters)", sku: "WR-001", price: "10", stock: "5.5" } },
    { desc: "Duplicate Barcode (1st)", data: { name: "Item A", sku: "DUP-123", price: "10", stock: "10" } },
    { desc: "Duplicate Barcode (2nd)", data: { name: "Item B", sku: "DUP-123", price: "20", stock: "20" } },
    { desc: "Special Characters", data: { name: "<script>alert(1)</script>", sku: "XSS-001", price: "0", stock: "0" } }
  ];
  
  for (const tc of testCases) {
    console.log(`\nTesting: ${tc.desc}`);
    
    // Click Add Product
    await page.evaluate(() => {
      const btn = document.getElementById('btn-add-product');
      if(btn) btn.click();
    });
    await delay(1000);
    
    // Fill Form
    await page.type('#p-name', tc.data.name);
    await page.type('#p-sku', tc.data.sku);
    await page.type('#p-price', tc.data.price);
    
    // Clear stock field first
    await page.evaluate(() => document.getElementById('p-stock').value = '');
    await page.type('#p-stock', tc.data.stock);
    
    // Save
    await page.evaluate(() => document.getElementById('save-p-btn').click());
    await delay(1500); // wait for save and toast
    
    // Check if error toast appeared or modal is still open
    const isModalOpen = await page.evaluate(() => {
       const modal = document.getElementById('product-modal');
       return modal && !modal.classList.contains('hidden');
    });
    
    if (isModalOpen) {
       console.log(`[BUG] Could not save ${tc.desc}. Modal stayed open. (Expected if validation blocked it, Bug if silently failed)`);
       // Force close modal so next test can run
       await page.evaluate(() => {
         const cancelBtn = document.getElementById('cancel-p-btn');
         if(cancelBtn) cancelBtn.click();
       });
       await delay(500);
    } else {
       console.log(`[PASS] Saved ${tc.desc}.`);
    }
  }

  // Retrieve data directly to see what actually saved
  const finalProducts = await page.evaluate(() => {
     return JSON.parse(localStorage.getItem('erp_products')) || [];
  });
  
  console.log('\n--- FINAL SAVED PRODUCTS IN DB ---');
  finalProducts.slice(-8).forEach(p => console.log(`${p.sku} | ${p.name} | Stock: ${p.stock}`));

  await browser.close();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
