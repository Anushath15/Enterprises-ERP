import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new'
  });
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:5173/index.html#/login');
  await page.evaluate(() => {
    localStorage.setItem('erp_auth_token', JSON.stringify({
      username: 'admin',
      role: 'admin',
      name: 'Admin User'
    }));
  });
  
  console.log("Navigating between routes 10 times to simulate user activity...");
  for (let i = 0; i < 10; i++) {
    await page.goto('http://127.0.0.1:5173/index.html#/customers');
    await new Promise(r => setTimeout(r, 200));
    await page.goto('http://127.0.0.1:5173/index.html#/dealers');
    await new Promise(r => setTimeout(r, 200));
  }
  
  await page.goto('http://127.0.0.1:5173/index.html#/customers');
  await new Promise(r => setTimeout(r, 1000));
  
  // Intercept the drawer open function inside the application context
  await page.evaluate(() => {
    window.__drawerOpenedCount = 0;
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        if (m.type === 'attributes' && m.attributeName === 'class' && m.target.id === 'customer-drawer') {
           if (m.target.classList.contains('translate-x-0')) {
             window.__drawerOpenedCount++;
           }
        }
      });
    });
    const drawer = document.getElementById('customer-drawer');
    if (drawer) observer.observe(drawer, { attributes: true });
  });
  
  console.log("Dispatching openCustomerDrawer event...");
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('openCustomerDrawer'));
  });
  await new Promise(r => setTimeout(r, 1000));
  
  const count = await page.evaluate(() => window.__drawerOpenedCount);
  
  if (count === 1) {
    console.log(`PASS - Drawer opened exactly ${count} time.`);
  } else {
    console.log(`FAIL - Drawer opened ${count} times (Expected 1). Duplicate listeners present!`);
  }
  
  await browser.close();
})();
