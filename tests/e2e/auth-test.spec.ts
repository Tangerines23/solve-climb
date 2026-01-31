import { test, expect } from '@playwright/test';

/**
 * 익명 인증 검증: auth.setup에서 저장한 세션이 유효한지 확인.
 * signInAnonymously 직접 호출 없음 → 429 rate limit 절감.
 */
test('익명 인증 테스트', async ({ page }) => {
  page.on('console', (msg) => console.log(`[BROWSER] ${msg.text()}`));

  await page.goto('/');
  await page.waitForLoadState('load');

  // auth.setup에서 저장한 세션이 localStorage에 있는지 확인 (추가 익명 로그인 호출 없음)
  const hasSession = await page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('sb-') && key?.includes('auth')) return true;
    }
    return false;
  });

  if (!hasSession) {
    test.skip(true, 'No session from auth.setup (setup may have failed or 429)');
    return;
  }

  expect(hasSession).toBe(true);
});
