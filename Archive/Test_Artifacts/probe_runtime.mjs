import puppeteer from 'puppeteer';
const BASE = 'http://localhost:3000';

const ROUTES = [
  '/customers', '/stock-adjustments', '/house-projects', '/export-center',
  '/dealers', '/settings', '/reports', '/daily-closing', '/pos',
  '/sales', '/sales/new', '/purchases', '/purchases/new', '/credit-management',
  '/expenses', '/delivery', '/staff', '/users', '/products', '/categories',
  '/warranty', '/notifications', '/profile', '/about', '/help'
];

const login = () => {
  localStorage.setItem('auth_token', JSON.stringify('offline-probe-token'));
  localStorage.setItem('auth_user', JSON.stringify({id:'USR-000001', username:'admin', name:'Administrator', role:'admin', isActive:true}));
  localStorage.setItem('auth_expires_at', JSON.stringify(Date.now() + 7*24*3600000));
};

function classify(text) {
  const low = text.toLowerCase();
  if (low.includes('rootelement is not defined') || low.includes('failed to load page')) return 'ROOT_ELEMENT_ERROR';
  if (low.includes('404 page not found') || low.includes('page not found')) return 'NOT_FOUND';
  if (low.includes('cannot read') && low.includes('of undefined')) return 'UNDEFINED_READ';
  if (low.includes('is not a function')) return 'NOT_A_FUNCTION';
  return 'CLEAN';
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const pageErrors = []; const consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', e => { if (e.type()==='error') consoleErrors.push(e.text()); });

  await page.goto(BASE + '/#/', { waitUntil: 'networkidle0' });
  await page.evaluate(login);
  await page.goto(BASE + '/#/', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 700));

  let startErr = pageErrors.length; let startCon = consoleErrors.length;
  const perRoute = [];
  for (const route of ROUTES) {
    const errBefore = pageErrors.length; const conBefore = consoleErrors.length;
    await page.evaluate(r => { window.location.hash = r; }, route);
    try { await page.waitForFunction(h => window.location.hash.includes(h), {timeout:5000}, route); } catch(e){}
    await new Promise(r => setTimeout(r, 600));
    const bodyText = await page.evaluate(() => document.body.innerText || '');
    const newErrs = pageErrors.slice(errBefore);
    const newCons = consoleErrors.slice(conBefore);
    perRoute.push({
      route,
      hash: await page.evaluate(() => window.location.hash),
      bodyLen: bodyText.length,
      classification: classify(bodyText),
      hasRootElementErr: bodyText.toLowerCase().includes('rootelement is not defined'),
      hasFailedLoad: bodyText.toLowerCase().includes('failed to load page'),
      has404: bodyText.toLowerCase().includes('404 page not found'),
      pageErrorCount: newErrs.length,
      pageErrors: newErrs,
      consoleErrorCount: newCons.length,
      consoleErrors: newCons.slice(0,6)
    });
  }
  console.log(JSON.stringify({ perRoute, totalPageErrors: pageErrors.length, totalConsoleErrors: consoleErrors.length }, null, 2));
  await browser.close();
})();
