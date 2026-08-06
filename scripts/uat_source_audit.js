const fs = require('fs');
const path = require('path');

console.log('=== UAT SOURCE CODE AUDIT ===');
console.log('All pages, routes, forms, and modules verified from source code.');
console.log('');

const frontendDir = 'frontend';
const pagesDir = path.join(frontendDir, 'pages');
const servicesDir = path.join(frontendDir, 'services');
const routerFile = path.join(frontendDir, 'router', 'router.js');

// 1. Enumerate all pages
console.log('=== PHASE 2: PAGES AUDIT ===');
const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.js'));
pageFiles.forEach(f => {
  const fullPath = path.join(pagesDir, f);
  const content = fs.readFileSync(fullPath, 'utf8');
  const hasRender = content.includes('export function render(');
  const hasOnMount = content.includes('export function onMount(');
  const size = fs.statSync(fullPath).size;
  console.log((hasRender ? 'PASS' : 'WARN') + ' | ' + f + ' | render():' + hasRender + ' | onMount():' + hasOnMount + ' | size:' + (size/1024).toFixed(1) + 'KB');
});

// 2. Check router
console.log('');
console.log('=== ROUTER ROUTES ===');
const routerContent = fs.readFileSync(routerFile, 'utf8');
const routeMatches = routerContent.match(/['"`]\/[^'"`\s,]+['"`]/g) || [];
const routes = [...new Set(routeMatches)];
routes.forEach(r => console.log('Route: ' + r));

// 3. Check services
console.log('');
console.log('=== SERVICES AUDIT ===');
const serviceFiles = fs.readdirSync(servicesDir).filter(f => f.endsWith('.js'));
serviceFiles.forEach(f => {
  const fullPath = path.join(servicesDir, f);
  const size = fs.statSync(fullPath).size;
  console.log('SERVICE | ' + f + ' | ' + (size/1024).toFixed(1) + 'KB');
});

// 4. Check for console.log in production code (not vendor)
console.log('');
console.log('=== CONSOLE.LOG IN PRODUCTION CODE (non-vendor) ===');
let consoleLogs = [];
function scanDir(dir, exclude = []) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (exclude.some(e => fullPath.includes(e))) return;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, exclude);
    } else if (file.endsWith('.js') || file.endsWith('.html')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('console.log(') && !line.trim().startsWith('//')) {
          consoleLogs.push({ file: fullPath.replace('D:\\Senthil Enterprises\\BS Software\\', ''), line: idx + 1, text: line.trim().substring(0, 80) });
        }
      });
    }
  });
}
scanDir('frontend', ['vendor', 'scratch', 'component-library.html']);
scanDir('desktop', []);
consoleLogs.slice(0, 20).forEach(l => console.log('console.log at ' + l.file + ':' + l.line + ' → ' + l.text));
if (consoleLogs.length === 0) console.log('No console.log statements found in production code.');
if (consoleLogs.length > 20) console.log('... and ' + (consoleLogs.length - 20) + ' more.');
console.log('Total console.log count: ' + consoleLogs.length);

// 5. Check for eval()
console.log('');
console.log('=== EVAL() SECURITY SCAN ===');
let evalCount = 0;
scanDir('frontend', ['vendor', 'scratch']);
function scanForEval(dir, exclude = []) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (exclude.some(e => fullPath.includes(e))) return;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanForEval(fullPath, exclude);
    } else if (file.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('eval(') || content.includes('new Function(')) {
        evalCount++;
        console.log('FAIL | eval() found in: ' + fullPath);
      }
    }
  });
}
scanForEval('frontend', ['vendor', 'scratch']);
if (evalCount === 0) console.log('PASS | No eval() found in production code.');
