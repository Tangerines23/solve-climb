const fs = require('fs');
const buffer = fs.readFileSync('lint-report-clean.json');

let content;
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    content = buffer.toString('utf16le');
} else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    content = buffer.toString('utf16be');
} else if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
    content = buffer.toString('utf8');
} else {
    // Try UTF-16LE if it looks like there are many null bytes (common in ASCII-in-UTF16)
    if (buffer.includes(0)) {
        content = buffer.toString('utf16le');
    } else {
        content = buffer.toString('utf8');
    }
}

// Strip BOM
content = content.replace(/^\uFEFF/, '');

try {
    const report = JSON.parse(content);
    const stats = {};

    report.forEach(file => {
        file.messages.forEach(msg => {
            stats[msg.ruleId] = (stats[msg.ruleId] || 0) + 1;
        });
    });

    const sortedStats = Object.entries(stats)
        .sort((a, b) => b[1] - a[1])
        .reduce((obj, [key, val]) => {
            obj[key] = val;
            return obj;
        }, {});

    console.log(JSON.stringify(sortedStats, null, 2));
} catch (e) {
    console.error('Failed to parse JSON:', e.message);
    console.log('Buffer start:', buffer.slice(0, 20).toString('hex'));
}
