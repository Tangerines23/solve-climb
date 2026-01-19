const fs = require('fs');
const buffer = fs.readFileSync('lint-errors.json');

let content;
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    content = buffer.toString('utf16le');
} else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    content = buffer.toString('utf16be');
} else {
    content = buffer.toString('utf16le'); // Default to UTF-16LE for PowerShell redirection
}

const stats = {};
const regex = /"ruleId":"([^"]+)"/g;
let match;

while ((match = regex.exec(content)) !== null) {
    const ruleId = match[1];
    stats[ruleId] = (stats[ruleId] || 0) + 1;
}

const sortedStats = Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
    }, {});

console.log(JSON.stringify(sortedStats, null, 2));
