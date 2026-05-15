#!/usr/bin/env node
/**
 * .env 파일의 키들을 .env.example에 동기화하는 스크립트
 * - 새로운 키가 .env에 추가되면 .env.example에도 추가 (값은 placeholder로 대체)
 * - 기존 주석이나 구조를 최대한 유지하려 노력함
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const EXAMPLE_PATH = path.join(ROOT, '.env.example');

function sync() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('❌ .env 파일이 없습니다. 동기화할 수 없습니다.');
    return;
  }

  const envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  const exampleContent = fs.existsSync(EXAMPLE_PATH) ? fs.readFileSync(EXAMPLE_PATH, 'utf-8') : '';

  const envLines = envContent.split('\n');
  const exampleLines = exampleContent.split('\n');

  const envKeys = new Set();
  envLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) envKeys.add(trimmed.slice(0, eqIdx).trim());
  });

  const exampleKeys = new Set();
  exampleLines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) exampleKeys.add(trimmed.slice(0, eqIdx).trim());
  });

  const missingKeys = [...envKeys].filter((key) => !exampleKeys.has(key));

  if (missingKeys.length === 0) {
    console.log('✅ .env.example가 이미 최신 상태입니다.');
    return;
  }

  let updatedExample = exampleContent.trimEnd();
  if (updatedExample) updatedExample += '\n\n# --- Newly added keys ---\n';

  missingKeys.forEach((key) => {
    let placeholder = 'your_' + key.toLowerCase().replace('vite_', '') + '_here';
    if (key.includes('URL')) placeholder = 'https://your-project.supabase.co';
    if (key.includes('KEY') || key.includes('TOKEN')) placeholder = 'your-secret-token-here';

    updatedExample += `${key}=${placeholder}\n`;
    console.log(`➕ 추가된 키: ${key}`);
  });

  fs.writeFileSync(EXAMPLE_PATH, updatedExample + '\n');
  console.log('\n✨ .env.example 동기화 완료!');
}

sync();
