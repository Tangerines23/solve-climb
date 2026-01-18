import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('SMOKE TEST - 메인 화면 검증', () => {
  test('홈 화면이 정상적으로 로드되어야 한다', async ({ page }) => {
    // 1. 홈 접속
    await page.goto('/');

    // 2. 헤더 및 로고 확인
    await expect(page.locator('header')).toBeVisible();

    // 3. 산 선택 카드(CategoryList)가 보이는지 확인
    const mountainCards = page.locator('.category-item-card');
    await expect(mountainCards.first()).toBeVisible();
  });

  test('홈 화면 시각적 회귀 테스트 (Visual Regression)', async ({ page }) => {
    await page.goto('/');

    // 페이지 로딩 대기 및 애니메이션 안정화 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // 3초 등급 표기 등 고려

    // 스냅샷 촬영 및 대조
    await expect(page).toHaveScreenshot('home-page-initial.png', {
      fullPage: true,
      mask: [page.locator('[style*="position: fixed"]')], // 로딩 마스크(등급표기) 제외
    });
  });

  test('홈 화면 웹 접근성 검증 (Accessibility Audit)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WCAG 2.0, 2.1 Level AA 가이드라인 등에 대해 검사 수행
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();

    // 치명적인 접근성 오류가 없어야 한다
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('산 선택 및 페이지 이동 시나리오', async ({ page }) => {
    await page.goto('/');

    // 1. 첫 번째 산의 '등반하기' 버튼 클릭
    const climbButton = page.locator('.category-climb-button').first();
    await climbButton.click();

    // 2. 카테고리 선택 페이지로 이동했는지 확인 (URL 파라미터 체크)
    await expect(page).toHaveURL(/.*mountain=.*/);

    // 3. 페이지 렌더링 확인 (에러 메시지 없음)
    const container = page.locator('.category-select-container, .topic-select-page');
    await expect(container).toBeVisible();
  });
});
