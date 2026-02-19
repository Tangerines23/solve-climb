/**
 * 📊 Visual Guardian (VG) - Layout Analysis & Reporting
 *
 * [분석 모드]
 * - 오버플로우가 발생해도 중단하지 않고 모든 페이지를 전수 조사합니다.
 * - 결과는 'reports/layout-overflow-report.json'에 저장됩니다.
 * - 대규모 리팩토링 후 전체적인 레이아웃 건강 상태를 진단할 때 유용합니다.
 *
 * 사용: npm run check:layout:analyze (개발 서버 선행 실행 필요)
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const viewports = [
  { name: 'Mobile (Pixel 5)', width: 393, height: 851 },
  { name: 'Desktop (Standard)', width: 1280, height: 800 },
];

const pagesToCheck = [
  { name: 'Home', url: (base) => `${base}/` },
  { name: 'Category Select', url: (base) => `${base}/category-select` },
  { name: 'Level Select', url: (base) => `${base}/level-select` },
  { name: 'Quiz', url: (base) => `${base}/quiz` },
  { name: 'Result', url: (base) => `${base}/result` },
  { name: 'Shop', url: (base) => `${base}/shop` },
  { name: 'My Page', url: (base) => `${base}/my-page` },
  { name: 'Roadmap', url: (base) => `${base}/roadmap` },
  { name: 'Ranking', url: (base) => `${base}/ranking` },
  { name: 'Notifications', url: (base) => `${base}/notifications` },
  // Shop 내 배낭 탭 클릭 후 상태도 수집
  {
    name: 'Shop (내 배낭 탭)',
    url: (base) => `${base}/shop`,
    afterLoad: async (page) => {
      const tab = page.locator('button:has-text("내 배낭")');
      if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tab.click();
        await page.waitForTimeout(1500);
      }
    },
  },
];

async function collectOverflowErrors(page) {
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
  await page.waitForTimeout(1500);

  return page.evaluate(() => {
    const errors = window.__LAYOUT_ERRORS__ || [];
    return errors.map((e) => ({
      element: e.element,
      className: e.className,
      path: e.path,
      error: e.error,
      details: e.details,
    }));
  });
}

(async () => {
  console.log('🔍 Visual Guardian overflow 전수 분석 시작...\n');

  let BASE_URL = process.env.VITE_URL;
  if (!BASE_URL) {
    const browser = await chromium.launch();
    const ports = [5173, 5174, 3000];
    for (const port of ports) {
      try {
        const p = await browser.newPage();
        await p.goto(`http://localhost:${port}`, { timeout: 2000 });
        await p.close();
        BASE_URL = `http://localhost:${port}`;
        break;
      } catch {
        /**/
      }
    }
    await browser.close();
  }
  if (!BASE_URL) BASE_URL = 'http://localhost:5173';
  console.log(`🌐 Base URL: ${BASE_URL}\n`);

  const browser = await chromium.launch();
  const allEntries = [];
  const pathCount = new Map(); // path -> count
  const pagePathSet = new Map(); // pageName -> Set(path)

  try {
    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
      });

      for (const pageInfo of pagesToCheck) {
        const page = await context.newPage();
        try {
          await page.goto(pageInfo.url(BASE_URL), { waitUntil: 'load', timeout: 30000 });
          await page.addInitScript(() => {
            window.__ENABLE_VISUAL_GUARDIAN__ = true;
            window.__VG_INTENSIVE_MODE__ = true;
          });
          await page.reload({ waitUntil: 'load' });

          if (pageInfo.afterLoad) {
            await pageInfo.afterLoad(page).catch(() => {});
          }

          const errors = await collectOverflowErrors(page);
          const pageKey = `${vp.name} / ${pageInfo.name}`;

          for (const e of errors) {
            const path = e.path || `${e.element}.${(e.className || '').split(' ').join('.')}`;
            allEntries.push({
              viewport: vp.name,
              page: pageInfo.name,
              path,
              element: e.element,
              className: e.className,
              error: e.error,
              details: e.details,
            });
            pathCount.set(path, (pathCount.get(path) || 0) + 1);
            if (!pagePathSet.has(pageInfo.name)) pagePathSet.set(pageInfo.name, new Set());
            pagePathSet.get(pageInfo.name).add(path);
          }

          if (errors.length > 0) {
            console.log(`  📍 ${pageKey}: ${errors.length}건`);
          }
        } finally {
          await page.close();
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }

  // 요약
  const total = allEntries.length;
  const uniquePaths = pathCount.size;
  console.log('\n========== 요약 ==========');
  console.log(`총 overflow 감지 건수: ${total}`);
  console.log(`고유 셀렉터(path) 종류: ${uniquePaths}\n`);

  console.log('========== 페이지별 고유 path 수 ==========');
  const byPage = new Map();
  for (const e of allEntries) {
    if (!byPage.has(e.page)) byPage.set(e.page, new Set());
    byPage.get(e.page).add(e.path);
  }
  for (const [page, set] of byPage) {
    if (set.size > 0) console.log(`  ${page}: ${set.size}종`);
  }

  console.log('\n========== path별 감지 횟수 (많은 순, 상위 40) ==========');
  const sorted = [...pathCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40);
  for (const [path, count] of sorted) {
    console.log(`  ${count}\t${path}`);
  }

  // 보고서 파일
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalOverflowCount: total,
    uniquePathCount: uniquePaths,
    byPage: Object.fromEntries([...byPage.entries()].map(([p, set]) => [p, [...set]])),
    pathCount: Object.fromEntries(pathCount),
    entries: allEntries,
  };

  const reportDir = join(process.cwd(), 'reports');
  mkdirSync(reportDir, { recursive: true });
  const reportPath = join(reportDir, 'layout-overflow-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 상세 보고서: ${reportPath}`);

  if (total > 0) {
    process.exitCode = 1;
  }
})();
