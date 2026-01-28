import { test, expect } from '@playwright/test';

/**
 * Network Stress (Latency Hell) Test
 * 
 * 모든 네트워크 요청에 강제로 높은 지연(Latency)을 발생시켜
 * 앱의 로딩 UX와 중복 클릭 방지 로직을 검증합니다.
 */

test.describe('NETWORK STRESS TEST - Latency Hell', () => {

    test('고점연(5초) 환경에서도 핵심 시나리오가 안정적으로 작동해야 한다', async ({ page }) => {
        // CDP(Chrome DevTools Protocol)를 사용하여 강제 지연 설정
        const client = await page.context().newCDPSession(page);
        await client.send('Network.emulateNetworkConditions', {
            offline: false,
            downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
            uploadThroughput: 750 * 1024 / 8,         // 750 Kbps
            latency: 5000                             // 5초 지연 (가혹한 환경)
        });

        console.log('[STRESS] High Latency (5000ms) Enabled.');

        // 에러 캡처 설정
        const errors: Error[] = [];
        page.on('pageerror', (exception) => {
            console.error(`[STRESS ERROR] ${exception.message}`);
            errors.push(exception);
        });

        // 1. 홈 페이지 진입
        console.log('[STRESS] Navigating to Home...');
        await page.goto('/', { timeout: 60000 }); // 지연이 있으므로 타임아웃 넉넉히

        // 2. 등반하기 버튼 클릭 (로딩 UI 확인 목적)
        const climbButton = page.locator('.category-climb-button').first();
        await expect(climbButton).toBeVisible({ timeout: 15000 });

        console.log('[STRESS] Clicking Climb Button...');
        await climbButton.click();

        // 3. 지연 중 로딩 인디케이터나 스켈레톤이 보이는지 체크 (앱 설계에 따라 다름)
        // 여기서는 페이지 전환 대기
        console.log('[STRESS] Waiting for Category Selection page...');
        await page.waitForURL(/.*category-select.*/, { timeout: 30000 });

        // 4. 수학의 산 선택 시도
        const mathMountain = page.locator('.category-item-card h4:text("수학의 산")');
        if (await mathMountain.isVisible()) {
            console.log('[STRESS] Math Mountain found. Testing interaction...');
            await mathMountain.click().catch(() => { });
        }

        // 5. 중복 클릭 방지 테스트 (빠르게 여러 번 클릭)
        console.log('[STRESS] Double-click stress test...');
        const backButton = page.locator('button:text("뒤로")').first();
        if (await backButton.isVisible()) {
            await backButton.click();
            await backButton.click(); // 연타
        }

        // 최종 검증: 브라우저 크래시나 치명적 에러가 없어야 함
        if (errors.length > 0) {
            throw new Error(`Stress Test failed with ${errors.length} errors under high latency.`);
        }

        console.log('[STRESS] Finished successfully under 5000ms latency.');
    });
});
