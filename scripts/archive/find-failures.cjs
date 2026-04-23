const fs = require('fs');
const data = JSON.parse(fs.readFileSync('reports/test-results.json', 'utf8'));
const files = data.testResults;
files.forEach(file => {
  if (file.status === 'failed') {
    console.log(`Failed file: ${file.name}`);
    file.assertionResults.forEach(res => {
      if (res.status === 'failed') {
         console.log(`  - ${res.ancestorTitles.join(' > ')} > ${res.title}`);
         res.failureMessages.forEach(msg => console.log(`      ${msg.split('\n')[0].substring(0, 100)}`));
      }
    });
  }
});
