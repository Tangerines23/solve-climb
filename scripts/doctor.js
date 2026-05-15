#!/usr/bin/env node
/**
 * Project Doctor: Unified Diagnostic Utility
 * Runs all health checks and provides a summary report.
 */

import { spawnSync } from 'child_process';
import chalk from 'chalk'; // Assuming chalk is available, if not use escape codes
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple color helper in case chalk is not available
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const checks = [
  { name: 'System Dependencies', script: 'scripts/check-system-deps.js', critical: true },
  { name: 'Environment Variables', script: 'scripts/check-env.js', critical: true },
  { name: 'Database Security', script: 'scripts/check-db-security.js', critical: false },
  { name: 'Secrets Check', script: 'scripts/check-secrets.js', critical: false },
  {
    name: 'Circular Dependencies',
    command: 'npx madge --circular --extensions ts,tsx src/',
    critical: false,
  },
  { name: 'Package Audit', command: 'npm audit --audit-level=high', critical: false },
];

console.log(
  `${colors.bold}${colors.cyan}🩺 Project Doctor is diagnosing your workspace...${colors.reset}\n`
);

let passedCount = 0;
let failedCount = 0;
const failures = [];

for (const check of checks) {
  process.stdout.write(`  Checking ${colors.bold}${check.name}${colors.reset}... `);

  let result;
  try {
    if (check.script) {
      result = spawnSync('node', [check.script], { stdio: 'pipe', encoding: 'utf8' });
    } else {
      // Improved command execution
      result = spawnSync('powershell', ['-Command', check.command], {
        stdio: 'pipe',
        encoding: 'utf8',
        shell: true,
      });
    }

    if (result.status === 0) {
      console.log(`${colors.green}PASS${colors.reset}`);
      passedCount++;
    } else {
      console.log(`${colors.red}FAIL${colors.reset}`);
      failedCount++;
      const errorMsg = (result.stdout || '') + '\n' + (result.stderr || '');
      failures.push({
        name: check.name,
        error: errorMsg.trim() || 'Command failed with exit code ' + result.status,
        critical: check.critical,
      });
    }
  } catch (err) {
    console.log(`${colors.red}ERROR${colors.reset}`);
    failedCount++;
    failures.push({
      name: check.name,
      error: err.message,
      critical: check.critical,
    });
  }
}

console.log('\n' + '='.repeat(50));
console.log(`${colors.bold}Diagnostic Summary:${colors.reset}`);
console.log(`  ${colors.green}Passed: ${passedCount}${colors.reset}`);
console.log(`  ${colors.red}Failed: ${failedCount}${colors.reset}`);
console.log('='.repeat(50) + '\n');

if (failures.length > 0) {
  console.log(`${colors.bold}${colors.red}Found Issues:${colors.reset}`);
  for (const failure of failures) {
    console.log(
      `\n[${failure.critical ? colors.red + 'CRITICAL' : colors.yellow + 'WARNING'}${colors.reset}] ${colors.bold}${failure.name}${colors.reset}`
    );
    // Show a snippet of the error
    const errorLines = (failure.error || '')
      .split('\n')
      .filter((l) => l.trim())
      .slice(0, 10);
    errorLines.forEach((line) => console.log(`  ${line}`));
    if (failure.error.split('\n').length > 5) console.log('  ...');
  }

  const hasCritical = failures.some((f) => f.critical);
  if (hasCritical) {
    console.log(
      `\n${colors.red}${colors.bold}❌ Action Required: Please fix critical issues before proceeding.${colors.reset}`
    );
    process.exit(1);
  } else {
    console.log(
      `\n${colors.yellow}${colors.bold}⚠️ Suggestions: Consider fixing warnings for a healthier project.${colors.reset}`
    );
  }
} else {
  console.log(
    `${colors.green}${colors.bold}✨ Your project is in excellent health!${colors.reset}`
  );
}
