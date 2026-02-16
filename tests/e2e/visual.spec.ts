import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  // Viewports to test
  const viewports = [
    { name: 'mobile', width: 375, height: 667 }, // iPhone SE
    { name: 'desktop', width: 1280, height: 800 },
  ];

  for (const viewport of viewports) {
    test.describe(`${viewport.name} viewport`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      test('Level Select Page should match snapshot', async ({ page }) => {
        test.setTimeout(60000); // 네트워크/인증 지연 시 여유 부여
        // Navigate to Level Select with valid params (math mountain, World1, 기초 category)
        await page.goto('/level-select?mountain=math&world=World1&category=기초');
        await page.waitForSelector('.level-select-container, .level-select-content', {
          timeout: 30000,
        });

        // Wait for key elements to ensure stability (최대 45초)
        await page.waitForSelector('.level-select-content', { timeout: 45000 });
        // level-map-container는 ClimbGraphic 컴포넌트 로드 확인
        await page.waitForSelector('.level-map-container', { timeout: 10000 });

        // Wait for any animations to settle
        await page.waitForTimeout(1000);

        // Take snapshot and compare
        // maxDiffPixelRatio: 동적 요소(진행도, 점수, 상태 아이콘) 변화 허용
        await expect(page).toHaveScreenshot(`level-select-${viewport.name}.png`, {
          maxDiffPixelRatio: 0.1, // 10% 허용 (진행도, 레벨 상태 등 동적)
          fullPage: true,
        });
      });

      test('Ranking Page should match snapshot', async ({ page }) => {
        await page.goto('/ranking');
        await page.waitForSelector('.ranking-list-container, .ranking-list', { timeout: 30000 });
        await page.waitForTimeout(1000);
        await expect(page).toHaveScreenshot(`ranking-${viewport.name}.png`, {
          fullPage: true,
          maxDiffPixels: 100, // 안티앨리어싱, 폰트 렌더링 등 미세 차이 허용
        });
      });
    });
  }
});
