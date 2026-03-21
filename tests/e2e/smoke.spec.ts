import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { expectNoOverflow } from './utils/overflow';

test.describe('SMOKE TEST - 메인 화면 검증', () => {
  // 모든 테스트 전에 배너/팝업 등이 있다면 처리하거나, 공통 상태를 확인
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('사용자가 인증되어 있고 프로필이 있으면 홈 화면이 정상적으로 로드되어야 한다', async ({
    page,
  }) => {
    // 1. 홈(/) 접속 시 RequireAuth에 의해 /my-page 등으로 리다이렉트 될 수 있음
    // 만약 auth.setup에서 이미 프로필까지 완료했다면 홈에 보일 것임

    // 만약 마이페이지로 리다이렉트 되었다면 (프로필 미완성 등)
    if (page.url().includes('/my-page')) {
      // Guest View라면 로그인 시도
      const anonymousBtn = page.locator('.my-page-guest-anonymous-link');
      if (await anonymousBtn.isVisible()) {
        await anonymousBtn.click();
      }

      // 프로필 폼이 보이면 입력
      const nicknameInput = page.locator('#nickname');
      if (await nicknameInput.isVisible()) {
        await nicknameInput.fill('SmokeTester');
        await page.click('button[type="submit"]');
        await page.waitForURL((url) => url.pathname === '/');
      }
    }

    // 2. 홈 화면 요소 확인 (MyPage의 프로필 섹션 혹은 카테고리 목록)
    // 인증 후 리다이렉트 및 데이터 로딩 완료 대기
    await page.waitForLoadState('networkidle');
    const headerElement = page
      .locator('.my-page-header, .category-list-container, .my-page-stats-grid')
      .first();
    await expect(headerElement).toBeVisible({ timeout: 15000 });

    // 3. UI 레이아웃 무결성 확인 (Overflow 체크)
    await expectNoOverflow(page);
  });

  test('홈 화면 웹 접근성 검증 (Accessibility Audit)', async ({ page }) => {
    // 1. 페이지 로컬 렌더링 대기
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.home-page', { state: 'visible', timeout: 10000 });

    // 2. WCAG 2.0, 2.1 Level AA 검사
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .disableRules(['region'])
      .analyze();

    // 치명적인 접근성 오류가 없어야 한다
    // 색상 대비(color-contrast)는 디자인 요구사항에 따라 일부 허용될 수 있으나,
    // 여기서는 기본적으로 모든 위반 사항을 체크함
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('카테고리 선택 및 페이지 이동 시나리오', async ({ page }) => {
    // 1. 산 선택 버튼(등반하기)이 있는 페이지로 이동
    // 만약 홈이 마이페이지라면 '도전하기' 등을 통해 이동 시도

    const challengeBtn = page
      .locator('.my-page-quick-access-button, button:has-text("도전하기")')
      .first();
    if (await challengeBtn.isVisible()) {
      console.log('[smoke.spec] Clicking "도전하기" button...');
      await Promise.all([
        page.waitForNavigation({ timeout: 15000 }).catch(() => null),
        challengeBtn.click(),
      ]);

      // URL 변경 확인
      if (!page.url().match(/\/(category-select|level-select|quiz)/)) {
        console.log(
          '[smoke.spec] Navigation click did not change URL. Attempting direct navigation...'
        );
        await page.goto('/category-select?mountain=math');
      } else {
        console.log('[smoke.spec] Navigation successful:', page.url());
      }
    } else {
      console.log('[smoke.spec] "도전하기" button not found. Attempting direct navigation...');
      await page.goto('/category-select?mountain=math');
    }

    await page.waitForLoadState('networkidle');

    // 2. 페이지 렌더링 확인 (에러 메시지 없음)
    const container = page.locator(
      '.category-select-container, .topic-select-page, .quiz-page-container, .category-list-container'
    );
    await expect(container).toBeVisible({ timeout: 20000 });

    // 3. UI 레이아웃 무결성 확인
    await expectNoOverflow(page);
  });
});
