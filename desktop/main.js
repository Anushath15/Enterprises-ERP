const { app, BrowserWindow, protocol, net, session, dialog, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const windowStateKeeper = require('electron-window-state');

// Remove storage quota limitations for offline data
app.commandLine.appendSwitch('unlimited-storage');

// Force single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Variables for windows
let mainWindow = null;
let splashWindow = null;
const isDev = !app.isPackaged;

// Helper to construct paths
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const BACKUP_DIR = path.join(app.getPath('documents'), 'Senthil ERP', 'Backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Global exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('Unexpected Error', 'An unexpected error occurred in the core process.\n\n' + error.message);
});

// Setup custom protocol for truly local offline loading
// This avoids CORS issues that standard file:// protocol enforces on ES modules
protocol.registerSchemesAsPrivileged([
  { scheme: 'erp', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

function rotateBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('ERP_Backup_') && f.endsWith('.json'))
      .map(f => ({ name: f, path: path.join(BACKUP_DIR, f), time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time); // Newest first

    if (files.length > 30) {
      const toDelete = files.slice(30);
      toDelete.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
      });
    }
  } catch (err) {
    console.error('Backup rotation failed:', err);
  }
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.once('ready-to-show', () => splashWindow.show());
}

function createMainWindow() {
  // Load the previous state with fallback to defaults
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1280,
    defaultHeight: 800
  });

  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 1024,
    minHeight: 768,
    show: false, // Don't show until ready
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: isDev // Disabled in production
    }
  });

  // Let windowStateKeeper manage the window size/position
  mainWindowState.manage(mainWindow);

  // Remove native menu bar for a cleaner app-like experience
  Menu.setApplicationMenu(null);

  // Load the frontend via custom protocol
  mainWindow.loadURL('erp://app/index.html');

  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    mainWindow.show();
    if (mainWindowState.isMaximized) mainWindow.maximize();
  });

  // Handle render crashes gracefully
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Render process gone:', details.reason);
    dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Application Crash',
      message: 'The application experienced an unexpected error and needs to reload.',
      detail: `Reason: ${details.reason}`,
      buttons: ['Reload Application', 'Quit']
    }).then(res => {
      if (res.response === 0) {
        mainWindow.reload();
      } else {
        app.quit();
      }
    });
  });

  // Security constraints
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' }; // Prevent arbitrary new windows
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Only allow navigation within our app schema
    if (!url.startsWith('erp://')) {
      event.preventDefault();
    }
  });
}

app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  // Handle custom protocol logic
  protocol.handle('erp', (request) => {
    const parsedUrl = new URL(request.url);
    const decodedPath = decodeURIComponent(parsedUrl.pathname);
    let filePath = path.join(FRONTEND_DIR, decodedPath.replace(/^\/app\//, ''));
    
    // Safety check to ensure we don't serve outside frontend dir
    if (!filePath.startsWith(FRONTEND_DIR)) {
      filePath = path.join(FRONTEND_DIR, 'index.html');
    }
    
    return net.fetch('file://' + filePath);
  });

  // Intercept downloads for automatic backup routing
  session.defaultSession.on('will-download', (event, item, webContents) => {
    const filename = item.getFilename();
    if (filename.startsWith('ERP_Backup_') && filename.endsWith('.json')) {
      // Set the save path silently without prompting the user
      const savePath = path.join(BACKUP_DIR, filename);
      item.setSavePath(savePath);

      item.once('done', (event, state) => {
        if (state === 'completed') {
          rotateBackups();
        }
      });
    } else {
      // It's something else (e.g. PDF export), let user choose where to save
      // Or we can just let it show the standard Save As dialog.
    }
  });

  // Disable arbitrary file execution/navigation
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(false);
  });

  ipcMain.handle('open-print-preview', async (event, html, options = {}) => {
    return new Promise((resolve, reject) => {
      try {
        const paperSize = options.paperSize || 'A4';
        let pageSize;
        if (paperSize === 'A4') {
          pageSize = 'A4';
        } else if (paperSize === '80mm') {
          pageSize = { width: 80000, height: 297000 };
        } else {
          pageSize = { width: 58000, height: 297000 }; // 58mm
        }

        // Write HTML to a temp file to avoid data: URL size limits
        const tempHtmlPath = path.join(app.getPath('temp'), `erp_print_${Date.now()}.html`);
        fs.writeFileSync(tempHtmlPath, html, 'utf8');

        const hiddenWin = new BrowserWindow({ 
          show: false, 
          webPreferences: { nodeIntegration: false, contextIsolation: true } 
        });

        hiddenWin.loadFile(tempHtmlPath);

        hiddenWin.webContents.on('did-finish-load', async () => {
          try {
            const pdfBuffer = await hiddenWin.webContents.printToPDF({
              pageSize: pageSize,
              printBackground: true,
              marginsType: 1 // No margins
            });

            hiddenWin.close();
            // Clean up the temp HTML file
            try { fs.unlinkSync(tempHtmlPath); } catch (e) {}

            const tempPdfPath = path.join(app.getPath('temp'), `erp_preview_${Date.now()}.pdf`);
            fs.writeFileSync(tempPdfPath, pdfBuffer);

            const previewWin = new BrowserWindow({
              width: 900,
              height: 800,
              title: 'Print Preview',
              icon: path.join(__dirname, 'assets', 'icon.ico'),
              webPreferences: {
                // No plugins:true — Electron 29+ has a built-in PDF viewer
                nodeIntegration: false,
                contextIsolation: true
              }
            });

            previewWin.setMenuBarVisibility(false);
            // Use loadURL with file:// for reliable cross-platform PDF loading
            previewWin.loadURL('file:///' + tempPdfPath.replace(/\\/g, '/'));
            
            // cleanup temp PDF when window is closed
            previewWin.on('closed', () => {
              try { fs.unlinkSync(tempPdfPath); } catch (e) {}
            });
            
            resolve(true);
          } catch (e) {
            console.error('PDF generation failed:', e);
            try { hiddenWin.close(); } catch (_) {}
            try { fs.unlinkSync(tempHtmlPath); } catch (_) {}
            resolve(false);
          }
        });

        hiddenWin.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
          console.error('Hidden window failed to load HTML:', errorCode, errorDesc);
          try { hiddenWin.close(); } catch (_) {}
          try { fs.unlinkSync(tempHtmlPath); } catch (_) {}
          resolve(false);
        });

      } catch (err) {
        console.error('Print preview error:', err);
        resolve(false);
      }
    });
  });

  createSplashWindow();
  
  // Give splash screen a moment to render before blocking thread with main window
  setTimeout(createMainWindow, 1500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
