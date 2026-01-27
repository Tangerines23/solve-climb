import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const SEARCH_DIR = path.resolve(__dirname, '../src');
const MIN_LENGTH = 5; // Minimum string length to consider
const MIN_OCCURRENCES = 3; // Minimum duplicates to trigger warning
const IGNORE_STRINGS = [
  'application/json',
  'utf-8',
  'transparent',
  'center',
  'absolute',
  'relative',
  'return',
  'button',
  'submit',
];

const IGNORE_FILES = ['.test.', '.spec.', '.stories.', 'vite-env.d.ts'];

const stringMap = new Map();

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  // Regex to capture string literals in single or double quotes
  // excluding import statements and simple keys
  const regex = /(?<!import\s+[^;]*)(["'])(.*?)\1/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const str = match[2];

    if (str.length < MIN_LENGTH) continue;
    if (IGNORE_STRINGS.includes(str)) continue;
    if (str.startsWith('http')) continue; // Ignore URLs
    if (str.match(/^[0-9a-fA-F#-]+$/)) continue; // Ignore Hex colors or UUIDs

    // Record occurrence
    if (!stringMap.has(str)) {
      stringMap.set(str, []);
    }
    stringMap.get(str).push(path.relative(process.cwd(), filePath));
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else {
      if (!file.match(/\.(tsx|ts)$/)) continue;
      if (IGNORE_FILES.some((ignore) => file.includes(ignore))) continue;
      scanFile(fullPath);
    }
  }
}

console.log('🔮 [Magic String Hunter] Scanning for repeated hardcoded strings...');
walkDir(SEARCH_DIR);

let foundIssues = 0;

console.log('\n📊 Top Repeated Strings (Candidates for Constants/i18n):');
const sorted = [...stringMap.entries()].sort((a, b) => b[1].length - a[1].length);

for (const [str, locations] of sorted) {
  if (locations.length >= MIN_OCCURRENCES) {
    // file list unique
    const uniqueFiles = [...new Set(locations)];
    if (uniqueFiles.length >= 2) {
      // Must appear in at least 2 different files (or 3+ times total)
      console.log(`\n"${str}"`);
      console.log(`   Count: ${locations.length}`);
      console.log(
        `   Files: ${uniqueFiles.slice(0, 3).join(', ')}${uniqueFiles.length > 3 ? '...' : ''}`
      );
      foundIssues++;
    }
  }
}

if (foundIssues > 0) {
  console.log(`\n⚠️  Found ${foundIssues} potential magic strings.`);
  console.log('Consider moving these to constants.ts or an i18n file.');
  // Don't fail the build yet, just warn
  process.exit(0);
} else {
  console.log('✅ Clean! No significant magic strings found.');
}
