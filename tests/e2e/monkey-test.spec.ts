import { test, expect } from '@playwright/test';

/**
 * Monkey Test / Chaos Test
 * 
 * 이 테스트는 특정 시나리오 없이 화면의 무작위 요소를 클릭하여 
 * 애플리케이션의 안정성을 검증합니다. (로컬 실행 전용, 토큰 소모 없음)
 */

test.describe('MONKEY TEST - Chaos Automation', () => {

    test('무작위 클릭 및 인터랙션 중 크래시가 발생하지 않아야 한다', async ({ page }) => {
        // 에러 캡처 설정
        const errors: Error[] = [];
        page.on('pageerror', (exception) => {
            console.error(`[PAGE ERROR] ${exception.message}`);
            errors.push(exception);
        });

        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.error(`[BROWSER CONSOLE ERROR] ${msg.text()}`);
            }
        });

        // 시작 페이지 이동
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        const ITERATIONS = 50; // 무작위 동작 횟수
        console.log(`[MONKEY] Starting ${ITERATIONS} random interactions...`);

        for (let i = 0; i < ITERATIONS; i++) {
            // 현재 페이지의 클릭 가능한 요소들 수집
            // 버튼, 링크, 입력창 등을 대상으로 함
            const clickableLocators = [
                'button',
                'a',
                '[role="button"]',
                '.keypad-key',
                '.category-climb-button',
                '.level-list-button-primary'
            ];

            const elements = page.locator(clickableLocators.join(', '));
            const count = await elements.count();

            if (count > 0) {
                // 랜덤하게 하나 선택
                const randomIndex = Math.floor(Math.random() * count);
                const element = elements.nth(randomIndex);

                try {
                    // 가시성 확인 후 클릭 시도 (최대 1초 대기)
                    if (await element.isVisible()) {
                        const name = await element.innerText() || await element.getAttribute('aria-label') || 'unnamed';
                        console.log(`[MONKEY] Step ${i + 1}: Clicking "${name.substring(0, 20)}"`);

                        await element.click({ timeout: 1000 }).catch(e => {
                            // 클릭 실패(다른 요소에 가려짐 등)는 무시하고 진행
                        });

                        // 클릭 후 페이지 안정화를 위해 짧은 대기
                        await page.waitForTimeout(350);
                    }
                } catch (e) {
                    // 개별 인터랙션 실패는 무시 (Monkey Test의 특성)
                }
            } else {
                // 클릭할 요소가 없으면 홈으로 강제 이동
                console.log('[MONKEY] No clickable elements found. Going home...');
                await page.goto('/');
                await page.waitForTimeout(1000);
            }

            // 치명적 에러 발생 시 즉시 중단
            if (errors.length > 0) {
                await page.screenshot({ path: `tests/e2e/screenshots/monkey-crash-${Date.now()}.png` });
                throw new Error(`Monkey Test failed with ${errors.length} errors. Check logs and screenshots.`);
            }
        }

        console.log('[MONKEY] Finished successfully without crashes.');
    });
});
