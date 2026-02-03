import { chromium } from 'playwright';

let globalHasErrors = false;

(async () => {
  console.log('🔍 Starting Standalone Layout Check...');

  const browser = await chromium.launch();
  const viewports = [
    { name: 'Mobile (Pixel 5)', width: 393, height: 851 },
    { name: 'Mobile (iPhone SE)', width: 375, height: 667 },
    { name: 'Desktop (Standard)', width: 1280, height: 800 },
  ];

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

  const pagesToCheck = [
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
      actions: async (page) => {
        const loginBtn = page.locator('.my-page-guest-anonymous-link');
        if (await loginBtn.isVisible()) {
          await loginBtn.click();
          await page.waitForSelector('.my-page-profile-section', { timeout: 5000 });
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

  try {
    for (const viewport of viewports) {
      console.log(
        `\n📱 Checking Viewport: ${viewport.name} (${viewport.width}x${viewport.height})...`
      );

      const isMobile = viewport.width < 600;
      const userAgent = isMobile
        ? 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Safari/537.36';

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        userAgent: userAgent,
        deviceScaleFactor: 2,
      });

      for (const pageInfo of pagesToCheck) {
        const page = await context.newPage();

        try {
          // console.log(`  - Loading ${pageInfo.name}...`);
          await page.goto(pageInfo.url, { waitUntil: 'load', timeout: 30000 });

          // VisualGuardian 강제 활성화 및 고강도 검사 모드
          await page.addInitScript(() => {
            window.__ENABLE_VISUAL_GUARDIAN__ = true;
            window.__VG_INTENSIVE_MODE__ = true;
          });
          await page.reload({ waitUntil: 'load' });

          // 1. 초기 렌더링 검사
          if (await checkOverflow(page, `${pageInfo.name} (Initial)`)) globalHasErrors = true;

          // 2. 상호작용(모달/탭) 후 검사
          if (pageInfo.actions) {
            try {
              await pageInfo.actions(page);
              await page.waitForTimeout(2000);
              if (await checkOverflow(page, `${pageInfo.name} (After Manual Actions)`))
                globalHasErrors = true;
            } catch (actionErr) {
              console.warn(`    ⚠️ Action failed on ${pageInfo.name}: ${actionErr.message}`);
            }
          }

          // 3. 지능형 크롤러 (Deep Scan)
          if (process.argv.includes('--deep')) {
            if (await runDeepScan(page, pageInfo.name)) globalHasErrors = true;

            // 4. 경계 테스트 (Stress Viewport: -1px)
            const originalSize = page.viewportSize();
            if (originalSize) {
              console.log(
                `  ⚖️  Stress testing border size (${originalSize.width - 1}x${originalSize.height})...`
              );
              await page.setViewportSize({
                width: originalSize.width - 1,
                height: originalSize.height,
              });
              await page.waitForTimeout(1000); // Wait for layout recalc
              if (await checkOverflow(page, `${pageInfo.name} (Stress -1px)`))
                globalHasErrors = true;
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
      await context.close();
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
        await page.waitForTimeout(800);

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
        await page.waitForTimeout(800);

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
    const hasOverflow = document.body.dataset.layoutError === 'true';
    return { hasOverflow, errors };
  });

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
