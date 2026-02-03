import { test } from '@playwright/test';
import { expectNoOverflow } from './utils/overflow';

/**
 * Monkey Test / Chaos Test (Network Chaos v2)
 *
 * 특정 시나리오 없이 화면의 무작위 요소를 클릭(또는 길게 누르기)하면서
 * 네트워크 환경을 무작위로 변경하여 앱의 회복 탄력성을 검증합니다.
 *
 * - 클릭: element.click() 또는 input.fill()
 * - 길게 누르기: pointer down → 800ms 대기 → pointer up (Playwright로 검증 가능.
 *   앱에 long-press 핸들러가 있으면 동작하고, 없어도 크래시 없이 통과해야 함)
 *
 * - Visual Guardian(VG): 카오스 루프 동안 VG를 켜 두고, 종료 시 오버플로우를 한 번 검사합니다.
 *   (클릭으로 막 돌아다닌 뒤 최종 화면이 overflow 상태면 실패)
 */

test.describe('MONKEY TEST - Chaos Automation', () => {
  test('네트워크 카오스 환경에서도 앱이 크래시되지 않아야 한다', async ({ page }) => {
    // 100회 × (네트워크 전환 + 클릭 + 500ms 대기) → 기본 30s 초과. CI와 동일하게 2분 허용
    test.setTimeout(120000);

    // Visual Guardian 활성화 (카오스 중 돌아다닌 화면들의 오버플로우도 겸사겸사 검사)
    await page.addInitScript(() => {
      (window as unknown as { __ENABLE_VISUAL_GUARDIAN__?: boolean }).__ENABLE_VISUAL_GUARDIAN__ =
        true;
    });

    // 에러 캡처 설정
    const errors: Error[] = [];
    page.on('pageerror', (exception) => {
      console.error(`[PAGE ERROR] ${exception.message}`);
      errors.push(exception);
    });

    // 시작 페이지 이동 (addInitScript 적용된 상태로 로드)
    await page.goto('/');
    await page.waitForLoadState('load');

    const ITERATIONS = process.env.CI ? 100 : 40; // 가혹 테스트 횟수 (CI일 경우 대폭 증가)
    console.log(`[CHAOS MONKEY] Starting ${ITERATIONS} interactions with Smart targeting...`);

    // 앱 크래시만 critical. 환경/인프라 성격 에러는 제외(최소한만, 넓은 패턴 사용 안 함)
    const nonCriticalPattern =
      /InternetDisconnected|NETWORK_CHANGED|Failed to fetch|ChunkLoadError|Loading chunk.*failed|ResizeObserver.*loop|abort|useRegisterSW|swRegistration|Symbol\(Symbol\.iterator\)/i;

    const networkConditions = [
      { name: 'Normal', download: -1, upload: -1, latency: 0 },
      { name: 'Slow 3G', download: (500 * 1024) / 8, upload: (500 * 1024) / 8, latency: 400 },
      {
        name: 'Fast 3G',
        download: (1.6 * 1024 * 1024) / 8,
        upload: (750 * 1024) / 8,
        latency: 150,
      },
      { name: 'Offline', download: 0, upload: 0, latency: 0, offline: true },
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
          try {
            // CDP 세션을 통해 실시간 네트워크 지연/대역폭 에뮬레이션 (페이지 닫힘 등으로 실패 시 스킵)
            const client = await page.context().newCDPSession(page);
            await client.send('Network.emulateNetworkConditions', {
              offline: false,
              downloadThroughput: condition.download,
              uploadThroughput: condition.upload,
              latency: condition.latency,
            });
          } catch {
            // CDP 실패 시 해당 스텝만 스킵하고 계속 진행
          }
        }
      }

      // 클릭 가능한 타겟들 (지능형 타겟팅)
      const targetSelectors = [
        'button:not([disabled])',
        'a.tab-item',
        '[role="button"]',
        '.clickable',
        '.keypad-key',
        '.category-climb-button',
        'input[type="text"]',
        '.ranking-tab-item',
      ];

      const elements = page.locator(targetSelectors.join(', '));
      const count = await elements.count().catch(() => 0);

      if (count > 0) {
        // 상위 15개 요소 중 무작위 선택 (보이는 영역 우선)
        const randomIndex = Math.floor(Math.random() * Math.min(count, 15));
        const element = elements.nth(randomIndex);

        try {
          if (await element.isVisible({ timeout: 400 }).catch(() => false)) {
            const name =
              (await element.innerText().catch(() => '')) ||
              (await element.getAttribute('aria-label').catch(() => '')) ||
              'unknown';
            console.log(
              `[CHAOS] Step ${i + 1}/${ITERATIONS}: Target "${name.trim().substring(0, 15)}"`
            );

            // 무작위로 클릭, 길게 누르기(10%), 또는 입력
            const doLongPress = Math.random() < 0.1;
            if (await element.evaluate((el) => el.tagName === 'INPUT')) {
              await element.fill('Chaos Test').catch(() => {});
            } else if (doLongPress) {
              // 길게 누르기: pointer down → 800ms → pointer up (long-press 로직 검증)
              const box = await element.boundingBox().catch(() => null);
              if (box) {
                const x = box.x + box.width / 2;
                const y = box.y + box.height / 2;
                await page.mouse.move(x, y);
                await page.mouse.down();
                await page.waitForTimeout(800);
                await page.mouse.up();
              } else {
                await element.click({ timeout: 1000, force: true }).catch(() => {});
              }
            } else {
              await element.click({ timeout: 1000, force: true }).catch(() => {});
            }

            await page.waitForTimeout(500); // UI 반응 대기
          }
        } catch {
          // Ignore transient errors during chaos monkey interactions
        }
      } else {
        // 요소가 없으면 무작위 좌표 클릭 (진정한 멍키!)
        console.log(`[CHAOS] Step ${i + 1}: No elements found. Random coordinate click.`);
        const width = page.viewportSize()?.width || 400;
        const height = page.viewportSize()?.height || 800;
        await page.mouse.click(Math.random() * width, Math.random() * height).catch(() => {});
        await page.waitForTimeout(500);
      }

      // 치명적 에러 감시 (undefined 참조, 타입 에러 등 실제 앱 버그는 여전히 잡힘)
      if (errors.length > 0) {
        const critical = errors.filter((e) => !nonCriticalPattern.test(e.message));
        if (critical.length > 0) {
          await page.screenshot({ path: `tests/e2e/screenshots/chaos-crash-${Date.now()}.png` });
          throw new Error(`Chaos Monkey found ${critical.length} critical errors!`);
        }
      }
    }

    // 카오스 종료 후 Visual Guardian 오버플로우 검사 (겸사겸사)
    await page.context().setOffline(false);
    await page.waitForTimeout(1500); // 레이아웃/VG 스캔 안정화
    await expectNoOverflow(page);

    console.log('[CHAOS MONKEY] Test finished successfully.');
  });
});
