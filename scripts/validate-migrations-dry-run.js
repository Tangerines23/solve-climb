#!/usr/bin/env node
/**
 * Migration Dry-Run Validator
 * Ensures all migrations can be applied successfully from scratch.
 * This script is intended for CI/CD pipelines and local pre-push checks.
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

console.log(
  `${colors.bold}${colors.cyan}🚀 Starting Migration Dry-Run Validation...${colors.reset}`
);

// 1. Ensure Supabase is running
console.log('📦 Checking Supabase status...');
const statusResult = spawnSync('npx', ['supabase', 'status'], { stdio: 'pipe', encoding: 'utf8' });

if (statusResult.status !== 0) {
  console.log('⚠️ Supabase is not running. Attempting to start...');
  const startResult = spawnSync('npx', ['supabase', 'start'], { stdio: 'inherit' });
  if (startResult.status !== 0) {
    console.error('❌ Failed to start Supabase. Dry-run aborted.');
    process.exit(1);
  }
}

// 2. Perform DB Reset (This applies all migrations to a fresh database)
console.log(`\n${colors.bold}🔄 Resetting database and applying all migrations...${colors.reset}`);
console.log('   (This ensures your entire schema history is valid and conflict-free)');

const resetResult = spawnSync('npx', ['supabase', 'db', 'reset'], { stdio: 'inherit' });

if (resetResult.status === 0) {
  console.log(`\n${colors.green}${colors.bold}✅ Migration Dry-Run Successful!${colors.reset}`);
  console.log('   All migrations applied correctly to a clean database state.');
} else {
  console.error(`\n${colors.red}${colors.bold}❌ Migration Dry-Run Failed!${colors.reset}`);
  console.error('   Please check the error logs above for migration conflicts or SQL errors.');
  process.exit(1);
}

// 3. Final Linting Check
console.log(`\n${colors.bold}🔍 Running final DB linting...${colors.reset}`);
const lintResult = spawnSync('npx', ['supabase', 'db', 'lint'], { stdio: 'inherit' });

if (lintResult.status === 0) {
  console.log(`${colors.green}✅ Schema linting passed.${colors.reset}`);
} else {
  console.warn(
    `${colors.yellow}⚠️ Schema linting found warnings (non-fatal in dry-run).${colors.reset}`
  );
}
