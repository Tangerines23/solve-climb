import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('♿ Accessibility Audit', () => {
  test('Main pages should have no automatically detectable a11y violations', async ({ page }) => {
    const pages = ['/', '/shop', '/ranking', '/settings'];

    for (const path of pages) {
      console.log(`[A11Y] Auditing ${path}...`);
      await page.goto(path);
      await page.waitForLoadState('networkidle');

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
