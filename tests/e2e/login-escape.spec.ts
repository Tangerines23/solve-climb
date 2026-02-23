import { test, expect } from '@playwright/test';

test.describe('로그인 탈출 방지 (Escape Prevention) 테스트', () => {
  // 전역 인증 상태(auth.setup.ts)를 무시하고 빈 상태에서 시작
  test.use({ storageState: { cookies: [], origins: [] } });

  test('프로필 미완성 상태에서 뒤로가기 시 홈으로 진입할 수 없어야 한다', async ({ page }) => {
    // 1. 로컬 스토리지 초기화 (로그아웃 상태 보장)
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // 2. my-page 로 접근
    await page.goto('/my-page');
    await page.waitForLoadState('networkidle');

    // 3. 상황에 따라 '익명 로그인하기' 버튼이 있는지 확인.
    // AuthStore에서 세션이 자동 생성되어 바로 '프로필 만들기'로 넘어갔을 수도 있음.
    const anonymousBtn = page.getByText('익명 로그인하기');
    if (await anonymousBtn.isVisible()) {
      await anonymousBtn.click();
    }

    // 4. 프로필 만들기 화면 진입 확인
    await expect(page.getByText('프로필 만들기')).toBeVisible();

    // 5. 이 상태에서 직접 '/' URL로 강제 이동 시도 (우회 시도)
    await page.goto('/');

    // 6. 리다이렉트로 인해 다시 /my-page 로 돌아오는지 확인
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/my-page');

    // 7. 헤더(홈 레이아웃)가 보이지 않아야 함 (숨김 처리 확인)
    const header = page.locator('.app-header'); // 혹은 헤더 식별자
    if ((await header.count()) > 0) {
      // Header가 DOM에 존재하더라도 CSS(display:none) 등 숨김 상태여야 함
      await expect(header).not.toBeVisible();
    }
  });
});
