#!/usr/bin/env node

/**
 * 마이그레이션 파일 검증 스크립트
 *
 * 사용법:
 *   node scripts/check-migrations.js
 *
 * 검증 항목:
 *   - 마이그레이션 파일명 형식 (YYYYMMDDHHMMSS_description.sql)
 *   - 마이그레이션 파일 목록 확인
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

// 마이그레이션 파일명 형식: YYYYMMDDHHMMSS_description.sql
const MIGRATION_FILE_PATTERN = /^\d{14}_[\w-]+\.sql$/;

/**
 * 마이그레이션 파일 검증
 */
function validateMigrationFiles() {
  console.log('🔍 마이그레이션 파일 검증 중...\n');

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error('❌ 마이그레이션 디렉토리를 찾을 수 없습니다:', MIGRATIONS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(MIGRATIONS_DIR);
  const sqlFiles = files.filter((file) => file.endsWith('.sql'));

  if (sqlFiles.length === 0) {
    console.log('⚠️  마이그레이션 파일이 없습니다.');
    return { valid: true, errors: [], warnings: [] };
  }

  const errors = [];
  const warnings = [];

  sqlFiles.forEach((file) => {
    const filePath = path.join(MIGRATIONS_DIR, file);

    // 파일명 형식 검증
    if (!MIGRATION_FILE_PATTERN.test(file)) {
      // 형식에 맞지 않는 파일은 경고로 처리 (Supabase CLI에서도 Skip됨)
      warnings.push({
        file,
        message: `파일명 형식이 올바르지 않습니다. 형식: YYYYMMDDHHMMSS_description.sql (Supabase CLI에서 Skip됨)`,
      });
      return;
    }

    // 파일이 비어있는지 확인
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (content.length === 0) {
      warnings.push({
        file,
        message: '파일이 비어있습니다.',
      });
    }

    // 기본 SQL 키워드 확인 (간단한 검증)
    const hasSqlKeywords = /CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|--|\/\*/i.test(content);
    if (!hasSqlKeywords && content.length > 0) {
      warnings.push({
        file,
        message: 'SQL 키워드가 없거나 주석만 있는 파일일 수 있습니다.',
      });
    }
  });

  // 형식에 맞는 파일만 필터링
  const validFiles = sqlFiles.filter((file) => MIGRATION_FILE_PATTERN.test(file));

  // 결과 출력
  if (validFiles.length > 0) {
    console.log(`✅ 검증된 마이그레이션 파일: ${validFiles.length}개`);
    console.log('\n📋 마이그레이션 파일 목록:');
    validFiles.forEach((file) => {
      console.log(`   ✅ ${file}`);
    });
  }

  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length}개의 경고 (형식에 맞지 않는 파일):\n`);
    warnings.forEach(({ file, message }) => {
      console.warn(`   ⚠️  ${file}: ${message}`);
    });
  }

  if (errors.length > 0) {
    console.error(`\n❌ ${errors.length}개의 오류 발견:\n`);
    errors.forEach(({ file, message }) => {
      console.error(`   ${file}: ${message}`);
    });
    return { valid: false, errors, warnings };
  }

  return { valid: true, errors: [], warnings };
}

// 메인 실행
try {
  const result = validateMigrationFiles();

  if (!result.valid) {
    console.error('\n❌ 마이그레이션 파일 검증 실패');
    process.exit(1);
  }

  console.log('\n✅ 마이그레이션 파일 검증 완료');
  console.log('\n💡 추가 검증: 다음 명령어를 실행하여 원격 DB와 동기화 상태를 확인하세요:');
  console.log('   npx supabase migration list');
  console.log('\n💡 SQL 문법 검증: 다음 명령어를 실행하세요:');
  console.log('   npx supabase db lint --linked');
} catch (error) {
  console.error('❌ 검증 중 오류 발생:', error.message);
  process.exit(1);
}
