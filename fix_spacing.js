/* eslint-disable @typescript-eslint/no-require-imports */
/* Spacing Refactoring Script */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src');

function getCssFiles(directory, fileList = []) {
  try {
    const files = fs.readdirSync(directory);
    for (const file of files) {
      const fullPath = path.join(directory, file);
      if (fs.statSync(fullPath).isDirectory()) {
        getCssFiles(fullPath, fileList);
      } else if (file.endsWith('.css')) {
        fileList.push(fullPath);
      }
    }
  } catch (e) {
    console.error('Error scanning dir:', directory, e);
  }
  return fileList;
}

const files = getCssFiles(dir);
const map = {
  '4px': 'var(--spacing-xs)',
  '6px': 'var(--spacing-tiny)',
  '8px': 'var(--spacing-sm)',
  '10px': 'var(--spacing-small-alt)',
  '12px': 'var(--spacing-md)',
  '14px': 'var(--spacing-medium-alt)',
  '16px': 'var(--spacing-lg)',
  '20px': 'var(--spacing-xl)',
  '24px': 'var(--spacing-2xl)',
  '32px': 'var(--spacing-3xl)',
  '40px': 'var(--spacing-4xl)',
};

let count = 0;

files.forEach((file) => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Matches 'padding:', 'margin-left:', 'gap:', etc. followed by value until semicolon
    content = content.replace(
      /(padding|margin|gap)([-a-zA-Z]*):\s*([^;]+);/g,
      (match, prop, suffix, val) => {
        let newVal = val;
        let _replaced = false;

        // Iterate over map keys (e.g., '4px')
        // Using a simple regex to ensure we match whole words or numbers ending in px
        Object.keys(map).forEach((px) => {
          // Regex to match the pixel value boundary
          // We handle ' 4px', ':4px', '4px ' etc.
          const regex = new RegExp(`(?<=^|\\s)${px}(?=$|\\s)`, 'g');
          if (regex.test(newVal)) {
            newVal = newVal.replace(regex, map[px]);
            replaced = true;
          }
        });

        return `${prop}${suffix}: ${newVal};`;
      }
    );

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log(`Updated: ${path.basename(file)}`);
      count++;
    }
  } catch (e) {
    console.error('Error processing file:', file, e);
  }
});

console.log(`Spacing refactor complete. Modified ${count} files.`);
