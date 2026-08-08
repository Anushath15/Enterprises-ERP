const fs = require('fs');
const { Script } = require('vm');
const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') filelist = walkSync(dir + '/' + file, filelist);
    } else if (file.endsWith('.js')) {
      filelist.push(dir + '/' + file);
    }
  });
  return filelist;
};

const files = walkSync('./frontend');
let errors = 0;
files.forEach(f => {
  let code = fs.readFileSync(f, 'utf8');
  // strip imports
  code = code.replace(/import\s+[\s\S]*?from\s+['\"].*?['\"];?/g, '');
  code = code.replace(/export\s+/g, '');
  try {
    new Script(code);
  } catch (e) {
    if (e.message.includes('import') || e.message.includes('export')) return;
    console.log(f + ': ' + e.message);
    errors++;
  }
});
if (errors === 0) console.log('All frontend files passed syntax check.');
