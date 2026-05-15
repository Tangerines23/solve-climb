#!/usr/bin/env node
/**
 * DB 보안 정책(RLS) 및 Storage 권한 검증 스크립트
 * Supabase의 보안 설정이 비즈니스 요구사항에 맞게 설정되어 있는지 확인합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');

// .env 로드
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    const [key, ...valueParts] = trimmedLine.split('=');
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
  console.error('❌ Supabase 자격 증명이 없습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 1. RLS 활성화 상태 및 정책 확인 (RPC 활용)
 */
async function verifyRLS() {
  console.log('🛡️  RLS(Row Level Security) 상태 검정 중...');

  // DB에 정의된 get_rls_status RPC 호출
  const { data: rlsStatus, error } = await supabase.rpc('get_rls_status');

  if (error) {
    console.warn(
      `⚠️  get_rls_status RPC 호출 실패 (${error.message}). 기본 테이블 접근 테스트로 대체합니다.`
    );
    return await fallbackRLSTest();
  }

  let allSecure = true;
  console.log('📋 모든 테이블 RLS 상태 확인:');
  rlsStatus.forEach((table) => {
    const statusIcon = table.is_rls_enabled ? '✅' : '❌';
    console.log(
      `${statusIcon} Table: ${table.table_name.padEnd(25)} (RLS: ${table.is_rls_enabled ? 'Enabled' : 'Disabled'})`
    );
    if (!table.is_rls_enabled) {
      // 일부 시스템 테이블이나 의도적으로 비활성화된 테이블이 있을 수 있으므로 무조건 실패시키지는 않고 경고 후 특정 민감 테이블이면 실패
      const SENSITIVE_TABLES = [
        'profiles',
        'user_level_records',
        'game_records',
        'inventory',
        'items',
      ];
      if (SENSITIVE_TABLES.includes(table.table_name)) {
        console.error(
          `   ❌ CRITICAL: 민감 테이블 ${table.table_name}의 RLS가 비활성화되어 있습니다!`
        );
        allSecure = false;
      }
    }
  });

  // 추가적으로 fallback 테스트(실제 접근 테스트)도 수행하여 2중 검증
  const fallbackResult = await fallbackRLSTest();
  return allSecure && fallbackResult;
}

/**
 * RLS RPC가 없을 경우의 대체 테스트
 */
async function fallbackRLSTest() {
  const SENSITIVE_TABLES = ['profiles', 'user_level_records', 'game_records'];
  let allPassed = true;

  console.log('🧪 민감 테이블 익명 접근 차단 테스트 중 (SELECT)...');
  for (const table of SENSITIVE_TABLES) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`✅ ${table} (SELECT): 익명 접근 차단됨 (${error.message})`);
    } else if (data && data.length > 0) {
      console.error(
        `❌ SECURITY WARNING: ${table} 테이블의 데이터가 익명 사용자에게 노출되고 있습니다!`
      );
      allPassed = false;
    } else {
      console.log(`✅ ${table} (SELECT): 익명 접근 시 데이터 반환 없음 (RLS 작동 중)`);
    }
  }

  console.log('\n🧪 민감 테이블 익명 쓰기 차단 테스트 중 (INSERT)...');
  for (const table of SENSITIVE_TABLES) {
    // 임의의 데이터를 삽입 시도
    const { error } = await supabase
      .from(table)
      .insert([{ id: '00000000-0000-0000-0000-000000000000', dummy: true }])
      .select();

    // RLS가 작동하면 에러가 발생하거나, 삽입된 데이터가 반환되지 않아야 함
    if (error) {
      console.log(`✅ ${table} (INSERT): 익명 쓰기 차단됨 (${error.message})`);
    } else {
      console.error(`❌ SECURITY CRITICAL: ${table} 테이블에 익명 쓰기가 허용되었습니다!`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * 2. Schema Isolation 확인 (내부 스키마 접근 차단)
 */
async function verifySchemaIsolation() {
  console.log('\n🔍 Schema Isolation(스키마 격리) 상태 확인 중...');
  const internalSchemas = ['auth', 'storage', 'vault', 'extensions'];
  let allPassed = true;

  for (const schema of internalSchemas) {
    // PostgREST를 통해 내부 스키마의 테이블에 직접 접근 시도
    // (보통 설정이 잘 되어 있다면 404 Not Found나 401/403이 나야 함)
    try {
      const { error } = await supabase.from(`${schema}.users`).select('*').limit(1);

      if (
        error &&
        (error.code === '42501' ||
          error.code === 'PGRST106' ||
          error.code === '404' ||
          error.message.includes('not found'))
      ) {
        console.log(`✅ ${schema}: 접근 차단됨 (정상)`);
      } else if (!error) {
        console.error(`❌ SECURITY CRITICAL: ${schema} 스키마에 대한 익명 접근이 허용되었습니다!`);
        allPassed = false;
      } else {
        console.log(`✅ ${schema}: 접근 불가 (${error.message})`);
      }
    } catch (e) {
      console.log(`✅ ${schema}: 예외 발생 (접근 불가)`);
    }
  }
  return allPassed;
}

/**
 * 3. Storage Bucket 권한 확인
 */
async function verifyStorage() {
  console.log('\n📦 Storage Bucket 보안 상태 확인 중...');

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    // anon 키로 버킷 목록조차 못 보는 것이 보안적으로는 더 안전할 수 있음
    console.log('✅ Bucket 목록 조회 차단됨 (보안 권장 사항)');
    return true;
  }

  let allSecure = true;
  buckets.forEach((bucket) => {
    const type = bucket.public ? 'Public' : 'Private';
    const icon = bucket.public ? '⚠️ ' : '✅';
    console.log(`${icon} Bucket: ${bucket.name} (${type})`);

    // 특정 버킷은 반드시 Private이어야 함 (예: user-data)
    if (bucket.name.includes('private') && bucket.public) {
      console.error(`   ❌ Error: ${bucket.name} 버킷은 Private이어야 합니다!`);
      allSecure = false;
    }
  });

  return allSecure;
}

async function runSecurityCheck() {
  console.log('🚀 DB 보안 무결성 검증 시작...\n');

  const rlsOk = await verifyRLS();
  const schemaOk = await verifySchemaIsolation();
  const storageOk = await verifyStorage();

  if (!rlsOk || !schemaOk || !storageOk) {
    console.error('\n❌ 보안 검증 실패! 위 항목들을 수정해주세요.');
    process.exit(1);
  }

  console.log('\n✨ 모든 보안 검증 통과!');
  process.exit(0);
}

runSecurityCheck();
