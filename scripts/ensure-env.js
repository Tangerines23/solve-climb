#!/usr/bin/env node
/**
 * .env 없을 때만 .env.example을 복사 (idempotent).
 * postinstall에서 호출 → npm install만 해도 .env 파일이 생김.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const ENV_EXAMPLE_PATH = path.join(ROOT, '.env.example');

function main() {
  if (fs.existsSync(ENV_PATH)) return;
  if (!fs.existsSync(ENV_EXAMPLE_PATH)) return;
  fs.copyFileSync(ENV_EXAMPLE_PATH, ENV_PATH);
  console.log('✅ .env 생성됨 (.env.example 복사). 값은 직접 설정하세요.');
}
main();
