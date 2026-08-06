const { contextBridge, ipcRenderer } = require('electron');

// We expose nothing because the app is purely offline and relies entirely on standard Web APIs
// like localStorage which work perfectly in the Electron sandbox.
// If any IPC is needed in the future, it can be securely added here.
contextBridge.exposeInMainWorld('electronAPI', {
  // Empty secure bridge for future extensibility
});

// Prevent default drag and drop behavior to stop accidental navigation/file dropping
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'none';
}, false);

window.addEventListener('drop', (e) => {
  e.preventDefault();
}, false);

// Disable F5 / Ctrl+R / Ctrl+Shift+I (DevTools)
window.addEventListener('keydown', (e) => {
  if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
    e.preventDefault();
  }
  if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
    e.preventDefault();
  }
});
