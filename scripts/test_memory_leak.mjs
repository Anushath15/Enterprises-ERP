import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--js-flags="--expose-gc"']
  });
  const page = await browser.newPage();
  
  // Navigate to local server
  await page.goto('http://127.0.0.1:5173/index.html#/login');
  
  // inject token
  await page.evaluate(() => {
    localStorage.setItem('erp_auth_token', JSON.stringify({
      username: 'admin',
      role: 'admin',
      name: 'Admin User'
    }));
  });
  
  await page.goto('http://127.0.0.1:5173/index.html#/');
  await new Promise(r => setTimeout(r, 2000));
  
  const getHeap = async () => {
    const metrics = await page.metrics();
    return metrics.JSHeapUsedSize / 1024 / 1024; // MB
  };
  
  // Initial Heap
  const initialHeap = await getHeap();
  console.log(`Initial Heap: ${initialHeap.toFixed(2)} MB`);
  
  const routes = ['#/', '#/pos', '#/sales', '#/purchases', '#/inventory', '#/customers'];
  
  // Perform 30 route transitions
  console.log("Navigating between routes 30 times...");
  for (let i = 0; i < 30; i++) {
    const route = routes[i % routes.length];
    await page.goto(`http://127.0.0.1:5173/index.html${route}`);
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Give it a moment, force GC if possible
  await new Promise(r => setTimeout(r, 2000));
  const finalHeap = await getHeap();
  console.log(`Final Heap: ${finalHeap.toFixed(2)} MB`);
  
  const growth = finalHeap - initialHeap;
  console.log(`Growth: ${growth.toFixed(2)} MB`);
  
  if (growth < 5) {
    console.log('Result: PASS - No significant memory leak detected.');
  } else {
    console.log('Result: FAIL - Significant heap growth detected.');
  }
  
  await browser.close();
})();
