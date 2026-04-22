#!/usr/bin/env node
/**
 * MCP/훅 관련 환경 변수 설정 여부만 확인 (값은 출력하지 않음)
 * 사용: node scripts/check-mcp-env.js
 * .env 있으면 로드 후 확인 (없으면 셸 환경만)
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(path.join(__dirname, '..'), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  });
}

const vars = {
  VITE_SUPABASE_URL: 'Supabase (앱)',
  VITE_SUPABASE_ANON_KEY: 'Supabase (앱)',
  SENTRY_AUTH_TOKEN: 'Sentry (MCP/업로드)',
  VITE_SENTRY_DSN: 'Sentry (앱)',
};

const socketSet =
  (process.env.SOCKET_API_KEY && process.env.SOCKET_API_KEY.trim() !== '') ||
  (process.env.SOCKET_CLI_API_TOKEN && process.env.SOCKET_CLI_API_TOKEN.trim() !== '') ||
  (process.env.SOCKET_SECURITY_API_TOKEN && process.env.SOCKET_SECURITY_API_TOKEN.trim() !== '');

console.log('🔍 환경 변수 설정 여부 (값 미노출)\n');

let allSet = true;
console.log(`  ${socketSet ? '✅' : '❌'} Socket (훅+MCP 돌려쓰기)       SOCKET_API_KEY 권장`);
if (!socketSet) allSet = false;

for (const [key, label] of Object.entries(vars)) {
  const value = process.env[key];
  const set = value && String(value).trim() !== '';
  if (!set) allSet = false;
  console.log(`  ${set ? '✅' : '❌'} ${key.padEnd(28)} ${label}`);
}

console.log('');
console.log('💡 MCP 서버별 토큰/키는 Cursor 설정 → Features → MCP 에서 확인하세요.');
console.log('   (GitHub, Vercel, Linear, Postman 등은 Cursor UI에서만 설정 가능)\n');

process.exit(allSet ? 0 : 1);
