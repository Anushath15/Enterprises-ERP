import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new'
  });
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:5173/index.html#/login');
  
  // Inject listener counter hook BEFORE any routing happens
  await page.evaluateOnNewDocument(() => {
    window.__openCustomerDrawerListeners = 0;
    const origAdd = window.addEventListener;
    const origRemove = window.removeEventListener;
    
    window.addEventListener = function(type, listener, options) {
      if (type === 'openCustomerDrawer') window.__openCustomerDrawerListeners++;
      return origAdd.apply(window, arguments);
    };
    window.removeEventListener = function(type, listener, options) {
      if (type === 'openCustomerDrawer') window.__openCustomerDrawerListeners--;
      return origRemove.apply(window, arguments);
    };
  });
  
  await page.evaluate(() => {
    localStorage.setItem('erp_auth_token', JSON.stringify({
      username: 'admin',
      role: 'admin',
      name: 'Admin User'
    }));
  });
  
  console.log("Navigating to customers page multiple times...");
  for (let i = 0; i < 10; i++) {
    await page.goto('http://127.0.0.1:5173/index.html#/customers');
    await new Promise(r => setTimeout(r, 200));
    await page.goto('http://127.0.0.1:5173/index.html#/dealers');
    await new Promise(r => setTimeout(r, 200));
  }
  
  await page.goto('http://127.0.0.1:5173/index.html#/customers');
  await new Promise(r => setTimeout(r, 1000));
  
  const count = await page.evaluate(() => window.__openCustomerDrawerListeners);
  
  if (count === 1) {
    console.log(`PASS - Exactly ${count} listener registered for openCustomerDrawer. Cleanup is working.`);
  } else {
    console.log(`FAIL - ${count} listeners registered for openCustomerDrawer (Expected 1). Duplicate listeners present!`);
  }
  
  await browser.close();
})();
