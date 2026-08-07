import puppeteer from 'puppeteer';
const BASE = 'http://localhost:3000';
const login = () => {
  localStorage.setItem('auth_token', JSON.stringify('offline-probe-token'));
  localStorage.setItem('auth_user', JSON.stringify({id:'USR-000001', username:'admin', name:'Administrator', role:'admin', isActive:true}));
  localStorage.setItem('auth_expires_at', JSON.stringify(Date.now() + 7*24*3600000));
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const pageErrors = [];
  const consoleAll = [];
  page.on('pageerror', e => pageErrors.push({msg: e.message, stack: e.stack}));
  page.on('console', e => consoleAll.push(e.type() + ': ' + e.text()));

  await page.goto(BASE + '/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(login);
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  for (const route of ['/pos', '/database-maintenance', '/products', '/inventory']) {
    pageErrors.length = 0; consoleAll.length = 0;
    await page.evaluate(r => { window.location.hash = r; }, route);
    try { await page.waitForFunction(h => window.location.hash.includes(h), {timeout:4000}, route); } catch(e){}
    await new Promise(r => setTimeout(r, 700));
    const body = await page.evaluate(() => document.body.innerText || '');
    const failel = await page.evaluate(() => document.querySelector('.text-danger')?.innerText || document.body.innerText.match(/Failed to load page/i) ? document.querySelector('h2')?.innerText || '' : '');
    console.log('=== ' + route + ' (hash=' + (await page.evaluate(()=>window.location.hash)) + ') ===');
    console.log('bodyLen=' + body.length);
    console.log('bodyText=\n' + body.slice(0,300));
    console.log('pageErrors=' + JSON.stringify(pageErrors.map(e=>({msg:e.msg, stack:(e.stack||'').split('\n').slice(0,4).join(' | ')}))));
    console.log('console=' + JSON.stringify(consoleAll));
    console.log('');
  }
  await browser.close();
})();
