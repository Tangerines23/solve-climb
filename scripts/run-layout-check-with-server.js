#!/usr/bin/env node
/**
 * 레이아웃 검사 시 개발 서버가 없으면 자동 기동 후 검사 실행.
 * CI(e2e-visual-layout)에서 check:layout:deep 실행 시 서버가 없어 실패하는 문제 해결용.
 *
 * 사용: node scripts/run-layout-check-with-server.js [--deep]
 *      npm run check:layout:with-server [-- --deep]
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;
const WAIT_TIMEOUT_MS = 120000; // 2분
const POLL_INTERVAL_MS = 1000;

function waitForServer() {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryFetch = () => {
      fetch(BASE_URL, { method: 'GET', signal: AbortSignal.timeout(3000) })
        .then(() => resolve())
        .catch(() => {
          if (Date.now() - start > WAIT_TIMEOUT_MS) {
            reject(new Error(`Server did not become ready within ${WAIT_TIMEOUT_MS / 1000}s`));
            return;
          }
          setTimeout(tryFetch, POLL_INTERVAL_MS);
        });
    };
    tryFetch();
  });
}

async function main() {
  const args = process.argv.slice(2); // e.g. ['--deep']

  // 이미 서버가 떠 있는지 확인
  try {
    await fetch(BASE_URL, { method: 'GET', signal: AbortSignal.timeout(2000) });
    console.log('✅ Dev server already running at', BASE_URL);
    const layout = spawn('node', ['scripts/check-layout-standalone.js', ...args], {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, VITE_URL: BASE_URL },
      shell: true,
    });
    layout.on('close', (code) => process.exit(code ?? 0));
    return;
  } catch {
    // 서버 없음 → 기동 후 검사
  }

  console.log('📡 Starting dev server for layout check...');
  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: ROOT,
    stdio: 'pipe',
    env: { ...process.env, DEV_PORT: String(PORT) },
    shell: true,
  });

  devServer.stderr?.on('data', (d) => process.stderr.write(d));
  devServer.stdout?.on('data', (d) => process.stdout.write(d));

  let resolved = false;
  devServer.on('error', (err) => {
    if (!resolved) {
      resolved = true;
      console.error('❌ Failed to start dev server:', err.message);
      process.exit(1);
    }
  });

  devServer.on('exit', (code) => {
    if (!resolved && code !== 0 && code !== null) {
      resolved = true;
      console.error('❌ Dev server exited with code', code);
      process.exit(1);
    }
  });

  try {
    await waitForServer();
    console.log('✅ Dev server ready at', BASE_URL);
  } catch (err) {
    devServer.kill('SIGTERM');
    console.error('❌', err.message);
    process.exit(1);
  }

  const layoutArgs = ['scripts/check-layout-standalone.js', ...args];
  const layout = spawn('node', layoutArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, VITE_URL: BASE_URL },
    shell: true,
  });

  layout.on('close', (code) => {
    devServer.kill('SIGTERM');
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
