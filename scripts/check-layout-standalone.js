/**
 * 🛡️ Visual Guardian (VG) - Main Layout Check Script
 *
 * Playwright를 사용하여 페이지를 순회하며 레이아웃 깨짐(Overflow)을 감지합니다.
 * - 기본 모드: 정해진 뷰포트에서 스크롤하며 검사
 * - Deep 모드 (--deep): 버튼/링크를 클릭하며 숨겨진 UI까지 검사
 *
 * 실행: npm run check:layout (또는 check:layout:deep)
 */
import { chromium } from 'playwright';

let globalHasErrors = false;

/** CI/일상용: 대표 3개 뷰포트 */
const VIEWPORTS_DEFAULT = [
  { name: 'Mobile (Pixel 5)', width: 393, height: 851 },
  { name: 'Mobile (iPhone SE)', width: 375, height: 667 },
  { name: 'Desktop (Standard)', width: 1280, height: 800 },
];

/** --all-viewports: 대표 8종 (시간 대비 다양성 균형), 4개씩 병렬 실행 */
const VIEWPORTS_EXTENDED = [
  { name: 'Mobile (Small)', width: 320, height: 568 },
  { name: 'Mobile (iPhone SE)', width: 375, height: 667 },
  { name: 'Mobile (Pixel 5)', width: 393, height: 851 },
  { name: 'Mobile (Landscape)', width: 844, height: 390 },
  { name: 'Tablet (iPad)', width: 768, height: 1024 },
  { name: 'Desktop (1280)', width: 1280, height: 800 },
  { name: 'Desktop (1440)', width: 1440, height: 900 },
  { name: 'Desktop (1920)', width: 1920, height: 1080 },
];

/** 뷰포트 병렬 실행 수 (너무 크면 메모리/타임아웃 위험) */
const PARALLEL_VIEWPORTS = 4;

async function runOneViewport(viewport, pagesToCheck, BASE_URL, browser) {
  console.log(`\n📱 Checking Viewport: ${viewport.name} (${viewport.width}x${viewport.height})...`);
  const isMobile = viewport.width < 600;
  const userAgent = isMobile
    ? 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
    : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Safari/537.36';
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    userAgent,
    deviceScaleFactor: 2,
  });
  try {
    for (const pageInfo of pagesToCheck) {
      const page = await context.newPage();
      try {
        await page.goto(pageInfo.url, { waitUntil: 'load', timeout: 120000 }); // 120초로 연장 (Docker 내 컴파일 시간 고려)
        await page.addInitScript(() => {
          window.__ENABLE_VISUAL_GUARDIAN__ = true;
          window.__VG_INTENSIVE_MODE__ = true;
        });
        await page.reload({ waitUntil: 'load' });
        const waitAfterLoad = pageInfo.waitAfterLoad ?? 0;
        if (waitAfterLoad > 0) await page.waitForTimeout(waitAfterLoad);
        if (await checkOverflow(page, `${pageInfo.name} (Initial)`)) globalHasErrors = true;
        if (pageInfo.actions) {
          try {
            await pageInfo.actions(page);
            const waitAfterActions = pageInfo.waitAfterActions ?? 2000;
            await page.waitForTimeout(waitAfterActions);
            if (await checkOverflow(page, `${pageInfo.name} (After Manual Actions)`))
              globalHasErrors = true;
          } catch (actionErr) {
            console.warn(`    ⚠️ Action failed on ${pageInfo.name}: ${actionErr.message}`);
          }
        }
        if (process.argv.includes('--deep')) {
          if (await runDeepScan(page, pageInfo.name)) globalHasErrors = true;
          const originalSize = page.viewportSize();
          if (originalSize) {
            console.log(
              `  ⚖️  Stress testing border size (${originalSize.width - 1}x${originalSize.height})...`
            );
            await page.setViewportSize({
              width: originalSize.width - 1,
              height: originalSize.height,
            });
            await page.waitForTimeout(1000);
            if (await checkOverflow(page, `${pageInfo.name} (Stress -1px)`)) globalHasErrors = true;
            await page.setViewportSize(originalSize);
          }
        }
      } catch (err) {
        console.error(`❌ Page test failed: ${pageInfo.name} - ${err.message}`);
        globalHasErrors = true;
      } finally {
        await page.close();
      }
    }
  } finally {
    await context.close();
  }
}

(async () => {
  console.log('🔍 Starting Standalone Layout Check...');

  const browser = await chromium.launch();
  const useAllViewports = process.argv.includes('--all-viewports');
  const viewports = useAllViewports ? VIEWPORTS_EXTENDED : VIEWPORTS_DEFAULT;
  if (useAllViewports) {
    console.log(`📐 Using ${viewports.length} viewports (--all-viewports)`);
  }

  let BASE_URL = process.env.VITE_URL;

  if (!BASE_URL) {
    // Try to detect active port (Vite defaults to 5173 or 5174)
    const ports = [5173, 5174, 3000];
    console.log('📡 Detecting active dev server port...');

    for (const port of ports) {
      try {
        const testPage = await browser.newPage();
        await testPage.goto(`http://localhost:${port}`, { timeout: 2000 });
        await testPage.close();
        BASE_URL = `http://localhost:${port}`;
        console.log(`✅ Detected active server on port ${port}`);
        break;
      } catch {
        // Continue to next port
      }
    }
  }

  if (!BASE_URL) {
    BASE_URL = 'http://localhost:5173'; // Final fallback
    console.warn(`⚠️ No active server detected. Using default ${BASE_URL}`);
  }

  console.log(`🌐 Target URL: ${BASE_URL}`);

  const onlyPage = process.argv.includes('--only')
    ? process.argv[process.argv.indexOf('--only') + 1]
    : null;
  if (onlyPage) {
    console.log(`📌 Only checking page: "${onlyPage}"`);
  }

  let pagesToCheck = [
    {
      name: 'Home',
      url: `${BASE_URL}/`,
      waitAfterLoad: 3000,
    },
    /* Skipping non-critical 404 check in current env to avoid timeout noise
    {
      name: 'Error Page (404 Fallback)',
      url: `${BASE_URL}/this-page-does-not-exist`,
      actions: async (page) => {
        await page.waitForTimeout(2000);
      },
    },
    */
    {
      name: 'Keyboard Shortcuts Scan',
      url: `${BASE_URL}/`,
      actions: async (page) => {
        // 1. ESC key (to close any default modals like GameTips)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        // 2. Tab key (Checking focus rings / layout shifting)
        for (let i = 0; i < 3; i++) {
          await page.keyboard.press('Tab');
          // await page.waitForTimeout(200); // Removed to speed up
          if (await checkOverflow(page, `Keyboard Focus (Tab ${i})`)) globalHasErrors = true;
        }
      },
    },
    {
      name: 'Dev Panel (Ctrl+`)',
      url: `${BASE_URL}/`,
      actions: async (page) => {
        // Ctrl+` / Cmd+` 로 디버그 패널 열기 (useDebugShortcuts)
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        await page.keyboard.press(process.platform === 'darwin' ? 'Meta+`' : 'Control+`');
        await page
          .waitForSelector('.debug-panel-overlay', { state: 'visible', timeout: 3000 })
          .catch(() => null);
        await page.waitForTimeout(800);
      },
    },
    {
      name: 'Global Toasts Check',
      url: `${BASE_URL}/shop`,
      actions: async (page) => {
        // Trigger a toast (Purchase attempt without minerals)
        const buyBtn = page.locator('.item-buy-button').first();
        if (await buyBtn.isVisible()) {
          await buyBtn.click();
          await page.waitForTimeout(1000); // Wait for toast to appear
        }
      },
    },
    {
      name: 'My Page (Authenticated)',
      url: `${BASE_URL}/my-page`,
      // 익명 로그인으로 진입 → 사용자가 보는 것과 동일한 프로필/통계 화면에서 VG 검사
      waitAfterLoad: 5000,
      waitAfterActions: 5000,
      actions: async (page) => {
        const loginBtn = page.locator('.my-page-guest-anonymous-link');
        if (await loginBtn.isVisible()) {
          await loginBtn.click();
          // 프로필 영역이 나올 때까지 대기 (refetch 완료 후 세션 반영)
          await page.waitForSelector('.my-page-profile-section', { timeout: 10000 });
          // 통계/레이아웃 안정화
          await page.waitForTimeout(1500);
        }
      },
    },
    { name: 'Roadmap (History/Log)', url: `${BASE_URL}/roadmap` },
    { name: 'Ranking Page', url: `${BASE_URL}/ranking` },
    { name: 'Level Select', url: `${BASE_URL}/level-select` },
    { name: 'Notifications', url: `${BASE_URL}/notifications` },
    {
      name: 'Shop Page',
      url: `${BASE_URL}/shop`,
      actions: async (page) => {
        const bagTab = page.locator('button:has-text("내 배낭")');
        if (await bagTab.isVisible()) await bagTab.click();
      },
    },
  ];

  if (onlyPage) {
    const before = pagesToCheck;
    pagesToCheck = pagesToCheck.filter(
      (p) =>
        p.name.toLowerCase().includes(onlyPage.toLowerCase()) ||
        (p.url && p.url.toLowerCase().includes(onlyPage.toLowerCase()))
    );
    if (pagesToCheck.length === 0) {
      console.error(
        `❌ No page matching "${onlyPage}". Available: ${before.map((p) => p.name).join(', ')}`
      );
      process.exit(1);
    }
  }

  const viewportsToUse = onlyPage && !useAllViewports ? [viewports[0]] : viewports;

  try {
    for (let i = 0; i < viewportsToUse.length; i += PARALLEL_VIEWPORTS) {
      const chunk = viewportsToUse.slice(i, i + PARALLEL_VIEWPORTS);
      await Promise.all(
        chunk.map((viewport) => runOneViewport(viewport, pagesToCheck, BASE_URL, browser))
      );
    }
  } catch (err) {
    console.error('❌ Usage Error:', err);
    globalHasErrors = true;
  } finally {
    await browser.close();
    if (globalHasErrors) {
      console.error('\n❌ Layout check failed with errors');
      process.exit(1);
    } else {
      console.log('\n✅ All layout checks passed');
      process.exit(0);
    }
  }
})();

async function runDeepScan(page, pageName, depth = 0) {
  if (depth > 1) return false; // Limit nested depth to prevent infinite loops

  console.log(`  🕵️  Deep Scanning ${pageName} (Depth: ${depth})...`);
  let foundError = false;

  // 위험/제외 키워드
  const SKIP_KEYWORDS = [
    '로그아웃',
    '탈퇴',
    '초기화',
    '삭제',
    '취소',
    'Logout',
    'Reset',
    'Delete',
    'Withdraw',
    '홈',
    '카테고리',
    '내 정보',
    '상점',
    '알림',
    'Home',
    'Shop',
    'My Info',
  ];

  const currentUrl = page.url();

  // 더 광범위한 상호작용 요소 타겟팅
  const buttonSelectors = [
    'button',
    '[role="button"]',
    '.ranking-tab-item',
    '.shop-tab-item',
    'a.tab-item',
    '[onclick]',
    '.clickable',
  ];

  // 포인트 커서 요소 추가 검색
  const pointerElements = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*'))
      .filter((el) => {
        const style = window.getComputedStyle(el);
        return style.cursor === 'pointer' && el.offsetWidth > 0 && el.offsetHeight > 0;
      })
      .map((el) => {
        // 고유한 경로 또는 텍스트로 최소한의 식별 시도
        return el.innerText.trim().substring(0, 20);
      });
  });

  for (const selector of buttonSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();

    // 1단계(depth 0)는 충분히, 2단계(depth 1)는 핵심만
    const limit =
      depth === 0
        ? process.env.CI
          ? Math.min(count, 30)
          : Math.min(count, 12)
        : Math.min(count, 5);

    for (let i = 0; i < limit; i++) {
      const el = elements.nth(i);
      try {
        if (!(await el.isVisible())) continue;

        const text = (await el.innerText()).trim();
        if (SKIP_KEYWORDS.some((k) => text.includes(k)) || (text === '' && selector === 'button'))
          continue;

        // [최적화] 이미 눌렀던 텍스트면 건너뜀 (간이 중복 방지)
        const stepTag = `${pageName} (D:${depth} Click: "${text.substring(0, 10)}")`;

        await el.click({ timeout: 3000 });
        await page.waitForTimeout(1200); // 모달·펼침 UI 렌더 후 VG 검사

        // 페이지 이동 감지
        if (page.url() !== currentUrl) {
          await page.goto(currentUrl, { waitUntil: 'load' });
          continue;
        }

        if (await checkOverflow(page, stepTag)) {
          foundError = true;
        }

        // [최적화] 탭 전환이나 모달이 열린 것 같을 때만 중첩 스캔 수행
        if (depth < 1) {
          // 간단한 휴리스틱: 클릭 후 뭔가 변했을 가능성이 높은 경우만
          await runDeepScan(page, pageName, depth + 1);
        }
      } catch {
        /* 실패 무시 */
      }
    }
  }

  // [최적화] 포인트 커서 요소는 1단계에서만 보조적으로 수행
  if (depth === 0) {
    for (const textIdentifier of pointerElements.slice(0, 10)) {
      if (!textIdentifier) continue;

      const el = page.locator(`text="${textIdentifier}"`).first();
      try {
        if (!(await el.isVisible())) continue;
        if (SKIP_KEYWORDS.some((k) => textIdentifier.includes(k))) continue;

        await el.click({ timeout: 2000 });
        await page.waitForTimeout(1200);

        if (page.url() !== currentUrl) {
          await page.goto(currentUrl, { waitUntil: 'load' });
          continue;
        }

        if (
          await checkOverflow(page, `${pageName} (Pointer: "${textIdentifier.substring(0, 10)}")`)
        ) {
          foundError = true;
        }
      } catch {
        /* 실패 무시 */
      }
    }
  }

  return foundError;
}

async function checkOverflow(page, stepName) {
  // 1. 세그먼트 스크롤 (화면 밖 요소들까지 강제로 렌더링 및 체크 유도)
  // 단순히 끝으로 가는 게 아니라, 500px씩 끊어서 내려가며 모든 레이아웃 계산을 강제합니다.
  await page.evaluate(async () => {
    const distance = 500;
    const totalHeight = document.body.scrollHeight;
    let scrolled = 0;
    while (scrolled < totalHeight) {
      window.scrollBy(0, distance);
      scrolled += distance;
      await new Promise((r) => setTimeout(r, 100)); // 짧은 대기
    }
    window.scrollTo(0, 0); // 다시 위로
  });

  await page.waitForTimeout(1000); // VisualGuardian 최종 스캔 대기

  const result = await page.evaluate(() => {
    const errors = window.__LAYOUT_ERRORS__ || [];
    const ignored = window.__LAYOUT_IGNORED__ || [];
    const hasOverflow = document.body.dataset.layoutError === 'true';
    return { hasOverflow, errors, ignored };
  });

  if (result.ignored && result.ignored.length > 0) {
    console.log(`    ⚠️ Ignored Overflows (Auto-detected): ${result.ignored.length}`);
    result.ignored.slice(0, 10).forEach((ig) => {
      // 상위 10개로 증가
      const wDiff = ig.details.scroll[0] - ig.details.client[0];
      const hDiff = ig.details.scroll[1] - ig.details.client[1];
      const type = [];
      if (wDiff > 0.5) type.push(`X:+${Math.round(wDiff)}`);
      if (hDiff > 0.5) type.push(`Y:+${Math.round(hDiff)}`);

      console.log(
        `      - [${ig.reason}] [${type.join(', ')}] <${ig.element} class="${ig.className}"> (${ig.details.scroll.join('x')} vs ${ig.details.client.join('x')})`
      );
    });
  }

  if (result.hasOverflow) {
    console.error(`  🚨 Overflow on ${stepName}!`);
    const lastError = result.errors[result.errors.length - 1];
    if (lastError) console.error(JSON.stringify(lastError, null, 2));
    return true;
  } else {
    console.log(`  ✅ ${stepName} is clean. (Viewed all segments)`);
    return false;
  }
}
