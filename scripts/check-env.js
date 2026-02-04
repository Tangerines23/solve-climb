#!/usr/bin/env node
/**
 * .env 키 존재·형식 검사 (값은 절대 출력하지 않음)
 * CI와 동일한 이름의 시크릿이 로컬 .env에 올바르게 있는지 확인용.
 *
 * 사용: npm run check:env
 * 실제 Supabase 연결 테스트: npm run check:supabase:connection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

function loadEnv() {
  if (!fs.existsSync(envPath)) {
    return {};
  }
  const env = {};
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) return;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (key) env[key] = value;
  });
  return env;
}

const env = loadEnv();

const REQUIRED = [
  {
    key: 'VITE_SUPABASE_URL',
    desc: 'Supabase 프로젝트 URL',
    validate: (v) =>
      /^https:\/\/[^.]+\.supabase\.co/.test(v) && '형식 OK (https://xxx.supabase.co)',
  },
  {
    key: 'VITE_SUPABASE_ANON_KEY',
    desc: 'Supabase anon key',
    validate: (v) => v.length >= 20 && `설정됨 (${v.length}자)`,
  },
  {
    key: 'SUPABASE_DB_PASSWORD',
    desc: 'DB 비밀번호 (CI/로컬 link)',
    validate: (v) => v.length >= 1 && `설정됨 (${v.length}자)`,
  },
  {
    key: 'SUPABASE_ACCESS_TOKEN',
    desc: 'Supabase Access Token (선택, db push 등)',
    validate: (v) => v.length >= 1 && `설정됨 (${v.length}자)`,
  },
];

let hasError = false;
console.log('📋 .env 키 검사 (값 노출 없음)\n');

for (const { key, desc, validate } of REQUIRED) {
  const value = env[key];
  const required = key !== 'SUPABASE_ACCESS_TOKEN'; // 토큰은 선택
  if (!value || value.trim() === '') {
    if (required) {
      console.log(`❌ ${key}`);
      console.log(`   설명: ${desc}`);
      console.log(`   상태: 없음 → .env에 추가하세요.`);
      hasError = true;
    } else {
      console.log(`⚠️  ${key} (선택): 없음`);
    }
    continue;
  }
  try {
    const msg = validate(value);
    if (typeof msg === 'string') {
      console.log(`✅ ${key}: ${msg}`);
    } else {
      console.log(`❌ ${key}: 형식 오류 (${desc})`);
      hasError = true;
    }
  } catch (_) {
    console.log(`❌ ${key}: 검사 실패`);
    hasError = true;
  }
}

console.log('');
if (hasError) {
  console.log('→ .env를 수정한 뒤 다시 실행하세요.');
  console.log(
    '→ GitHub Actions에는 Repository Settings → Secrets and variables → Actions에 동일한 이름으로 넣으세요.\n'
  );
  process.exit(1);
}

console.log('→ 실제 연결 테스트: npm run check:supabase:connection');
console.log('→ DB link 테스트:   npm run check:db:link\n');
