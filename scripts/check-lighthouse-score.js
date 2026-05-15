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

// 엄격한 프로덕션 임계값 (CI 환경 노이즈 고려하여 performance 0.65로 조정)
const THRESHOLDS = {
  performance: 0.65,
  accessibility: 0.95,
  'best-practices': 0.95,
  seo: 1.0,
};

// 검사할 핵심 페이지들
const TARGET_PAGES = [
  { name: 'Home', path: '/' },
  { name: 'Quiz', path: '/quiz' },
  { name: 'Profile', path: '/my-page' },
];

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

async function runAudit(pagePath, pageName, chromePort) {
  const targetUrl = `${BASE_URL.replace(/\/$/, '')}${pagePath}`;
  console.log(`\n🚀 Auditing ${pageName} (${targetUrl})...`);

  const lighthouse = (await import('lighthouse')).default;

  const options = {
    port: chromePort,
    logLevel: 'silent',
    output: 'json',
  };

  let runnerResult;
  const MAX_RETRIES = 3;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      runnerResult = await lighthouse(targetUrl, options);
      if (runnerResult) break;
    } catch (err) {
      console.error(`⚠️ Lighthouse run failed (Attempt ${i + 1}/${MAX_RETRIES}):`, err.message);
      if (i === MAX_RETRIES - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const lhr = runnerResult.lhr;
  if (!lhr || !lhr.categories) {
    console.error('❌ Invalid Lighthouse result (no categories).');
    return false;
  }

  // 리포트 저장 (디버깅용)
  const reportDir = join(ROOT, 'reports', 'logs');
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }
  const reportPath = join(reportDir, `lighthouse-report-${pageName.toLowerCase()}.json`);
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

  console.log('\n📊 Lighthouse Audit Summary:');
  console.log('='.repeat(50));
  console.log(
    `${'Category'.padEnd(20)} | ${'Score'.padEnd(10)} | ${'Target'.padEnd(10)} | ${'Status'}`
  );
  console.log('-'.repeat(50));

  const failed = [];
  for (const [categoryId, minScore] of Object.entries(THRESHOLDS)) {
    const cat = lhr.categories[categoryId];
    const score = cat?.score ?? -1;
    const label = score >= 0 ? `${(score * 100).toFixed(0)}` : 'N/A';
    const status =
      score >= minScore ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;

    console.log(
      `${categoryId.padEnd(20)} | ${label.padEnd(10)} | ${(minScore * 100).toString().padEnd(10)} | ${status}`
    );

    if (score < minScore) {
      failed.push({ id: categoryId, score, minScore, label });
    }
  }
  console.log('='.repeat(50));

  if (failed.length > 0) {
    console.error(
      `\n${colors.red}❌ Lighthouse score assertions failed for ${targetUrl}${colors.reset}`
    );
    return false;
  }

  console.log(`\n${colors.green}✅ Lighthouse score check passed for ${targetUrl}${colors.reset}`);
  return true;
}

const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  reset: '\x1b[0m',
};

async function runAll() {
  let previewProcess = null;
  let chrome = null;

  const cleanup = async () => {
    if (chrome && typeof chrome.kill === 'function') {
      try {
        await chrome.kill();
      } catch (e) {}
      chrome = null;
    }
    if (previewProcess) {
      previewProcess.kill('SIGTERM');
      previewProcess = null;
    }
  };

  process.on('SIGINT', async () => {
    await cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', async () => {
    await cleanup();
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

  try {
    await waitForServer();
    console.log('✅ Preview server ready.');

    const { launch: launchChrome } = await import('chrome-launcher');
    chrome = await launchChrome({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
    });

    let allPassed = true;
    for (const page of TARGET_PAGES) {
      const passed = await runAudit(page.path, page.name, chrome.port);
      if (!passed) allPassed = false;
    }

    await cleanup();
    if (!allPassed) {
      console.error(
        `\n${colors.red}❌ Some Lighthouse audits failed. Check the summary above.${colors.reset}`
      );
      process.exit(1);
    }
    console.log(`\n${colors.green}✨ All Lighthouse audits passed successfully!${colors.reset}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Audit process failed:', err.message);
    await cleanup();
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
