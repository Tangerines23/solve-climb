import { chromium } from 'playwright';

/**
 * 🛠️ Visual Guardian (VG) - Quick CLI Checker
 *
 * 특정 URL 또는 전체 페이지의 레이아웃 오버플로우를 CLI에서 즉시 확인합니다.
 *
 * 사용법:
 * 1. 기본 (메인 페이지): node scripts/vg-cli.js
 * 2. 특정 URL: node scripts/vg-cli.js http://localhost:5173/my-page
 * 3. 뷰포트 지정: node scripts/vg-cli.js --width 375 --height 667
 */

async function main() {
  const args = process.argv.slice(2);
  let targetUrl = args.find((a) => a.startsWith('http')) || 'http://localhost:5173';

  const widthArgIdx = args.indexOf('--width');
  const width = widthArgIdx !== -1 ? parseInt(args[widthArgIdx + 1]) : 393;

  const heightArgIdx = args.indexOf('--height');
  const height = heightArgIdx !== -1 ? parseInt(args[heightArgIdx + 1]) : 851;

  console.log(`\n🛡️ [Visual Guardian CLI]`);
  console.log(`📐 Viewport: ${width}x${height}`);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });

  // 1. VG 활성화 플래그 주입 (새로고침 시에도 유지되도록 initScript 사용)
  await context.addInitScript(() => {
    window.__ENABLE_VISUAL_GUARDIAN__ = true;
    window.__VG_INTENSIVE_MODE__ = true;
    window.isPlaywrightLocal = true;
  });

  // 1. VG 활성화 및 로그인 세션 주입 (새로고침 시에도 유지되도록 initScript 사용)
  await context.addInitScript(() => {
    // 앱에서 사용하는 로컬 세션 키에 가상 ID 주입
    const sessionKey = 'solve-climb-local-session';
    const mockSession = { userId: '550e8400-e29b-41d4-a716-446655440000' };
    window.localStorage.setItem(sessionKey, JSON.stringify(mockSession));

    // VG 활성화 플래그
    window.__ENABLE_VISUAL_GUARDIAN__ = true;
    window.__VG_INTENSIVE_MODE__ = true;
    window.isPlaywrightLocal = true;

    // 테스트용 디버그 데이터 (필요 시)
    window.localStorage.setItem('debug_mode', 'true');
  });

  const page = await context.newPage();

  try {
    console.log(`📡 Connecting to ${targetUrl}...`);
    // 데이터 로딩을 위해 대기 시간 상향
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // 2. 초기화 및 세션 반영을 위한 리로드
    await page.reload({ waitUntil: 'networkidle' });
    console.log(`👁️ Scanning for overflows (Logged-in mode)...`);

    // 데이터가 렌더링될 때까지 추가 대기
    await page.waitForTimeout(2000);

    // 3. 전체 페이지 스크롤 (레이아웃 계산 강제)
    await page.evaluate(async () => {
      const distance = 400;
      const totalHeight = document.body.scrollHeight;
      let scrolled = 0;
      while (scrolled < totalHeight) {
        window.scrollBy(0, distance);
        scrolled += distance;
        await new Promise((r) => setTimeout(r, 100));
      }
      window.scrollTo(0, 0);
    });

    await page.waitForTimeout(1000);

    // 4. 결과 수집
    const results = await page.evaluate(() => ({
      errors: window.__LAYOUT_ERRORS__ || [],
      ignored: window.__LAYOUT_IGNORED__ || [],
    }));

    if (results.errors.length > 0) {
      console.error(`\n🚨 Found ${results.errors.length} layout overflow(s)!`);
      results.errors.forEach((err, i) => {
        console.error(`\n[${i + 1}] ${err.error}`);
        console.error(`   - Selector: ${err.path}`);
        console.error(
          `   - Details: Scroll[${err.details.scroll.join('x')}] vs Client[${err.details.client.join('x')}]`
        );
      });

      // Capture screenshot for debugging
      const screenshotPath = `vg-overflow-${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`\n📸 Screenshot saved to: ${screenshotPath}`);

      process.exit(1);
    } else {
      console.log(`\n✅ No overflows detected on this page.`);
      if (results.ignored.length > 0) {
        console.log(`   (Note: ${results.ignored.length} intentional overflows were ignored)`);
      }
      process.exit(0);
    }
  } catch (err) {
    console.error(`\n❌ Error during scan: ${err.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
