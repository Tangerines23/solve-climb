#!/usr/bin/env node

/**
 * DB 관련 파일 변경 감지 스크립트
 *
 * 사용법:
 *   node scripts/check-db-changes.js
 *
 * Git staged 파일 목록을 확인하여 DB 관련 파일이 변경되었는지 감지합니다.
 * 크로스 플랫폼 호환 (Windows/Linux/Mac)
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Git staged 파일 목록 가져오기
  const stagedFiles = execSync('git diff --cached --name-only', {
    encoding: 'utf-8',
    cwd: join(__dirname, '..'),
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // DB 관련 파일 패턴
  const dbPatterns = [/supabase\/migrations\/.*\.sql$/, /supabase\/.*\.sql$/];

  const hasDbChanges = stagedFiles
    .split('\n')
    .filter((file) => file.trim()) // 빈 줄 제거
    .some((file) => dbPatterns.some((pattern) => pattern.test(file)));

  if (hasDbChanges) {
    console.log('DB 파일 변경 감지');
    process.exit(0); // 다음 단계로 진행
  } else {
    // DB 파일 변경 없음 - 아무것도 출력하지 않음
    process.exit(0);
  }
} catch (error) {
  // Git 명령어 실패 시 (예: Git 저장소가 아닌 경우)
  console.error('DB 변경 감지 실패:', error.message);
  process.exit(1);
}
