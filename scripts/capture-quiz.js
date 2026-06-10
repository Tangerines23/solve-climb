import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  let port = 5173;
  let baseUrl = '';

  for (const p of [5173, 5174, 5175]) {
    try {
      const page = await browser.newPage();
      await page.goto(`http://localhost:${p}`, { timeout: 2000 });
      await page.close();
      baseUrl = `http://localhost:${p}`;
      console.log(`Detected server on port ${p}`);
      break;
    } catch (e) {
      // ignore
    }
  }

  if (!baseUrl) {
    console.error('Server not detected!');
    await browser.close();
    process.exit(1);
  }

  // Use storage state for session and rewrite origin port
  const storageStatePath = path.resolve('.auth/user.json');
  const contextOptions = {
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
  };

  if (fs.existsSync(storageStatePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(storageStatePath, 'utf8'));
      if (Array.isArray(data.origins)) {
        data.origins.forEach((org) => {
          if (org.origin && org.origin.includes('localhost')) {
            org.origin = baseUrl;
          }
        });
      }
      fs.writeFileSync(storageStatePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`Updated origins port in user.json to matching ${baseUrl}`);
    } catch (e) {
      console.error('Failed to update origins port:', e);
    }

    contextOptions.storageState = storageStatePath;
    console.log('Using storage state:', storageStatePath);
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  // 브라우저 콘솔 로그 캡처 등록
  page.on('console', (msg) => {
    console.log(`[BROWSER] [${msg.type()}] ${msg.text()}`);
  });

  try {
    console.log('Navigating to MyPage for profile setup check...');
    await page.goto(`${baseUrl}/my-page`, { waitUntil: 'load', timeout: 30000 });

    // 프로필 폼이 보이면 닉네임 설정
    const profileInput = page.locator('#nickname');
    try {
      await profileInput.waitFor({ state: 'visible', timeout: 4000 });
      console.log('Profile setup form visible (#nickname), filling nickname "E2ETester"...');
      await profileInput.fill('E2ETester');
      await page.click('button[type="submit"]');
      await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 });
      console.log('Successfully setup nickname, redirected to home.');
    } catch (e) {
      console.log('Profile setup form not visible or already set. Proceeding.');
    }

    // Viewports to check
    const viewports = [
      { name: 'iPhone-SE-like-narrow', width: 375, height: 600 },
      { name: 'iPhone-SE', width: 375, height: 667 },
      { name: 'Pixel-5', width: 393, height: 851 },
      { name: 'Extreme-Short', width: 360, height: 520 },
      { name: 'Galaxy-S20-Ultra', width: 412, height: 915 },
    ];

    for (const vp of viewports) {
      console.log(`\nConfiguring viewport: ${vp.name} (${vp.width}x${vp.height})`);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(500);

      // 1. 기초 카테고리 (숫자 키패드) - preview=true 적용
      const quizUrl = `${baseUrl}/quiz?mountain=math&world=World1&category=%EA%B8%B0%EC%B5%88&level=1&mode=time-attack&preview=true`;
      console.log(`Navigating to Quiz: ${quizUrl}`);
      await page.goto(quizUrl, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(2000); // UI 안정화 대기

      console.log(`Current URL before screenshot 1: ${page.url()}`);
      const screenshotPath = path.resolve(
        `C:\\Users\\ghkdd\\.gemini\\antigravity\\brain\\36e29b47-6f8e-40ad-ba50-21f57b88493f\\scratch\\screenshot-${vp.name}.png`
      );
      await page.screenshot({ path: screenshotPath });
      console.log(`Screenshot saved to: ${screenshotPath}`);

      // 2. 심화 카테고리 (QWERTY 키패드) - preview=true 적용 및 스위처 클릭
      const qwertyUrl = `${baseUrl}/quiz?mountain=math&world=World1&category=%EC%8B%AC%ED%99%94&level=1&mode=time-attack&preview=true`;
      console.log(`Navigating to Qwerty: ${qwertyUrl}`);
      await page.goto(qwertyUrl, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(2000);

      // QWERTY 키패드로 전환하기 위해 스위처 버튼 클릭
      const switcherBtn = page.locator('.preview-keyboard-switcher button').last();
      if (await switcherBtn.isVisible()) {
        console.log('Clicking switcher to activate Qwerty Keyboard...');
        await switcherBtn.click();
        await page.waitForTimeout(1000);
      }

      console.log(`Current URL before screenshot 2: ${page.url()}`);
      const screenshotQwertyPath = path.resolve(
        `C:\\Users\\ghkdd\\.gemini\\antigravity\\brain\\36e29b47-6f8e-40ad-ba50-21f57b88493f\\scratch\\screenshot-qwerty-${vp.name}.png`
      );
      await page.screenshot({ path: screenshotQwertyPath });
      console.log(`Qwerty Screenshot saved to: ${screenshotQwertyPath}`);

      // 3. 일본어 퀴즈 (진짜 3줄 QWERTY 텍스트 자판)
      const langUrl = `${baseUrl}/quiz?mountain=language&world=LangWorld1&category=%ED%9E%88%EB%9D%BC%EA%B0%80%EB%82%98&level=1&mode=time-attack&preview=true`;
      console.log(`Navigating to Japanese Quiz: ${langUrl}`);
      await page.goto(langUrl, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(2000);

      console.log(`Current URL before screenshot 3: ${page.url()}`);
      const screenshotLangPath = path.resolve(
        `C:\\Users\\ghkdd\\.gemini\\antigravity\\brain\\36e29b47-6f8e-40ad-ba50-21f57b88493f\\scratch\\screenshot-lang-${vp.name}.png`
      );
      await page.screenshot({ path: screenshotLangPath });
      console.log(`Japanese Qwerty Screenshot saved to: ${screenshotLangPath}`);
    }
  } catch (e) {
    console.error('An error occurred during capture sequence:', e.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  console.log('Capture sequence finished.');
})();
