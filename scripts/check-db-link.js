#!/usr/bin/env node
/**
 * DB 비밀번호 연결 검증 (CI security-db job과 동일한 방식)
 * 로컬 .env에 SUPABASE_DB_PASSWORD, VITE_SUPABASE_URL, SUPABASE_ACCESS_TOKEN 설정 후 실행.
 * 성공 시 supabase link + db lint 통과 = GitHub Secrets 비밀번호가 맞을 가능성 높음.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!VITE_SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL가 없습니다. .env에 설정하세요.');
  process.exit(1);
}
if (!SUPABASE_DB_PASSWORD) {
  console.error('❌ SUPABASE_DB_PASSWORD가 없습니다. .env에 설정하세요.');
  process.exit(1);
}

const match = VITE_SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
const PROJECT_REF = match ? match[1] : null;
if (!PROJECT_REF || PROJECT_REF === VITE_SUPABASE_URL) {
  console.error('❌ VITE_SUPABASE_URL에서 project ref를 추출할 수 없습니다:', VITE_SUPABASE_URL);
  process.exit(1);
}

console.log('🔗 project ref:', PROJECT_REF);

// IPv6 미지원 네트워크: --skip-pooler 시 db.xxx.supabase.co 직결로 IPv6 필요 → 실패
// 풀러(Supavisor) 사용 시 IPv4 호환 → 로컬에서 db lint 통과 가능
const usePooler = process.env.SUPABASE_USE_POOLER === '1';
const linkArgs = usePooler ? '' : '--skip-pooler';
console.log(`   supabase link ${linkArgs || '(pooler, IPv4 호환)'} 실행 중...`);

const env = { ...process.env };
if (SUPABASE_ACCESS_TOKEN) env.SUPABASE_ACCESS_TOKEN = SUPABASE_ACCESS_TOKEN;
env.SUPABASE_DB_PASSWORD = SUPABASE_DB_PASSWORD;
env.VITE_SUPABASE_URL = VITE_SUPABASE_URL;

try {
  execSync(`npx supabase link --project-ref "${PROJECT_REF}" ${linkArgs}`.trim(), {
    stdio: 'inherit',
    env,
  });
  console.log('✅ supabase link 성공');
} catch {
  console.error('❌ supabase link 실패 (비밀번호 또는 풀러/네트워크 문제 가능)');
  process.exit(1);
}

console.log('   db lint 실행 중...');
try {
  execSync('npx supabase db lint --linked --fail-on error', { stdio: 'inherit', env });
  console.log('✅ db lint 성공');
} catch {
  console.error('❌ db lint 실패');
  process.exit(1);
}

console.log('\n✅ DB 비밀번호 연결 검증 완료. CI security-db job과 동일한 방식으로 통과했습니다.');
