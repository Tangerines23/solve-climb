#!/usr/bin/env node
/**
 * Vercel 설정 파일(vercel.json) 정적 분석 Linter
 * vercel.json에 SPA 라우팅 rewrites 규칙이 올바르게 존재하는지 검사합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const vercelJsonPath = path.join(__dirname, '..', 'vercel.json');

if (!fs.existsSync(vercelJsonPath)) {
  console.log('⚠️ vercel.json 파일이 존재하지 않습니다. 스킵합니다.');
  process.exit(0);
}

try {
  const content = fs.readFileSync(vercelJsonPath, 'utf-8');
  const json = JSON.parse(content);

  const hasRewrites =
    Array.isArray(json.rewrites) &&
    json.rewrites.some((r) => r.source === '/(.*)' && r.destination === '/index.html');

  if (!hasRewrites) {
    console.error(
      '❌ [vercel.json] SPA 라우팅(rewrites) 규칙 누락! /my-page 등 서브 경로 404 원인.'
    );
    console.error(
      '💡 vercel.json에 "rewrites": [{"source": "/(.*)", "destination": "/index.html"}] 을 추가하세요.'
    );
    process.exit(1);
  }

  console.log('✅ vercel.json SPA 라우팅 검증 통과!');
  process.exit(0);
} catch (e) {
  console.error('❌ vercel.json 파싱 실패:', e.message);
  process.exit(1);
}
