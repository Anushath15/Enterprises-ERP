const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        filelist = walkSync(dir + '/' + file, filelist);
      }
    }
    else {
      if (file.endsWith('.js') && file !== 'NotificationService.js') {
        filelist.push(dir + '/' + file);
      }
    }
  });
  return filelist;
};

const allFiles = walkSync(path.join(__dirname, '../frontend'), []);

for (const file of allFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('window.showToast(') || content.includes('window.showToast (')) {
    
    // Add import if not present
    if (!content.includes('NotificationService')) {
      // Calculate relative path
      const depth = file.split('/').length - file.indexOf('/frontend/') - 2;
      let relPath = '../'.repeat(depth) + 'services/notificationService.js';
      if (depth === 0) relPath = './services/notificationService.js';
      
      const p = path.relative(path.dirname(file), path.join(__dirname, '../frontend/services/notificationService.js')).replace(/\\/g, '/');
      content = `import { NotificationService } from '${p.startsWith('.') ? p : './' + p}';\n` + content;
    }
    
    // Replace window.showToast(msg, 'success') => NotificationService.success(msg)
    // Replace window.showToast(msg, 'danger') => NotificationService.error(msg)
    // Replace window.showToast(msg, 'warning') => NotificationService.warning(msg)
    // Replace window.showToast(msg) => NotificationService.info(msg)
    
    content = content.replace(/if\s*\(\s*window\.showToast\s*\)\s*window\.showToast\(([^,]+),\s*['"]success['"]\)/g, 'NotificationService.success($1)');
    content = content.replace(/window\.showToast\(([^,]+),\s*['"]success['"]\)/g, 'NotificationService.success($1)');
    
    content = content.replace(/if\s*\(\s*window\.showToast\s*\)\s*window\.showToast\(([^,]+),\s*['"]danger['"]\)/g, 'NotificationService.error($1)');
    content = content.replace(/window\.showToast\(([^,]+),\s*['"]danger['"]\)/g, 'NotificationService.error($1)');
    
    content = content.replace(/if\s*\(\s*window\.showToast\s*\)\s*window\.showToast\(([^,]+),\s*['"]warning['"]\)/g, 'NotificationService.warning($1)');
    content = content.replace(/window\.showToast\(([^,]+),\s*['"]warning['"]\)/g, 'NotificationService.warning($1)');
    
    content = content.replace(/if\s*\(\s*window\.showToast\s*\)\s*{\s*window\.showToast\(([^,]+),\s*['"]danger['"]\);\s*}/g, 'NotificationService.error($1);');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
