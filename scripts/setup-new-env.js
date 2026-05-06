#!/usr/bin/env node
/**
 * 새 환경에서 한 번에 세팅하기 위한 스크립트
 * - Node 버전 확인
 * - .env 없으면 .env.example 복사
 * - 의존성 설치 안내
 * 사용: npm run setup (또는 node scripts/setup-new-env.js)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const ENV_EXAMPLE_PATH = path.join(ROOT, '.env.example');
const NODE_VERSION_FILE = path.join(ROOT, '.node-version');

function readNodeVersion() {
  if (!fs.existsSync(NODE_VERSION_FILE)) return null;
  return fs.readFileSync(NODE_VERSION_FILE, 'utf8').trim();
}

function checkNodeVersion() {
  const required = readNodeVersion();
  if (!required) return { ok: true };
  const major = parseInt(process.version.slice(1).split('.')[0], 10);
  const needMajor = parseInt(required.split('.')[0], 10);
  if (major < needMajor) {
    console.warn(
      `\n⚠️  Node.js ${required} 이상 권장 (현재: ${process.version}). .node-version 참고.\n`
    );
    return { ok: false };
  }
  return { ok: true };
}

function ensureEnv() {
  if (fs.existsSync(ENV_PATH)) {
    return { created: false };
  }
  if (!fs.existsSync(ENV_EXAMPLE_PATH)) {
    console.warn('⚠️  .env.example 없음. .env를 직접 생성해 주세요.');
    return { created: false };
  }
  fs.copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
  return { created: true };
}

function main() {
  console.log('🔧 Solve Climb 새 환경 세팅\n');

  const nodeOk = checkNodeVersion();
  if (!nodeOk.ok) {
    process.exitCode = 1;
    return;
  }

  const envResult = ensureEnv();
  if (envResult.created) {
    console.log('✅ .env 생성됨 (.env.example 복사).');
    console.log(
      '   → .env에서 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 등 실제 값으로 수정하세요.\n'
    );
  } else {
    console.log('✅ .env 이미 존재 (유지).\n');
  }

  if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
    console.log('📦 의존성 설치: npm install 실행 중...\n');
    execSync('npm install', { cwd: ROOT, stdio: 'inherit' });
  } else {
    console.log('✅ node_modules 있음. 최신 반영이 필요하면: npm install\n');
  }

  console.log('--- 다음 단계 ---');
  console.log('1. .env에서 Supabase URL/Anon Key 등 필요한 값 설정');
  console.log('2. 개발 서버: npm run dev');
  console.log('3. 검증: npm run validate:fast');
  console.log('');
}

main();
