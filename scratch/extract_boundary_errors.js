
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('lint_results.json', 'utf8'));

const boundaryErrors = data.filter(file => {
  return file.messages.some(msg => msg.ruleId === 'boundaries/dependencies');
}).map(file => {
  return {
    filePath: file.filePath,
    errors: file.messages.filter(msg => msg.ruleId === 'boundaries/dependencies').map(msg => ({
      line: msg.line,
      message: msg.message
    }))
  };
});

const summary = JSON.stringify(boundaryErrors, null, 2);
fs.writeFileSync('boundary_errors_summary.json', summary, 'utf8');
console.log('Summary written to boundary_errors_summary.json');

