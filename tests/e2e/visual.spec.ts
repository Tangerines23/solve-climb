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
        // Navigate to Level Select with standard params
        await page.goto('/level-select?mountain=Seoraksan&world=World1&category=arithmetic');

        // Wait for key elements to ensure stability
        await page.waitForSelector('.level-select-content');
        await page.waitForSelector('.climb-graphic-container');

        // Wait for any animations to settle
        await page.waitForTimeout(1000);

        // Take snapshot and compare
        // maxDiffPixels allows for tiny rendering variations (anti-aliasing)
        await expect(page).toHaveScreenshot(`level-select-${viewport.name}.png`, {
          maxDiffPixels: 100,
          fullPage: true,
        });
      });

      test('Ranking Page should match snapshot', async ({ page }) => {
        await page.goto('/ranking');
        await page.waitForSelector('.ranking-list');
        await page.waitForTimeout(1000);
        await expect(page).toHaveScreenshot(`ranking-${viewport.name}.png`, {
          fullPage: true,
        });
      });
    });
  }
});
