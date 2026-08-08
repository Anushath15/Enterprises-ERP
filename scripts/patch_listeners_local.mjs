import fs from 'fs';
import path from 'path';

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p, callback);
    else if (p.endsWith('.js')) callback(p);
  }
}

let patched = 0;
walk('./frontend/pages', (p) => {
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes('__listeners') || content.includes('trackedWindowDoc')) {
    return; // Already patched
  }

  // Find onMount
  const onMountRegex = /export\s+function\s+onMount\s*\([^)]*\)\s*\{/g;
  const match = onMountRegex.exec(content);
  if (!match) return;

  const insertIndex = match.index + match[0].length;
  
  let newContent = content.slice(0, insertIndex) + `
  const __listeners = [];
  const _origAddEventListener = rootElement.addEventListener;
  rootElement.addEventListener = function(type, listener, options) {
    __listeners.push({ target: rootElement, type, listener, options });
    _origAddEventListener.call(rootElement, type, listener, options);
  };
  const _origWindowAdd = window.addEventListener;
  const _origDocAdd = document.addEventListener;
  const trackedWindowDoc = [];
  window.addEventListener = function(type, listener, options) {
     trackedWindowDoc.push({ target: window, type, listener, options });
     _origWindowAdd.call(window, type, listener, options);
  };
  document.addEventListener = function(type, listener, options) {
     trackedWindowDoc.push({ target: document, type, listener, options });
     _origDocAdd.call(document, type, listener, options);
  };
  ` + content.slice(insertIndex);

  // Now find the return function cleanup() { ... } or return () => { ... }
  const cleanupRegex = /return\s+(?:function\s*cleanup\s*\(\)\s*\{|\(\)\s*=>\s*\{)/g;
  const match2 = cleanupRegex.exec(newContent);
  if (match2) {
      const insertIndex2 = match2.index + match2[0].length;
      newContent = newContent.slice(0, insertIndex2) + `
    __listeners.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    trackedWindowDoc.forEach(({target, type, listener, options}) => {
      target.removeEventListener(type, listener, options);
    });
    window.addEventListener = _origWindowAdd;
    document.addEventListener = _origDocAdd;
` + newContent.slice(insertIndex2);
      fs.writeFileSync(p, newContent, 'utf8');
      patched++;
  }
});
console.log(`Patched ${patched} files`);
