/**
 * @file check-navigation.cjs
 * @description Audit script to detect direct navigate('string') calls.
 * Encourages the use of the Type-safe UrlBuilder (src/utils/navigation.ts).
 */

const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

// Use forward slashes for glob paths even on Windows
const SRC_PATTERN = path.join(__dirname, '../src/**/*.tsx').replace(/\\/g, '/');
const SRC_PATTERN_TS = path.join(__dirname, '../src/**/*.ts').replace(/\\/g, '/');

// Aggressive regex to find any navigate('...') call
const NAVIGATE_REGEX = /navigate\s*\(\s*['"`]([^'"`]+)['"`]/g;

const IGNORE_FILES = [
    'navigation.ts',
    'navigation.test.ts',
];

console.log('\x1b[36m%s\x1b[0m', '🔍 Checking for direct navigate() string calls...');
console.log(`Target: ${SRC_PATTERN}`);

let warningCount = 0;
let fileCount = 0;

function checkFile(filePath) {
    if (IGNORE_FILES.some(ignore => filePath.endsWith(ignore))) return;

    fileCount++;
    const content = fs.readFileSync(filePath, 'utf8');
    let match;

    while ((match = NAVIGATE_REGEX.exec(content)) !== null) {
        const fullMatch = match[0];
        const targetUrl = match[1];

        // Ignore simple / or common non-param routes if needed
        if (['/', '/ranking', '/shop', '/notifications'].includes(targetUrl)) continue;
        // Ignore relative navigation like navigate(-1) - regex already avoids this as it looks for quotes

        const lines = content.substring(0, match.index).split('\n');
        const lineNum = lines.length;

        console.warn('\x1b[33m%s\x1b[0m', `⚠️  Direct navigate detected in ${path.relative(process.cwd(), filePath)}:${lineNum}`);
        console.warn(`   Found: ${fullMatch}`);
        warningCount++;
    }
}

const files = [...globSync(SRC_PATTERN), ...globSync(SRC_PATTERN_TS)];
console.log(`Files found: ${files.length}`);

files.forEach(checkFile);

if (warningCount > 0) {
    console.log('\x1b[33m%s\x1b[0m', `📊 Found ${warningCount} navigation warnings in ${fileCount} files.`);
} else {
    console.log('\x1b[32m%s\x1b[0m', '✅ No direct navigation string calls found!');
}
