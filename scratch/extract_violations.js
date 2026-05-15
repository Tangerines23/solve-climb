import fs from 'fs';

const content = fs.readFileSync('lint_output.txt', 'utf8');
const lines = content.split('\n');
let currentFile = '';
const violations = [];

for (const line of lines) {
  if (line.startsWith('C:')) {
    currentFile = line.trim();
  } else if (line.includes('boundaries/dependencies')) {
    violations.push({ file: currentFile, error: line.trim() });
  }
}

console.log(JSON.stringify(violations, null, 2));
