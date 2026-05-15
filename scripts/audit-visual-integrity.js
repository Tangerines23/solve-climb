/**
 * 🎨 Visual Guardian Excellence - Visual Integrity Audit
 *
 * [검사 항목]
 * 1. Layout Overflow: 요소가 부모 범위를 벗어나는 현상 (Critical)
 * 2. Design System Violation: 정의되지 않은 색상/간격 사용 (Technical Debt)
 *
 * 사용: node scripts/audit-visual-integrity.js
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const viewports = [
  { name: 'Mobile', width: 393, height: 851 },
  { name: 'Desktop', width: 1280, height: 800 },
];

const pagesToCheck = [
  { name: 'Home', url: (base) => `${base}/` },
  { name: 'Category Select', url: (base) => `${base}/category-select` },
  { name: 'Level Select', url: (base) => `${base}/level-select` },
  { name: 'Quiz', url: (base) => `${base}/quiz` },
  { name: 'Result', url: (base) => `${base}/result` },
  { name: 'Shop', url: (base) => `${base}/shop` },
  { name: 'My Page', url: (base) => `${base}/my-page` },
];

async function collectVisualData(page) {
  // 스크롤을 통해 동적 요소 로드 및 검사 유도
  await page.evaluate(async () => {
    const distance = 500;
    const totalHeight = document.body.scrollHeight;
    let scrolled = 0;
    while (scrolled < totalHeight) {
      window.scrollBy(0, distance);
      scrolled += distance;
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(2000); // VG 스캔 대기

  return page.evaluate(() => {
    return {
      layoutErrors: window.__LAYOUT_ERRORS__ || [],
      designViolations: window.__DESIGN_VIOLATIONS__ || [],
    };
  });
}

(async () => {
  console.log('🛡️  Visual Guardian: Visual Integrity Audit Started...\n');

  let BASE_URL = process.env.VITE_URL || 'http://localhost:5173';
  const browser = await chromium.launch();
  const reportEntries = [];

  try {
    for (const vp of viewports) {
      console.log(`📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });

      for (const pageInfo of pagesToCheck) {
        const page = await context.newPage();
        try {
          // Visual Guardian 강제 활성화 및 인텐시브 모드 설정
          await page.addInitScript(() => {
            window.__ENABLE_VISUAL_GUARDIAN__ = true;
            window.__VG_INTENSIVE_MODE__ = true;
          });

          await page.goto(pageInfo.url(BASE_URL), { waitUntil: 'networkidle', timeout: 30000 });

          const data = await collectVisualData(page);

          reportEntries.push({
            viewport: vp.name,
            page: pageInfo.name,
            url: page.url(),
            ...data,
          });

          const totalIssues = data.layoutErrors.length + data.designViolations.length;
          if (totalIssues > 0) {
            console.log(
              `  📍 ${pageInfo.name}: Layout(${data.layoutErrors.length}), Design(${data.designViolations.length})`
            );
          } else {
            console.log(`  ✅ ${pageInfo.name}: Clean`);
          }
        } catch (err) {
          console.error(`  ❌ ${pageInfo.name} failed:`, err.message);
        } finally {
          await page.close();
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  // 보고서 생성
  const totalLayoutErrors = reportEntries.reduce((acc, curr) => acc + curr.layoutErrors.length, 0);
  const totalDesignViolations = reportEntries.reduce(
    (acc, curr) => acc + curr.designViolations.length,
    0
  );

  // 도메인별 통계
  const statsByPage = reportEntries.map((entry) => ({
    page: entry.page,
    viewport: entry.viewport,
    layoutErrors: entry.layoutErrors.length,
    designViolations: entry.designViolations.length,
    score: Math.max(
      0,
      100 - entry.layoutErrors.length * 10 - entry.designViolations.length * 1
    ).toFixed(1),
  }));

  // 건강 점수 계산 (100점 만점)
  // 레이아웃 오류는 크리티컬하므로 감점이 큼
  const layoutPenalty = totalLayoutErrors * 10;
  const designPenalty = totalDesignViolations * 0.2;
  const healthScore = Math.max(0, 100 - layoutPenalty - designPenalty).toFixed(1);

  const report = {
    generatedAt: new Date().toISOString(),
    healthScore: parseFloat(healthScore),
    summary: {
      totalLayoutErrors,
      totalDesignViolations,
      pageCount: pagesToCheck.length,
      averageScore: (
        statsByPage.reduce((acc, s) => acc + parseFloat(s.score), 0) / statsByPage.length
      ).toFixed(1),
    },
    pageStats: statsByPage,
    details: reportEntries,
  };

  const reportDir = join(process.cwd(), 'reports');
  mkdirSync(reportDir, { recursive: true });
  const reportPath = join(reportDir, 'visual-integrity-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('\n' + '='.repeat(50));
  console.log(`🛡️  Visual Guardian Audit Result`);
  console.log(`📊 Total Health Score: ${healthScore}/100`);
  console.log(`🚫 Layout Errors: ${totalLayoutErrors} (Critical)`);
  console.log(`⚠️  Design Violations: ${totalDesignViolations}`);
  console.log('='.repeat(50));

  console.log('\n📍 Breakdown by Page:');
  statsByPage.forEach((s) => {
    const status = parseFloat(s.score) > 90 ? '✅' : parseFloat(s.score) > 70 ? '⚠️' : '❌';
    console.log(`  ${status} ${s.page.padEnd(20)} [${s.viewport}] Score: ${s.score}`);
  });

  console.log(`\n📄 Detailed report: ${reportPath}\n`);

  if (totalLayoutErrors > 0) {
    process.exitCode = 1;
  }
})();
