const fs = require('fs');
const path = require('path');

const mainJs = fs.readFileSync('desktop/main.js','utf8');
const preloadJs = fs.readFileSync('desktop/preload.js','utf8');

const mainChecks = [
  { item: 'Single instance lock (requestSingleInstanceLock)', pass: mainJs.includes('requestSingleInstanceLock') },
  { item: 'second-instance handler (bring to front)', pass: mainJs.includes('second-instance') },
  { item: 'Splash screen window created', pass: mainJs.includes('createSplashWindow') },
  { item: 'Window state persistence (electron-window-state)', pass: mainJs.includes('windowStateKeeper') },
  { item: 'contextIsolation: true', pass: mainJs.includes('contextIsolation: true') },
  { item: 'nodeIntegration: false', pass: mainJs.includes('nodeIntegration: false') },
  { item: 'sandbox: true', pass: mainJs.includes('sandbox: true') },
  { item: 'devTools: isDev (disabled in production)', pass: mainJs.includes('devTools: isDev') },
  { item: 'Menu.setApplicationMenu(null) - no native menu', pass: mainJs.includes('setApplicationMenu(null)') },
  { item: "Custom protocol erp:// registered", pass: mainJs.includes("scheme: 'erp'") },
  { item: 'will-download backup intercept', pass: mainJs.includes('will-download') },
  { item: 'Backup route to Documents/Senthil ERP/Backups', pass: mainJs.includes('Senthil ERP') && mainJs.includes('Backups') },
  { item: 'Backup rotation (keep latest 30)', pass: mainJs.includes('> 30') },
  { item: 'render-process-gone crash handler', pass: mainJs.includes('render-process-gone') },
  { item: 'uncaughtException handler', pass: mainJs.includes('uncaughtException') },
  { item: 'Navigation blocked for non-erp:// urls', pass: mainJs.includes('will-navigate') && mainJs.includes('erp://') },
  { item: 'setWindowOpenHandler deny', pass: mainJs.includes('setWindowOpenHandler') && mainJs.includes('deny') },
  { item: 'setPermissionRequestHandler', pass: mainJs.includes('setPermissionRequestHandler') },
  { item: 'Path traversal guard', pass: mainJs.includes('startsWith(FRONTEND_DIR)') },
  { item: 'Min window size 1024x768', pass: mainJs.includes('minWidth: 1024') && mainJs.includes('minHeight: 768') },
  { item: 'Backup dir auto-created', pass: mainJs.includes('mkdirSync') && mainJs.includes('BACKUP_DIR') },
  { item: 'setSavePath silently for backups', pass: mainJs.includes('setSavePath') },
  { item: 'rotateBackups called on done', pass: mainJs.includes('rotateBackups()') },
];

const preloadChecks = [
  { item: 'contextBridge used', pass: preloadJs.includes('contextBridge') },
  { item: 'F5 refresh blocked', pass: preloadJs.includes('F5') },
  { item: 'Ctrl+R blocked', pass: preloadJs.includes("e.key === 'r'") },
  { item: 'DevTools shortcut blocked (Ctrl+Shift+I)', pass: preloadJs.includes("key === 'I'") },
  { item: 'Drag-drop navigation blocked', pass: preloadJs.includes('dragover') && preloadJs.includes('drop') },
];

console.log('=== MAIN.JS AUDIT ===');
let mainFails = 0;
mainChecks.forEach(c => { if(!c.pass) mainFails++; console.log((c.pass ? 'PASS' : 'FAIL') + ' | ' + c.item); });

console.log('');
console.log('=== PRELOAD.JS AUDIT ===');
let preloadFails = 0;
preloadChecks.forEach(c => { if(!c.pass) preloadFails++; console.log((c.pass ? 'PASS' : 'FAIL') + ' | ' + c.item); });

console.log('');
console.log('main.js fails: ' + mainFails + '/' + mainChecks.length);
console.log('preload.js fails: ' + preloadFails + '/' + preloadChecks.length);
