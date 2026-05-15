import fs from 'fs';

let content = fs.readFileSync('lint_errors_utf8.txt', 'utf8');
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
const lines = content.split('\n');
const results = [];
let currentFile = null;

lines.forEach(line => {
  const trimmed = line.trim();
  // Match Windows paths like C:\...
  const fileMatch = trimmed.match(/^([a-zA-Z]:\\[^ :]+)$/);
  if (fileMatch) {
    currentFile = fileMatch[1];
  } else if (trimmed.includes('boundaries/dependencies')) {
    if (currentFile) {
      let fileObj = results.find(r => r.filePath === currentFile);
      if (!fileObj) {
        fileObj = { filePath: currentFile, errors: [] };
        results.push(fileObj);
      }
      fileObj.errors.push(trimmed);
    }
  }
});

fs.writeFileSync('boundary_errors_summary.json', JSON.stringify(results, null, 2));
console.log(`Found ${results.length} files with boundary errors.`);
