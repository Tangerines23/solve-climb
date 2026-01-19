const fs = require('fs');
const buffer = fs.readFileSync('lint-report-clean.json');

let content;
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    content = buffer.toString('utf16le');
} else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    content = buffer.toString('utf16be');
} else {
    content = buffer.toString('utf16le');
}

// Resilient parsing: find objects with the target rule
const targetRule = process.argv[2] || "@typescript-eslint/no-unused-expressions";
const fileResults = [];

// Split by file entry (rudimentary but works for ESLint JSON)
const files = content.split('},{"filePath":"');
files.forEach(fileContent => {
    if (fileContent.includes(`"ruleId":"${targetRule}"`)) {
        // Extract rule occurrences
        const count = (fileContent.match(new RegExp(`"ruleId":"${targetRule}"`, 'g')) || []).length;
        // Extract filePath (it's at the start or after split)
        let path = "";
        if (fileContent.startsWith('[')) {
            const match = fileContent.match(/"filePath":"([^"]+)"/);
            path = match ? match[1] : "unknown";
        } else {
            path = fileContent.split('","messages"')[0];
        }
        fileResults.push({ path, count });
    }
});

fileResults.sort((a, b) => b.count - a.count);
console.log(JSON.stringify(fileResults.slice(0, 20), null, 2));
