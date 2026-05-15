import { test, expect } from '@playwright/test';

/**
 * 프로젝트 전체 주요 페이지의 시각적 일관성을 검증하는 테스트 스위트입니다.
 * 디자인 시스템(TDS) 및 CSS 변수 변경 시 의도치 않은 UI 깨짐을 방지합니다.
 */
test.describe('Visual Regression Testing (VRT) - UI 일관성 검증', () => {
  test.beforeEach(async ({ page }) => {
    // 모든 테스트에 공통적으로 적용할 스타일 (애니메이션 제거 등)
    await page.addInitScript(() => {
      // Zustand 스토어 설정을 강제로 주입하여 애니메이션 및 정적 모드 고정
      const settings = {
        state: {
          hapticEnabled: false,
          keyboardType: 'custom',
          animationEnabled: false,
          staticMode: true,
          _hasHydrated: true,
        },
        version: 0,
      };
      window.localStorage.setItem('solve-climb-settings', JSON.stringify(settings));

      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after { 
          animation-duration: 0s !important; 
          transition-duration: 0s !important; 
          animation-delay: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });
  });

  test('홈 화면 (Home Page)', async ({ page }) => {
    await page.goto('/');
    // 홈 화면 진입 시 스테미나 게이지 등 인증 후 요소가 보일 때까지 대기
    await page.waitForSelector('.home-page', { state: 'visible', timeout: 30000 });
    // 로딩 오버레이가 완전히 사라질 때까지 대기
    await page.waitForSelector('.loading-overlay', { state: 'hidden', timeout: 15000 });
    await page.waitForSelector('.stamina-gauge-container', { state: 'visible', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // VRT 안정화를 위한 전역 스타일 주입 (애니메이션 및 일시적 UI 제거)
    await page.addStyleTag({
      content: `
        .age-rating-overlay, .loading-overlay, .daily-reward-overlay, .confetti-container { display: none !important; }
      `,
    });

    // 추가 렌더링 안정화 대기
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('vrt-home-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
      mask: [
        page.locator('.dynamic-stats'),
        page.locator('.home-stat-value'),
        page.locator('.profile-info'),
        page.locator('.stamina-gauge'),
        page.locator('.status-rank'),
        page.locator('.status-info'),
        page.locator('.challenge-description'),
        page.locator('.challenge-stats'),
      ],
    });
  });

  test('마이페이지 (My Page)', async ({ page }) => {
    await page.goto('/my-page');
    await page.waitForSelector('.my-page-header', { state: 'visible', timeout: 30000 });
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('vrt-my-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.15,
      mask: [
        page.locator('.my-page-nickname'),
        page.locator('.my-page-email'),
        page.locator('.my-page-tier-badge'),
        page.locator('.my-page-streak-badge'),
        page.locator('.my-page-mastery-value'),
        page.locator('.my-page-stat-value'),
        page.locator('.profile-avatar-container'),
        page.locator('.my-page-quick-access'),
      ],
    });
  });

  test('상점 페이지 (Shop Page)', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForSelector('.shop-page', { state: 'visible', timeout: 30000 });
    // 상점 아이템이 실제로 로드되어 카드 형태로 보일 때까지 대기 (로딩 메시지 방지)
    await page.waitForSelector('.item-card', { state: 'visible', timeout: 20000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('vrt-shop-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    });
  });

  test('퀴즈 종료 결과 화면 (Result Page Snippet)', async ({ page }) => {
    const category = encodeURIComponent('기초');
    const url = `/result?score=1000&correct=10&world=World1&category=${category}&level=1&mode=time-attack`;
    await page.goto(url);
    await page.waitForSelector('.result-page', { state: 'visible', timeout: 30000 });
    // 가로/세로 모드에 따라 여러 개가 존재할 수 있으므로 가시적인 요소 대기
    await page
      .locator('.score-value')
      .filter({ visible: true })
      .first()
      .waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForLoadState('networkidle');

    await page.addStyleTag({
      content: `
        .confetti-container, .double-reward-section { display: none !important; }
      `,
    });

    await page.waitForTimeout(3000);

    await expect(page).toHaveScreenshot('vrt-quiz-result.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
      mask: [
        page.locator('.score-value'),
        page.locator('.stat-value'),
        page.locator('.stat-item'),
        page.locator('.diagnostic-stat'),
        page.locator('.recommendation-card'),
        page.locator('.result-subtitle'),
      ],
    });
  });

  test('등반 일지 (Roadmap Page)', async ({ page }) => {
    await page.goto('/roadmap');
    await page.waitForSelector('.history-page', { state: 'visible', timeout: 30000 });
    await page.waitForSelector('.maintenance-card', { state: 'visible', timeout: 15000 });
    // 무작위로 생성되는 안개 요소가 스타일로 제거되기 전까지 대기 및 안정화
    await page.addStyleTag({
      content: `
        .fog-overlay, .fog-icon, .gear-icon { display: none !important; visibility: hidden !important; opacity: 0 !important; }
        .maintenance-card { animation: none !important; transform: none !important; }
      `,
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.addStyleTag({
      content: `
        .fog-overlay, .gear-icon { display: none !important; }
        .maintenance-card { animation: none !important; transform: none !important; }
      `,
    });

    await expect(page).toHaveScreenshot('vrt-roadmap-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.15,
      mask: [
        page.locator('.history-smart-comment'),
        page.locator('.history-tier-progress'),
        page.locator('.collection-content'),
        page.locator('.milestone-content-integrated'),
        page.locator('.footer-value'),
        page.locator('.scale-value'),
      ],
    });
  });

  test('랭킹 페이지 (Ranking Page)', async ({ page }) => {
    await page.goto('/ranking');
    await page.waitForSelector('.ranking-page', { state: 'visible', timeout: 30000 });
    await page.waitForSelector('.maintenance-card', { state: 'visible', timeout: 15000 });

    await page.addStyleTag({
      content: `
        .fog-overlay, .fog-icon, .gear-icon { display: none !important; visibility: hidden !important; opacity: 0 !important; }
        .maintenance-card { animation: none !important; transform: none !important; }
      `,
    });

    await expect(page).toHaveScreenshot('vrt-ranking-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    });
  });
});
