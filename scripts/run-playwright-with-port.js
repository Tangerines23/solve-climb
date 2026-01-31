#!/usr/bin/env node
/**
 * 사용 가능한 포트를 찾은 뒤 Playwright를 실행합니다.
 * 포트 충돌 시 자동으로 다른 포트(5174, 5175...)를 사용합니다.
 * 사용법: node scripts/run-playwright-with-port.js [playwright args...]
 */
import { execSync, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function getAvailablePort() {
  const out = execSync(`node "${join(ROOT, 'scripts/get-available-port.js')}"`, {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return parseInt(String(out).trim(), 10) || 5173;
}

const port = getAvailablePort();
const env = { ...process.env, E2E_DEV_PORT: String(port) };

const pw = spawn('npx', ['playwright', 'test', ...process.argv.slice(2)], {
  cwd: ROOT,
  env,
  stdio: 'inherit',
  shell: true,
});

pw.on('exit', (code) => process.exit(code ?? 0));
