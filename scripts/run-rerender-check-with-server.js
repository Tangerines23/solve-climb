#!/usr/bin/env node
/**
 * ⚡ Quiz Rerender Auditor - Auto Server Launcher
 *
 * check-rerender-cycle.js를 실행할 때 개발 서버(localhost:5173)가 없으면 자동으로 띄워줍니다.
 */

import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function getAvailablePort() {
  try {
    const out = execSync(`node "${join(ROOT, 'scripts/get-available-port.js')}"`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return parseInt(String(out).trim(), 10) || 5173;
  } catch (err) {
    console.warn('⚠️ Failed to get available port, falling back to 5173:', err.message);
    return 5173;
  }
}

const PORT = getAvailablePort();
const BASE_URL = `http://127.0.0.1:${PORT}`;
const WAIT_TIMEOUT_MS = 60000;
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

function killServer(proc) {
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /pid ${proc.pid} /t /f`, { stdio: 'ignore' });
    } catch (e) {}
  } else {
    proc.kill('SIGTERM');
  }
}

async function main() {
  try {
    await fetch(BASE_URL, { method: 'GET', signal: AbortSignal.timeout(2000) });
    console.log('✅ Dev server already running at', BASE_URL);
    runCheck(BASE_URL);
    return;
  } catch {}

  console.log('📡 Starting dev server for rerender check...');
  const devServer = spawn('npm', ['run', 'dev'], {
    cwd: ROOT,
    stdio: 'pipe',
    env: { ...process.env, DEV_PORT: String(PORT) },
    shell: true,
  });

  devServer.stdout?.on('data', (d) => {
    if (d.toString().includes('ready in')) {
      console.log('✨ Server is ready!');
    }
  });

  try {
    await waitForServer();
    runCheck(BASE_URL, devServer);
  } catch (err) {
    killServer(devServer);
    console.error('❌', err.message);
    process.exit(1);
  }
}

function runCheck(url, serverProc = null) {
  const check = spawn('node', ['scripts/check-rerender-cycle.js'], {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, VITE_URL: url },
    shell: true,
  });

  check.on('close', (code) => {
    if (serverProc) killServer(serverProc);
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
