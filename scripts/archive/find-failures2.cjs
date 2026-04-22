const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.log("Running vitest...");
  // execSync will throw if exit code != 0, so wrap in try-catch
  const output = execSync('npx vitest run src --reporter=json', { encoding: 'utf8', maxBuffer: 1024 * 1024 * 50 });
  parseAndPrint(output);
} catch (error) {
  console.log("Vitest returned non-zero exit code.");
  if (error.stdout) {
    parseAndPrint(error.stdout);
  } else {
    console.error(error);
  }
}

function parseAndPrint(output) {
  const jsonStartIndex = output.indexOf('{');
  if (jsonStartIndex === -1) {
    console.log("No JSON found in output.");
    return;
  }
  const jsonStr = output.slice(jsonStartIndex);
  try {
    const data = JSON.parse(jsonStr);
    const files = data.testResults;
    let failedCount = 0;
    files.forEach(file => {
      if (file.status === 'failed') {
        failedCount++;
        console.log(`\nFAILED TEST FILE: ${file.name}`);
        file.assertionResults.forEach(res => {
          if (res.status === 'failed') {
             console.log(`  - ${res.ancestorTitles.join(' > ')} > ${res.title}`);
             res.failureMessages.forEach(msg => {
                const lines = msg.split('\n');
                console.log(`      ${lines[0]}`);
             });
          }
        });
      }
    });
    console.log(`\nTOTAL FAILED FILES: ${failedCount}`);
  } catch (e) {
    console.error("Failed to parse JSON:", e.message);
  }
}
