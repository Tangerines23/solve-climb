#!/usr/bin/env node
/**
 * DB 검증 테스트 스크립트
 * Supabase DB의 데이터 무결성을 검증합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load .env for local development
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Error: Supabase credentials not found in environment variables.');
  console.error('--- Environment Status ---');
  console.log(`VITE_SUPABASE_URL: ${supabaseUrl ? 'SET' : 'MISSING'}`);
  console.log(`VITE_SUPABASE_ANON_KEY: ${supabaseKey ? 'SET' : 'MISSING'}`);
  console.error('\nExpected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to be available.');
  console.error(
    'Note: If running in GitHub Actions, ensure the extract-and-export logic in ci.yml is correct.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Deep DB Consistency Checks
 * This runs logical validations that go beyond simple schema/resource existence.
 */
async function runDeepConsistencyChecks() {
  console.log('🧪 Running Deep Logical Consistency Checks...');
  const logs = [];
  let failed = false;

  // 1. Mastery Score Consistency Check
  // total_mastery_score should equal the sum of best_scores in user_level_records
  const { data: masteryCheck, error: masteryError } = await supabase.rpc(
    'check_mastery_consistency'
  );

  if (masteryError) {
    console.error('❌ Error calling "check_mastery_consistency" RPC:', masteryError.message);
    failed = true;
  } else if (masteryCheck && masteryCheck.length > 0) {
    masteryCheck.forEach((err) => {
      logs.push(
        `❌ Mastery Inconsistency for user ${err.user_id} (${err.nickname}): ${err.message}`
      );
      failed = true;
    });
  }

  // 2. Orphan User Level Records Check
  await supabase.from('user_level_records').select('user_id').limit(1); // Check if we can even join/query

  // Real orphan check usually needs a left join which we can't easily do via JS client without a custom RPC
  // So we skip or use a custom RPC if available.
  // For now, let's add a placeholder for a known integrity check from the existing system

  // 3. Impossibly High Score Check
  const { data: highScores } = await supabase
    .from('profiles')
    .select('id, nickname, weekly_score_total')
    .gt('weekly_score_total', 1000000);

  if (highScores && highScores.length > 0) {
    highScores.forEach((u) => {
      logs.push(`⚠️  Suspiciously high weekly score: ${u.nickname} (${u.weekly_score_total})`);
    });
  }

  if (logs.length === 0) {
    console.log('✅ Deep consistency checks passed (or no obvious errors found).');
  } else {
    logs.forEach((log) => console.log(log));
  }

  return !failed;
}

async function runDBValidation() {
  console.log('🔍 Running DB validation system...\n');

  try {
    // Phase 1: Resource & Schema Validation (Existing)
    const { data, error } = await supabase.rpc('test_db_all_validations');

    if (error) {
      console.error('❌ Error running DB tests:', error.message);
      if (error.code === 'PGRST116') {
        console.error('💡 Hint: The RPC function "test_db_all_validations" was not found.');
        console.error(
          '   Please ensure you have applied the latest SQL migrations to your Supabase project.'
        );
      }
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.error('❌ No test results returned');
      process.exit(1);
    }

    // 결과 출력
    let allPassed = true;
    console.log('--- Resource checks ---');
    data
      .filter((t) => t.test_name.startsWith('check_required'))
      .forEach((test) => {
        const icon = test.result ? '✅' : '❌';
        console.log(`${icon} ${test.test_name}: ${test.message}`);
        if (!test.result) allPassed = false;
      });

    console.log('\n--- Data integrity checks ---');
    data
      .filter((t) => !t.test_name.startsWith('check_required'))
      .forEach((test) => {
        const icon = test.result ? '✅' : '❌';
        console.log(`${icon} ${test.test_name}: ${test.message}`);
        if (!test.result) allPassed = false;
      });

    console.log(`\n📊 Total: ${data.length} tests`);
    console.log(`✅ Passed: ${data.filter((t) => t.result).length}`);
    console.log(`❌ Failed: ${data.filter((t) => !t.result).length}`);

    if (!allPassed) {
      console.error('\n❌ DB validation failed! Please check missing resources or data errors.');
      process.exit(1);
    }

    // Phase 2: Deep Logical Validation
    const deepPassed = await runDeepConsistencyChecks();

    if (!deepPassed) {
      console.error('\n❌ Deep DB consistency check failed!');
      process.exit(1);
    }

    console.log('\n✅ All DB validation tests passed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

runDBValidation();
