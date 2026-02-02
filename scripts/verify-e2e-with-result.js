#!/usr/bin/env node
/**
 * E2E 테스트 실행 후 결과를 JSON 파일로 저장.
 * 타임아웃 대응: 백그라운드 실행 시 완료 후 결과 파일을 읽어 검증 가능.
 *
 * 사용법: node scripts/verify-e2e-with-result.js [critical|full] [--output path]
 * 예: node scripts/verify-e2e-with-result.js critical
 *     → .e2e-result.json 에 exitCode, passed, failed, duration 저장
 */
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const REPORT_DIR = join(ROOT, 'reports');
const DEFAULT_OUTPUT = join(REPORT_DIR, '.e2e-result.json');

import { mkdirSync, existsSync } from 'fs';

if (!existsSync(REPORT_DIR)) {
  try {
    mkdirSync(REPORT_DIR);
  } catch (_) {
    // ignore
  }
}

async function getAvailablePort() {
  const { execSync } = await import('child_process');
  const out = execSync(`node "${join(ROOT, 'scripts/get-available-port.js')}"`, {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return parseInt(String(out).trim(), 10) || 5173;
}

async function main() {
  const mode = process.argv[2] || 'critical';
  const outputIdx = process.argv.indexOf('--output');
  const outputPath = outputIdx >= 0 ? process.argv[outputIdx + 1] : DEFAULT_OUTPUT;

  const port = await getAvailablePort();
  const env = { ...process.env, E2E_DEV_PORT: String(port) };

  const criticalFiles = [
    'tests/e2e/smoke.spec.ts',
    'tests/e2e/core-business-scenario.spec.ts',
    'tests/e2e/verify.spec.ts',
    'tests/e2e/network-diagnostic.spec.ts',
  ];
  const pwArgs =
    mode === 'critical'
      ? ['playwright', 'test', ...criticalFiles, '--reporter=json']
      : ['playwright', 'test', '--reporter=json'];

  const start = Date.now();
  const pw = spawn('npx', pwArgs, {
    cwd: ROOT,
    env,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  });

  let stdout = '';
  let _stderr = '';
  pw.stdout?.on('data', (d) => {
    stdout += d.toString();
  });
  pw.stderr?.on('data', (d) => {
    _stderr += d.toString();
  });

  const exitCode = await new Promise((resolve) => pw.on('exit', resolve));
  const duration = Date.now() - start;

  let passed = 0;
  let failed = 0;
  try {
    const json = JSON.parse(stdout);
    passed = json.stats?.expected ?? 0;
    failed = json.stats?.unexpected ?? 0;
  } catch {
    // reporter=list 시 JSON 아님
  }

  const result = {
    exitCode: exitCode ?? 1,
    passed,
    failed,
    duration,
    mode,
    timestamp: new Date().toISOString(),
  };

  writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  process.exit(exitCode ?? 0);
}

main().catch((err) => {
  console.error(err);
  writeFileSync(
    process.argv.indexOf('--output') >= 0
      ? process.argv[process.argv.indexOf('--output') + 1]
      : DEFAULT_OUTPUT,
    JSON.stringify(
      { exitCode: 1, error: String(err), timestamp: new Date().toISOString() },
      null,
      2
    ),
    'utf8'
  );
  process.exit(1);
});
