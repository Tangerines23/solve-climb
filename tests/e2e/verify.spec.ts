import { test, expect } from '@playwright/test';
test('simple test', async ({ page }) => {
  await page.goto('https://example.com');
  const title = await page.title();
  console.log('Title:', title);
  expect(title).toBe('Example Domain');
});
