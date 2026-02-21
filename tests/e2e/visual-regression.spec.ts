import { test, expect } from '@playwright/test';

/**
 * 프로젝트 전체 주요 페이지의 시각적 일관성을 검증하는 테스트 스위트입니다.
 * 디자인 시스템(TDS) 및 CSS 변수 변경 시 의도치 않은 UI 깨짐을 방지합니다.
 */
test.describe('Visual Regression Testing (VRT) - UI 일관성 검증', () => {
  // 모든 테스트 전 공통 설정: 뷰포트 고정 (TDS Mobile 기준)
  test.use({ viewport: { width: 375, height: 812 } });

  test('홈 화면 (Home Page)', async ({ page }) => {
    await page.goto('/');
    // networkidle is unstable with Supabase realtime. Wait for main content stable state.
    await page.waitForSelector('.home-page', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    // 애니메이션 및 동적 데이터 로딩 대기
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('vrt-home-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.2, // 20% 이하 허용 (동적 콘텐츠: 프로필, 통계, 애니메이션 등)
      mask: [
        page.locator('.loading-overlay, .dynamic-stats, .home-stat-value, .profile-info'),
        page.locator('.daily-reward-overlay'), // 일일 출석 보상 모달 (노출 여부에 따라 달라짐)
      ],
    });
  });

  test('마이페이지 (My Page)', async ({ page }) => {
    await page.goto('/mypage');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('vrt-my-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('설정 페이지 (Settings Page)', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('vrt-settings-page.png', {
      fullPage: true,
    });
  });

  test('가방(인벤토리) 페이지 (Backpack Page)', async ({ page }) => {
    await page.goto('/backpack');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('vrt-backpack-page.png', {
      fullPage: true,
    });
  });

  test('퀴즈 종료 결과 화면 (Result Page Snippet)', async ({ page }) => {
    // 결과 화면은 특정 상태가 필요하므로 주요 컴포넌트 단위로 검증
    await page.goto('/result?score=1000&correct=10');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await expect(page).toHaveScreenshot('vrt-quiz-result.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05, // 리눅스/윈도우 폰트 렌더링 미세 차이만 허용 (5%)
    });
  });
});
