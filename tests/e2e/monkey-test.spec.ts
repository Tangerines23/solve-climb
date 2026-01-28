import { test, expect } from '@playwright/test';

/**
 * Monkey Test / Chaos Test (Network Chaos v2)
 * 
 * 특정 시나리오 없이 화면의 무작위 요소를 클릭하면서 
 * 네트워크 환경을 무작위로 변경하여 앱의 회복 탄력성을 검증합니다.
 */

test.describe('MONKEY TEST - Chaos Automation', () => {

    test('네트워크 카오스 환경에서도 앱이 크래시되지 않아야 한다', async ({ page }) => {
        // 에러 캡처 설정
        const errors: Error[] = [];
        page.on('pageerror', (exception) => {
            console.error(`[PAGE ERROR] ${exception.message}`);
            errors.push(exception);
        });

        // 시작 페이지 이동
        await page.goto('/');
        await page.waitForLoadState('load');

        const ITERATIONS = 30; // 가혹 테스트 횟수
        console.log(`[CHAOS MONKEY] Starting ${ITERATIONS} interactions with network chaos...`);

        const networkConditions = [
            { name: 'Normal', download: -1, upload: -1, latency: 0 },
            { name: 'Slow 3G', download: 500 * 1024 / 8, upload: 500 * 1024 / 8, latency: 400 },
            { name: 'Fast 3G', download: 1.6 * 1024 * 1024 / 8, upload: 750 * 1024 / 8, latency: 150 },
            { name: 'Offline', download: 0, upload: 0, latency: 0, offline: true }
        ];

        for (let i = 0; i < ITERATIONS; i++) {
            // 5회마다 네트워크 환경 무작위 변경 (더 잦은 카오스!)
            if (i % 5 === 0) {
                const condition = networkConditions[Math.floor(Math.random() * networkConditions.length)];
                console.log(`[CHAOS] Step ${i}: Setting network to ${condition.name}`);

                if ('offline' in condition && condition.offline) {
                    await page.context().setOffline(true);
                } else {
                    await page.context().setOffline(false);
                    // CDP 세션을 통해 실시간 네트워크 지연/대역폭 에뮬레이션
                    const client = await page.context().newCDPSession(page);
                    await client.send('Network.emulateNetworkConditions', {
                        offline: false,
                        downloadThroughput: condition.download,
                        uploadThroughput: condition.upload,
                        latency: condition.latency
                    });
                }
            }

            // 클릭 가능한 타겟들
            const elements = page.locator('button, a, [role="button"], .keypad-key, .category-climb-button');
            const count = await elements.count().catch(() => 0);

            if (count > 0) {
                const randomIndex = Math.floor(Math.random() * count);
                const element = elements.nth(randomIndex);

                try {
                    if (await element.isVisible({ timeout: 500 }).catch(() => false)) {
                        const name = await element.innerText().catch(() => '??');
                        console.log(`[CHAOS] Step ${i + 1}: Clicking "${name.trim().substring(0, 15)}"`);

                        await element.click({ timeout: 800 }).catch(() => { });
                        await page.waitForTimeout(400); // 반응 대기
                    }
                } catch (e) { }
            } else {
                // 막다른 길이면 홈으로
                await page.goto('/').catch(() => { });
            }

            // 치명적 에러 감시 (네트워크 연결 끊김 등 예상된 에러 제외)
            if (errors.length > 0) {
                const critical = errors.filter(e => !/InternetDisconnected|NETWORK_CHANGED|Failed to fetch/i.test(e.message));
                if (critical.length > 0) {
                    await page.screenshot({ path: `tests/e2e/screenshots/chaos-crash-${Date.now()}.png` });
                    throw new Error(`Chaos Monkey found ${critical.length} critical errors!`);
                }
            }
        }

        console.log('[CHAOS MONKEY] Test finished successfully.');
    });
});
