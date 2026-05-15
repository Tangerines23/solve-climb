#!/usr/bin/env node
/**
 * .env의 SUPABASE_DB_PASSWORD, VITE_SUPABASE_URL로 supabase link 후 db push 실행
 * (game_activity 등 pending 마이그레이션 적용)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8')
    .split('\n')
    .forEach((line) => {
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

const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!VITE_SUPABASE_URL || !SUPABASE_DB_PASSWORD) {
  console.error('❌ .env에 VITE_SUPABASE_URL, SUPABASE_DB_PASSWORD를 설정하세요.');
  process.exit(1);
}

const match = VITE_SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
const PROJECT_REF = match ? match[1] : null;
if (!PROJECT_REF) {
  console.error('❌ VITE_SUPABASE_URL에서 project ref를 추출할 수 없습니다.');
  process.exit(1);
}

const usePooler = process.env.SUPABASE_USE_POOLER === '1';
const linkArgs = usePooler ? '' : '--skip-pooler';
const env = { ...process.env };

console.log('🔗 supabase link 실행 중...');
try {
  execSync(`npx supabase link --project-ref "${PROJECT_REF}" ${linkArgs}`.trim(), {
    stdio: 'inherit',
    env,
  });
  console.log('✅ link 성공');
} catch {
  console.error('❌ supabase link 실패');
  process.exit(1);
}

console.log('📤 supabase db push 실행 중...');
try {
  execSync('npx supabase db push --yes', { stdio: 'inherit', env });
  console.log('✅ db push 완료');
} catch {
  console.error(
    '❌ db push 실패 (마이그레이션 이력 불일치 시 supabase migration repair 후 재시도)'
  );
  process.exit(1);
}
