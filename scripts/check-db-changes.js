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
    stdio: ['pipe', 'pipe', 'ignore'], // Ignore stderr to avoid noise in non-git envs
  });

  // DB 관련 파일 패턴
  const dbPatterns = [/supabase\/migrations\/.*\.sql$/, /supabase\/.*\.sql$/];

  const hasDbChanges = stagedFiles
    .split('\n')
    .filter((file) => file.trim())
    .some((file) => dbPatterns.some((pattern) => pattern.test(file)));

  if (hasDbChanges) {
    // Only output the flag for script consumption
    process.stdout.write('DB_CHANGED');
    process.exit(0);
  } else {
    process.exit(0);
  }
} catch (error) {
  // If not in a git repo or git fails, output nothing (assume no changes)
  process.exit(0);
}
