const fs = require('fs');
const path = require('path');
const outDir = 'C:/Users/anush/.gemini/antigravity/brain/d1f66127-84a6-4379-ba82-95c0b1fbd533/';
const root = path.join(process.cwd(), 'frontend');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const allFiles = walk(root);
const graph = {};

allFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const relPath = path.relative(root, f).replace(/\\/g, '/');
  graph[relPath] = { imports: [], size: content.length, lines: content.split('\n').length };
  
  // Extract imports
  const importRegex = /import\s+.*from\s+['"](.*)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    let importedPath = match[1];
    if (importedPath.startsWith('.')) {
      importedPath = path.join(path.dirname(f), importedPath);
      let relImp = path.relative(root, importedPath).replace(/\\/g, '/');
      if (!relImp.endsWith('.js')) relImp += '.js';
      graph[relPath].imports.push(relImp);
    } else {
      graph[relPath].imports.push(importedPath);
    }
  }
  
  // Dynamic imports
  const dynRegex = /import\(['"](.*)['"]\)/g;
  while ((match = dynRegex.exec(content)) !== null) {
    let importedPath = match[1];
    if (importedPath.startsWith('.')) {
      importedPath = path.join(path.dirname(f), importedPath);
      let relImp = path.relative(root, importedPath).replace(/\\/g, '/');
      if (!relImp.endsWith('.js')) relImp += '.js';
      graph[relPath].imports.push(relImp);
    }
  }
});

// Calculate inverted graph
const inverted = {};
Object.keys(graph).forEach(k => inverted[k] = []);
Object.keys(graph).forEach(k => {
  graph[k].imports.forEach(imp => {
    if (inverted[imp]) inverted[imp].push(k);
  });
});

// Write DEPENDENCY_GRAPH.md
let depMd = '# Dependency Graph\n\n## Module Dependencies\n';
Object.keys(graph).sort().forEach(k => {
  depMd += `### \`${k}\`\n`;
  if (graph[k].imports.length > 0) {
    depMd += '- **Imports**:\n' + graph[k].imports.map(i => `  - \`${i}\``).join('\n') + '\n';
  } else {
    depMd += '- *No internal dependencies*\n';
  }
  if (inverted[k] && inverted[k].length > 0) {
    depMd += '- **Used by**:\n' + inverted[k].map(i => `  - \`${i}\``).join('\n') + '\n';
  }
  depMd += '\n';
});
fs.writeFileSync(path.join(outDir, 'DEPENDENCY_GRAPH.md'), depMd);

// Write IMPORT_TREE.md
let treeMd = '# Import Tree\n\n```mermaid\ngraph LR\n';
Object.keys(graph).forEach(k => {
  graph[k].imports.forEach(imp => {
    if (graph[imp]) {
      treeMd += `  ${k.replace(/[^a-zA-Z0-9]/g, '_')} --> ${imp.replace(/[^a-zA-Z0-9]/g, '_')}\n`;
    }
  });
});
treeMd += '```\n';
fs.writeFileSync(path.join(outDir, 'IMPORT_TREE.md'), treeMd);

// Write UNUSED_FILES_REPORT.md
const visited = new Set();
function traverse(node) {
  if (visited.has(node)) return;
  visited.add(node);
  if (graph[node]) {
    graph[node].imports.forEach(traverse);
  }
}
// Adding some known entry points
traverse('app.js');
traverse('config/routes.js');
let unusedMd = '# Unused Files Report\n\nThe following files are not imported by any other file in the project (excluding known entry points):\n\n';
const unused = Object.keys(inverted).filter(k => inverted[k].length === 0 && k !== 'app.js' && k !== 'config/routes.js');
if (unused.length === 0) unusedMd += '*All files are imported at least once.*\n';
unused.forEach(k => { unusedMd += `- \`${k}\`\n`; });
fs.writeFileSync(path.join(outDir, 'UNUSED_FILES_REPORT.md'), unusedMd);

// Write DUPLICATE_CODE_REPORT.md
let dupMd = '# Duplicate Code Report\n\nThis highlights files that might share structural similarities based on line count and usage.\n\n';
const grouped = {};
Object.keys(graph).forEach(k => {
  const g = Math.floor(graph[k].lines / 10) * 10;
  if (!grouped[g]) grouped[g] = [];
  grouped[g].push(k);
});
Object.keys(grouped).forEach(k => {
  if (grouped[k].length > 1 && parseInt(k) > 50) {
    dupMd += `### Files with ~${k} lines\n`;
    grouped[k].forEach(f => dupMd += `- \`${f}\`\n`);
    dupMd += '\n';
  }
});
fs.writeFileSync(path.join(outDir, 'DUPLICATE_CODE_REPORT.md'), dupMd);

console.log('Analysis reports generated.');
