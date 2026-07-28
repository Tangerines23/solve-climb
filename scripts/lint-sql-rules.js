#!/usr/bin/env node
/**
 * SQL 정적 분석 Linter
 * supabase/migrations/*.sql 파일 내의 셀프 비교(p_category = p_category),
 * 잘못된 NULL 비교(= NULL) 등을 정적으로 검사합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

if (!fs.existsSync(migrationsDir)) {
  console.log('⚠️ supabase/migrations 디렉토리가 존재하지 않습니다. 스킵합니다.');
  process.exit(0);
}

const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));

let hasError = false;
let totalFilesChecked = 0;
let totalIssues = 0;

console.log('🔍 Running SQL Static Linting (Self-comparison & NULL rules)...');

files.forEach((file) => {
  const filePath = path.join(migrationsDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  totalFilesChecked++;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    // 주석 행 스킵
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed.startsWith('/*')) return;

    // 1. 셀프 비교 감지 (\b(\w+)\s*=\s*\1\b) - 단, 숫자(1=1)나 리터럴 제외
    const selfCompareMatch = line.match(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\1\b/i);
    if (selfCompareMatch) {
      const varName = selfCompareMatch[1];
      // SQL 파라미터/변수명 패턴(p_*, v_*)이거나 테이블 칼럼명 셀프 비교인 경우
      if (
        varName.startsWith('p_') ||
        varName.startsWith('v_') ||
        ['category', 'period', 'type', 'status'].includes(varName.toLowerCase())
      ) {
        console.error(
          `❌ [${file}:${lineNum}] 위험한 셀프 비교(Self-comparison) 발견: "${selfCompareMatch[0]}"`
        );
        hasError = true;
        totalIssues++;
      }
    }

    // 2. 잘못된 NULL 연산 감지 (= NULL 또는 <> NULL)
    const invalidNullMatch = line.match(/\b(=|<|>|<>|!=)\s*NULL\b/i);
    if (invalidNullMatch) {
      console.error(
        `❌ [${file}:${lineNum}] 잘못된 NULL 비교 연산 발견: "${invalidNullMatch[0]}" (IS NULL 또는 IS NOT NULL 사용 필요)`
      );
      hasError = true;
      totalIssues++;
    }

    // 3. 존재하지 않는 profiles.avatar_url 컬럼 참조 감지
    if (line.includes('profiles') && line.includes('avatar_url')) {
      console.error(
        `❌ [${file}:${lineNum}] 미존재 컬럼 참조 발견: profiles 테이블에는 avatar_url 컬럼이 존재하지 않습니다.`
      );
      hasError = true;
      totalIssues++;
    }

    // 4. app.bypass_profile_security 가 'true' 전용으로 단독 설정된 단일 비교 감지
    if (
      line.includes("current_setting('app.bypass_profile_security'") &&
      line.includes("= 'true'") &&
      !line.includes('IN')
    ) {
      console.error(
        `❌ [${file}:${lineNum}] 취약한 보안 플래그 단일 비교 발견: app.bypass_profile_security는 IN ('1', 'true') 형태로 검사해야 함.`
      );
      hasError = true;
      totalIssues++;
    }
  });
});

if (hasError) {
  console.error(`\n❌ SQL Lint 검사 실패! 총 ${totalIssues}개의 위반 사항이 발견되었습니다.`);
  console.error(
    '💡 해결방법: 셀프 비교(p_val = p_val)를 제거하거나 IS NULL 구문으로 변경하세요.\n'
  );
  process.exit(1);
} else {
  console.log(`✅ SQL Lint 검사 통과! (${totalFilesChecked}개 마이그레이션 파일 정상)`);
  process.exit(0);
}
