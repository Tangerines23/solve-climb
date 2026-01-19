const fs = require('fs');
const buffer = fs.readFileSync('lint-errors.json');

let content;
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    content = buffer.toString('utf16le');
} else if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
    content = buffer.toString('utf16be');
} else {
    content = buffer.toString('utf16le');
}

try {
    const report = JSON.parse(content);
    const targetRules = ["@typescript-eslint/no-unused-vars", "no-useless-escape", "@typescript-eslint/no-require-imports"];
    const results = [];

    report.forEach(file => {
        const relevantMessages = file.messages.filter(msg => targetRules.includes(msg.ruleId));
        if (relevantMessages.length > 0) {
            results.push({
                path: file.filePath,
                errors: relevantMessages.map(m => ({ line: m.line, rule: m.ruleId, message: m.message }))
            });
        }
    });

    console.log(JSON.stringify(results, null, 2));
} catch (e) {
    console.error("Parse failed");
}
