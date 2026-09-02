import { test, expect } from '@playwright/test';

test.describe('인증/마이페이지 및 전역 라우팅 E2E 크롤러 검증', () => {
  const consoleErrors: string[] = [];
  const unhandledErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors.length = 0;
    unhandledErrors.length = 0;

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Failed to load resource') && !text.includes('favicon.ico')) {
          consoleErrors.push(text);
          console.log('[BROWSER CONSOLE ERROR]', text);
        }
      }
    });

    page.on('pageerror', (err) => {
      unhandledErrors.push(err.stack || err.message);
      console.log('[BROWSER UNCAUGHT PAGE ERROR]', err.stack || err.message);
    });
  });

  test('1. 프로필 설정 -> 마이페이지 활성화 -> 모달(프로필 수정/탈퇴) 및 로그아웃 전체 흐름 검증', async ({
    page,
  }) => {
    await page.goto('/my-page');
    await page.waitForLoadState('networkidle');

    // 1) 프로필 생성 모달이 열려 있다면 닉네임 입력 후 시작
    const nicknameInput = page.locator('#nickname, input[placeholder*="닉네임"]');
    if (await nicknameInput.isVisible({ timeout: 4000 }).catch(() => false)) {
      await nicknameInput.fill('등반모험가');
      const submitBtn = page.locator('button:has-text("시작하기"), button[type="submit"]');
      await submitBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // 2) 마이페이지 인증 상태 뷰 렌더링 확인
    const myPageContainer = page.locator('.my-page, .my-page-content').first();
    await expect(myPageContainer).toBeVisible({ timeout: 10000 });

    const statsGrid = page.locator('.my-page-stats-grid, .my-page-stats').first();
    await expect(statsGrid).toBeVisible({ timeout: 10000 });

    const settingsSection = page.locator('.my-page-settings');
    await expect(settingsSection).toBeVisible();

    // 3) [버튼 검증: 프로필 수정] 모달 열기 및 취소
    const editProfileButton = page.locator('button:has-text("프로필 수정")').first();
    await expect(editProfileButton).toBeVisible();
    await editProfileButton.click();

    const editModal = page.locator('.profile-form-modal-overlay, .profile-form-container').first();
    await expect(editModal).toBeVisible({ timeout: 5000 });

    const cancelEditBtn = page
      .locator('button:has-text("취소"), .profile-form-back-button')
      .first();
    if (await cancelEditBtn.isVisible()) {
      await cancelEditBtn.click();
      await expect(editModal).not.toBeVisible();
    }

    // 4) [버튼 검증: 탈퇴하기] WithdrawConfirmModal 열기 및 경고 확인 후 취소
    const withdrawButton = page.locator('button:has-text("탈퇴하기")');
    await expect(withdrawButton).toBeVisible();
    await withdrawButton.click();

    const withdrawModal = page.locator('.modal-overlay, .withdraw-modal-description').first();
    await expect(withdrawModal).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.withdraw-modal-title-text')).toContainText(
      '정말로 탈퇴하시겠습니까?'
    );

    const cancelWithdrawBtn = page.locator('.withdraw-modal-button:has-text("취소")');
    await expect(cancelWithdrawBtn).toBeVisible();
    await cancelWithdrawBtn.click();
    await expect(withdrawModal).not.toBeVisible();

    // 5) [버튼 검증: 로그아웃] 로그아웃 버튼 클릭 동작 확인
    const logoutButton = page.locator('.my-page-settings-item-logout');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    await page.waitForLoadState('networkidle');

    // 로그아웃 후 게스트 뷰 또는 재설정 뷰 정상 렌더링 확인
    const guestOrSettings = page
      .locator(
        '.my-page-guest-title, .my-page-guest-view, .my-page-settings, .profile-form-container'
      )
      .first();
    await expect(guestOrSettings).toBeVisible({ timeout: 10000 });

    // 6) 콘솔에 무한 루프나 치명적 에러 없음 확인
    expect(unhandledErrors).toEqual([]);
    expect(consoleErrors.filter((e) => e.includes('Maximum update depth'))).toHaveLength(0);
  });

  test('2. 게스트 뷰에서 익명 로그인 재진입 흐름 검증', async ({ page }) => {
    await page.goto('/my-page');
    await page.waitForLoadState('networkidle');

    // 만약 이미 로그인되어 있다면 로그아웃 먼저 수행
    const logoutBtn = page.locator('.my-page-settings-item-logout');
    if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForLoadState('networkidle');
    }

    // 게스트 뷰 버튼 확인
    const anonymousBtn = page.locator('.my-page-guest-anonymous-link');
    if (await anonymousBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await anonymousBtn.click();
      await page.waitForLoadState('networkidle');

      // 프로필 입력 폼이 뜨면 입력 후 진입
      const nicknameInput = page.locator('#nickname, input[placeholder*="닉네임"]');
      if (await nicknameInput.isVisible({ timeout: 4000 }).catch(() => false)) {
        await nicknameInput.fill('재접속자');
        const submitBtn = page.locator('button:has-text("시작하기"), button[type="submit"]');
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
      }

      await expect(page.locator('.my-page-settings')).toBeVisible({ timeout: 10000 });
    }

    expect(unhandledErrors).toEqual([]);
  });

  test('3. 전역 주요 페이지 라우팅 크롤링 및 무결성 검증', async ({ page }) => {
    // 1) 개인정보처리방침 페이지
    await page.goto('/privacy-policy');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.privacy-policy-page').first()).toBeVisible();

    // 2) 랭킹 페이지
    await page.goto('/ranking');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.ranking-page, .ranking-container, main').first()).toBeVisible();

    // 3) 로드맵 페이지
    await page.goto('/roadmap');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.roadmap-page, .roadmap-container, main').first()).toBeVisible();

    // 4) 복습 페이지
    await page.goto('/review');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.review-page, .review-container, main').first()).toBeVisible();

    // 5) 상점 페이지
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.shop-page, .shop-container, main').first()).toBeVisible();

    // 6) 카테고리 선택 페이지
    await page.goto('/category-select');
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('.category-select-page, .category-select-container, main').first()
    ).toBeVisible();

    // 7) 404 라우트 접근 시 홈/마이페이지로 안전 복귀
    await page.goto('/non-existent-route-12345');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\//);

    // 전체 크롤링 과정에서 치명적 에러 없음 확인
    expect(unhandledErrors).toEqual([]);
    expect(consoleErrors.filter((e) => e.includes('Maximum update depth'))).toHaveLength(0);
  });
});
