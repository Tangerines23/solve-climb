import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('♿ Accessibility Audit', () => {
  test('Main pages should have no automatically detectable a11y violations', async ({ page }) => {
    const pages = ['/', '/shop', '/ranking', '/settings'];

    for (const path of pages) {
      console.log(`[A11Y] Auditing ${path}...`);

      // Debug: Log browser console and errors
      page.on('console', (msg) => console.log(`[Browser Console] ${msg.text()}`));
      page.on('pageerror', (err) => console.log(`[Browser Error] ${err.message}`));

      await page.goto(path);

      // Wait for Initial Loader to disappear
      try {
        await page.waitForSelector('.global-loader', { state: 'detached', timeout: 10000 });
      } catch (_e) {
        console.log(`[A11Y] Global loader stuck on ${path}!`);
        // Log current HTML to see what's rendered
        const bodyHtml = await page.evaluate(() => document.body.innerHTML);
        console.log(`[HTML Dump] ${bodyHtml}`);
      }

      // networkidle hangs due to Supabase realtime subscriptions
      await page.waitForSelector('main', { timeout: 30000 });
      await page.waitForTimeout(2000); // 렌더링 안정을 위한 대기 시간 증가

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      if (accessibilityScanResults.violations.length > 0) {
        console.error(
          `[A11Y] Violations found on ${path}:`,
          JSON.stringify(accessibilityScanResults.violations, null, 2)
        );
      }

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });
});
