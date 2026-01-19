const fs = require('fs');
const buffer = fs.readFileSync('lint-errors-final.json');
let content;
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    content = buffer.toString('utf16le');
} else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    content = buffer.toString('utf16be');
} else {
    content = buffer.toString('utf8');
}

const fileMatches = content.matchAll(/\{"filePath":"([^"]+)","messages":\[(.*?)\]\}/g);
const results = [];

for (const match of fileMatches) {
    const filePath = match[1];
    const messagesStr = match[2];
    const messageMatches = [...messagesStr.matchAll(/\{"ruleId":"([^"]+)","severity":\d+,"message":"([^"]+)","line":(\d+)/g)];
    if (messageMatches.length > 0) {
        console.log(`FILE: ${filePath} (${messageMatches.length} errors)`);
        messageMatches.forEach(m => {
            console.log(`  L${m[3]}: [${m[1]}] ${m[2]}`);
        });
    }
}
