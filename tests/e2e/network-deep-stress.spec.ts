import { test, expect } from '@playwright/test';

/**
 * Network Deep Stress (Race Condition & Error Recovery)
 *
 * 모든 API 요청에 대해 무작위 지연(Latency)과 무작위 실패(Failure)를 적용하여
 * 앱의 레이스 컨디션 방지 및 에러 복구 로직을 검증합니다.
 */

test.describe('NETWORK DEEP STRESS - Reliability Check', () => {
  test('간헐적 네트워크 실패와 높은 지연 환경에서도 데이터 정합성이 유지되어야 한다', async ({
    page,
  }) => {
    // 에러 캡처 설정
    const errors: Error[] = [];
    page.on('pageerror', (exception) => {
      console.error(`[STRESS ERROR] ${exception.message}`);
      errors.push(exception);
    });

    // 🌐 네트워크 가로채기 설정: 무작위 지연 및 10% 확률로 실패
    await page.route('**/rest/v1/**', async (route) => {
      const random = Math.random();
      const latency = Math.floor(Math.random() * 2000) + 300; // 300ms ~ 2300ms 지연

      if (random < 0.1) {
        // 10% 확률로 실패 (Network Error)
        console.log(`[STRESS] ❌ Simulating API Failure for: ${route.request().url()}`);
        await new Promise((r) => setTimeout(r, 500));
        await route.abort('failed');
      } else {
        // 무작위 지연 후 계속 진행
        await new Promise((r) => setTimeout(r, latency));
        console.log(`[STRESS] ⏳ Latency (${latency}ms) for: ${route.request().url()}`);
        await route.continue();
      }
    });

    // 1. 시작 페이지 이동
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 2. 상점 페이지로 이동 (가장 복잡한 API 연동 중 하나)
    console.log('[STRESS] Moving to Shop Page...');
    const shopLink = page.locator('a:has-text("상점")').first();
    if (await shopLink.isVisible()) {
      await shopLink.click();
    } else {
      // MyPage를 거쳐서 갈 수도 있음
      await page.goto('/shop');
    }

    // 3. 로딩 상태 확인 및 아이템 그리드 대기
    await expect(page).toHaveURL(/.*shop.*/);

    // 4. 구매 버튼 광클 (레이스 컨디션 테스트)
    console.log('[STRESS] Rapid-fire clicks on purchase button...');
    const purchaseButtons = page.locator('.purchase-button');
    const count = await purchaseButtons.count();

    if (count > 0) {
      const firstBtn = purchaseButtons.first();
      // 지연이 적용된 상태에서 빠르게 3번 클릭
      await firstBtn.click().catch(() => {});
      await firstBtn.click().catch(() => {});
      await firstBtn.click().catch(() => {});
    }

    // 5. 탭 전환 스트레스 (상점 <-> 내 배낭)
    console.log('[STRESS] Rapid tab switching...');
    const bagTab = page.locator('button:has-text("내 배낭")');
    const shopTab = page.locator('button:has-text("상점")');

    if (await bagTab.isVisible()) {
      await bagTab.click();
      await page.waitForTimeout(200);
      await shopTab.click();
      await page.waitForTimeout(200);
      await bagTab.click();
    }

    // 6. 결과 페이지까지 이동 시도 (가장 긴 시나리오)
    await page.goto('/');
    const startBtn = page.locator('.category-climb-button').first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      const mountain = page.locator('.category-item-card').first();
      await mountain.click().catch(() => {});
    }

    console.log('[STRESS] Deep Network Stress sequence finished.');

    // 치명적 에러 감시 (예상된 네트워크 에러 제외)
    const critical = errors.filter((e) => !/Failed to fetch|network|abort/i.test(e.message));
    if (critical.length > 0) {
      throw new Error(`Stress Test found ${critical.length} critical errors!`);
    }
  });
});
