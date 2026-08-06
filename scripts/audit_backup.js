const fs = require('fs');
const path = require('path');

// Verify backup interception design comprehensively
console.log('=== BACKUP ROUTING DESIGN VERIFICATION ===');
const mainJs = fs.readFileSync('desktop/main.js', 'utf8');

// Parse out backup dir path logic
const backupDirLine = mainJs.match(/const BACKUP_DIR = .+/);
console.log('Backup DIR definition: ' + (backupDirLine ? backupDirLine[0].trim() : 'NOT FOUND'));

// Verify the actual backup path structure
const hasDocuments = mainJs.includes("app.getPath('documents')");
const hasSenthilERP = mainJs.includes("'Senthil ERP', 'Backups'");
console.log((hasDocuments ? 'PASS' : 'FAIL') + ' | Uses app.getPath("documents") - resolves to user\'s My Documents');
console.log((hasSenthilERP ? 'PASS' : 'FAIL') + ' | Subdirectory path: Senthil ERP/Backups');

// Verify mkdirSync at startup
const hasMkdir = mainJs.includes('mkdirSync(BACKUP_DIR, { recursive: true }');
console.log((hasMkdir ? 'PASS' : 'FAIL') + ' | Backup directory auto-created at startup (recursive:true)');

// Verify intercept happens on download events
const hasWillDownload = mainJs.includes("session.defaultSession.on('will-download'");
const hasFilenameCheck = mainJs.includes("startsWith('ERP_Backup_')") && mainJs.includes("endsWith('.json')");
const hasSavePath = mainJs.includes('item.setSavePath(savePath)');
console.log((hasWillDownload ? 'PASS' : 'FAIL') + ' | Downloads intercepted via will-download event on defaultSession');
console.log((hasFilenameCheck ? 'PASS' : 'FAIL') + ' | Only ERP_Backup_*.json files are silently routed');
console.log((hasSavePath ? 'PASS' : 'FAIL') + ' | item.setSavePath() - no "Save As" dialog shown to user');

// Verify rotation
const rotationFn = mainJs.includes('function rotateBackups');
const rotateSlice = mainJs.includes('.slice(30)');
const rotateUnlink = mainJs.includes('fs.unlinkSync');
console.log((rotationFn ? 'PASS' : 'FAIL') + ' | rotateBackups() function defined');
console.log((rotateSlice ? 'PASS' : 'FAIL') + ' | Rotation: files.slice(30) keeps only 30 newest');
console.log((rotateUnlink ? 'PASS' : 'FAIL') + ' | Old backups deleted with fs.unlinkSync');

// Verify pre-restore auto-backup in restoreService
console.log('');
console.log('=== PRE-DESTRUCTIVE BACKUP GUARD ===');
const restoreJs = fs.readFileSync('frontend/services/restoreService.js', 'utf8');
const hasPreRestoreBackup = restoreJs.includes('Creating safety backup before restore');
const hasImportBackup = restoreJs.includes("import('./backupService.js')");
console.log((hasPreRestoreBackup ? 'PASS' : 'FAIL') + ' | Safety backup message injected before restore');
console.log((hasImportBackup ? 'PASS' : 'FAIL') + ' | BackupService dynamically imported before destructive restore');

console.log('');
console.log('Backup system verification complete.');
