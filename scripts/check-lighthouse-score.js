#!/usr/bin/env node
/**
 * Lighthouse 점수 검증 (LHCI 대체). dist를 vite preview로 서빙한 뒤 Lighthouse를 실행하고
 * performance/accessibility/best-practices/seo 임계값을 검사합니다.
 *
 * 사용: node scripts/check-lighthouse-score.js
 *      npm run check:score
 *
 * 요구: ./dist 가 존재해야 함 (npm run build 후 실행).
 */

import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PORT = 8080;
const BASE_URL = `http://localhost:${PORT}/`;
const WAIT_TIMEOUT_MS = 60000;
const POLL_INTERVAL_MS = 500;

// lighthouserc.json과 동일한 임계값 (회귀 방지)
const THRESHOLDS = {
  performance: 0.7,
  accessibility: 0.9,
  'best-practices': 0.9,
  seo: 0.9,
};

function waitForServer() {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryFetch = () => {
      fetch(BASE_URL, { method: 'GET', signal: AbortSignal.timeout(5000) })
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
  let previewProcess = null;
  let chrome = null;

  const cleanup = () => {
    if (previewProcess) {
      previewProcess.kill('SIGTERM');
      previewProcess = null;
    }
    if (chrome) {
      chrome.kill().catch(() => {});
      chrome = null;
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(143);
  });

  const distDir = join(ROOT, 'dist');
  if (!existsSync(distDir)) {
    console.error('❌ ./dist not found. Run "npm run build" first.');
    process.exit(1);
  }

  console.log('📡 Starting vite preview for Lighthouse audit...');
  previewProcess = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: true,
  });

  previewProcess.stderr?.on('data', (d) => process.stderr.write(d));
  previewProcess.stdout?.on('data', (d) => process.stdout.write(d));

  previewProcess.on('error', (err) => {
    console.error('❌ Failed to start vite preview:', err.message);
    cleanup();
    process.exit(1);
  });

  previewProcess.on('exit', (code) => {
    if (code !== 0 && code !== null && previewProcess) {
      console.error('❌ vite preview exited with code', code);
    }
  });

  try {
    await waitForServer();
    console.log('✅ Preview ready at', BASE_URL);
  } catch (err) {
    console.error('❌', err.message);
    cleanup();
    process.exit(1);
  }

  const { launch: launchChrome } = await import('chrome-launcher');
  const lighthouse = (await import('lighthouse')).default;

  try {
    chrome = await launchChrome({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
    });
  } catch (err) {
    console.error('❌ Chrome launch failed:', err.message);
    cleanup();
    process.exit(1);
  }

  const options = {
    port: chrome.port,
    logLevel: 'silent',
    output: 'json',
  };

  let runnerResult;
  try {
    runnerResult = await lighthouse(BASE_URL, options);
  } catch (err) {
    console.error('❌ Lighthouse run failed:', err.message);
    cleanup();
    process.exit(1);
  }

  await chrome.kill();
  chrome = null;
  previewProcess.kill('SIGTERM');
  previewProcess = null;

  const lhr = runnerResult.lhr;
  if (!lhr || !lhr.categories) {
    console.error('❌ Invalid Lighthouse result (no categories).');
    process.exit(1);
  }

  // 리포트 저장 (디버깅용)
  const reportDir = join(ROOT, 'reports', 'logs');
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }
  const reportPath = join(reportDir, 'lighthouse-report.json');
  writeFileSync(reportPath, JSON.stringify(lhr, null, 2));
  console.log(`\n📄 Lighthouse report saved to ${reportPath}`);

  // 상세 감사 정보 출력 (실패한 항목들)
  console.log('\n🔍 Detailed Audit Findings:');
  const criticalAudits = [
    'largest-contentful-paint',
    'total-blocking-time',
    'cumulative-layout-shift',
    'speed-index',
    'first-contentful-paint',
  ];
  for (const auditId of criticalAudits) {
    const audit = lhr.audits[auditId];
    if (audit) {
      console.log(
        `   ${audit.title}: ${audit.displayValue} (${audit.score >= 0.9 ? '✅' : audit.score >= 0.5 ? '⚠️' : '❌'})`
      );
    }
  }

  // 접근성 및 기타 실패 항목
  const failedAudits = Object.values(lhr.audits).filter(
    (a) => a.score !== null && a.score < 0.9 && a.id !== 'is-on-https'
  );
  if (failedAudits.length > 0) {
    console.log('\n❌ Major Audit Failures:');
    failedAudits.slice(0, 10).forEach((a) => {
      console.log(`   [${a.id}] ${a.title}: ${a.score === 0 ? 'FAIL' : a.displayValue || a.score}`);
    });
  }

  const failed = [];
  for (const [categoryId, minScore] of Object.entries(THRESHOLDS)) {
    const cat = lhr.categories[categoryId];
    const score = cat?.score ?? -1;
    const label = score >= 0 ? `${(score * 100).toFixed(0)}` : 'N/A';
    if (score < minScore) {
      failed.push({ id: categoryId, score, minScore, label });
    }
    console.log(`  ${categoryId}: ${label} (min ${minScore * 100})`);
  }

  if (failed.length > 0) {
    console.error('\n❌ Lighthouse score assertions failed:');
    for (const { id, label, minScore } of failed) {
      console.error(`   ${id}: ${label} < ${minScore * 100}`);
    }
    process.exit(1);
  }

  console.log('\n✅ Lighthouse score check passed.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
