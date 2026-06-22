import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('Starting standalone capture script...');
  const browser = await chromium.launch({ headless: true });
  let baseUrl = '';

  // 포트 감지
  for (const p of [5173, 5174, 5175]) {
    try {
      const page = await browser.newPage();
      await page.goto(`http://localhost:${p}`, { timeout: 3000 });
      await page.close();
      baseUrl = `http://localhost:${p}`;
      console.log(`Detected server on port ${p}`);
      break;
    } catch (e) {
      // ignore
    }
  }

  if (!baseUrl) {
    console.error('Server not detected! Make sure npm run dev is running.');
    await browser.close();
    process.exit(1);
  }

  const storageStatePath = path.resolve('.auth/user.json');
  const contextOptions = {};
  if (fs.existsSync(storageStatePath)) {
    contextOptions.storageState = storageStatePath;
    console.log('Using storage state:', storageStatePath);
  } else {
    console.log('Storage state file not found. Running without pre-auth context.');
  }

  // 모바일 뷰포트 크기로 컨텍스트 생성
  const context = await browser.newContext({
    ...contextOptions,
    viewport: { width: 393, height: 851 }, // Pixel 5 와 유사한 모바일 화면
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  const outputDir = `C:\\Users\\ghkdd\\.gemini\\antigravity\\brain\\36e29b47-6f8e-40ad-ba50-21f57b88493f`;

  try {
    // 1. 레벨 선택 페이지로 진입 (World1 - 수와 연산) - category 쿼리파라미터를 디코딩 우회하기 위해 한글로 명시
    const initialUrl = `${baseUrl}/level-select?mountain=math&world=World1&category=기초`;
    console.log(`Navigating to: ${initialUrl}`);
    await page.goto(initialUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // 만약 프로필 입력 화면이 감지되거나 로딩 중일 경우 최대 5초 대기
    try {
      await Promise.race([
        page.waitForSelector('.world-switch-btn.next', { timeout: 5000 }),
        page.waitForSelector('#nickname', { timeout: 5000 }),
      ]);
    } catch (e) {
      console.log('Timeout waiting for target elements, current url:', page.url());
    }

    const isProfilePage = await page
      .locator('#nickname')
      .isVisible()
      .catch(() => false);
    if (isProfilePage) {
      console.log('Profile setup detected. Setting unique nickname...');
      const uniqueNickname = `Test${Math.floor(1000 + Math.random() * 9000)}`;
      const input = page.locator('#nickname');
      await input.click();
      await input.fill('');
      await page.waitForTimeout(500);
      await input.pressSequentially(uniqueNickname, { delay: 100 });
      await page.waitForTimeout(500);

      const val = await input.inputValue();
      console.log('Input value is:', val);

      await page.click('.profile-form-submit');
      console.log(
        `Submitted profile form with nickname: ${uniqueNickname}. Waiting for navigation...`
      );
      await page.waitForTimeout(4000);

      // 쿼리 파라미터가 유실되었거나 정상 URL이 아니면 다시 레벨 선택으로 강제 이동
      const currentUrl = page.url();
      if (!currentUrl.includes('mountain=') || !currentUrl.includes('category=')) {
        console.log(`Query parameters lost. Redirecting to initial URL: ${initialUrl}`);
        await page.goto(initialUrl, { waitUntil: 'networkidle', timeout: 30000 });
      }
    }

    // 화면 에러가 있는지 디버깅 로그 출력
    const errorText = await page
      .locator('.level-select-error')
      .innerText()
      .catch(() => '');
    if (errorText) {
      console.log('Detected level select page error:', errorText.replace(/\n/g, ' '));
    }

    // 로딩 및 애니메이션 완료 대기
    await page.waitForTimeout(3000);
    const p1 = path.join(outputDir, 'world1_initial.png');
    await page.screenshot({ path: p1 });
    console.log(`Captured World 1 to: ${p1}`);

    // 2. 다음 월드 버튼(World2 - 확률과 통계) 클릭
    console.log('Clicking next world button (to World 2)...');
    await page.click('.world-switch-btn.next');

    // 시트가 다 내려가고(300ms) + 트랜지션 애니메이션이 절반 진행된(400ms) 시점인 700ms에 캡처
    await page.waitForTimeout(700);
    const p2 = path.join(outputDir, 'world2_switched.png');
    await page.screenshot({ path: p2 });
    console.log(`Captured World 2 (transitional mid-phase) to: ${p2}`);

    // 3. 다음 월드 버튼(World3 - 도형과 공간) 클릭
    console.log('Clicking next world button (to World 3)...');
    await page.click('.world-switch-btn.next');

    await page.waitForTimeout(3000);
    const p3 = path.join(outputDir, 'world3_switched.png');
    await page.screenshot({ path: p3 });
    console.log(`Captured World 3 to: ${p3}`);

    // 4. 다음 월드 버튼(World4 - 공학 및 응용) 클릭
    console.log('Clicking next world button (to World 4)...');
    await page.click('.world-switch-btn.next');

    await page.waitForTimeout(3000);
    const p4 = path.join(outputDir, 'world4_switched.png');
    await page.screenshot({ path: p4 });
    console.log(`Captured World 4 to: ${p4}`);
  } catch (e) {
    console.error('Failed to capture:', e.stack || e.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  console.log('Capture completed.');
})();
