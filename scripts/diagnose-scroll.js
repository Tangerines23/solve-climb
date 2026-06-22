import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

(async () => {
  console.log('Launching browser for scroll diagnosis...');
  const browser = await chromium.launch();

  const storageStatePath = path.resolve('.auth/user.json');
  const contextOptions = {
    viewport: { width: 375, height: 812 },
  };

  if (fs.existsSync(storageStatePath)) {
    contextOptions.storageState = storageStatePath;
    console.log('Using storage state:', storageStatePath);
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  // Patch HTMLElement.prototype.scrollTo to log arguments and call stacks
  await page.addInitScript(() => {
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    HTMLElement.prototype.scrollTo = function (options, ...args) {
      const className = this.className || this.tagName;
      const stack = new Error().stack;
      console.log(
        `[SCROLLTO] element: ${className}, options: ${JSON.stringify(options)}, stack: ${stack.split('\n')[2]}`
      );
      return originalScrollTo.apply(this, [options, ...args]);
    };

    // Also listen to general scroll events on map-area
    document.addEventListener(
      'scroll',
      (e) => {
        const target = e.target;
        if (target && target.classList && target.classList.contains('map-area')) {
          console.log(`[SCROLL_EVENT] scrollTop: ${target.scrollTop}`);
        }
      },
      true
    );
  });

  page.on('console', (msg) => {
    console.log(`[BROWSER] ${msg.text()}`);
  });

  const baseUrl = 'http://localhost:5173';
  const targetUrl = `${baseUrl}/level-select?mountain=math&world=World1&category=%EA%B8%B0%EC%B5%88`;

  try {
    console.log('Navigating to MyPage for profile setup check...');
    await page.goto(`${baseUrl}/my-page`, { waitUntil: 'load', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Profile form fill if visible
    const profileInput = page.locator('#nickname');
    try {
      await profileInput.waitFor({ state: 'visible', timeout: 3000 });
      console.log('Profile setup form visible, filling nickname...');
      await profileInput.fill('DiagnosisTester');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1500);
      console.log('Nickname set submitted.');
    } catch {
      console.log('Profile form not visible, proceeding.');
    }

    console.log(`Navigating directly to: ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'load' });

    // Wait for ClimbGraphic to render
    const mapContainer = page.locator('.level-map-container');
    try {
      await mapContainer.waitFor({ state: 'visible', timeout: 3000 });
      console.log('ClimbGraphic is visible on page!');
    } catch {
      console.log('ClimbGraphic is NOT visible on page!');
    }

    await page.waitForTimeout(3000);
    console.log('Current URL at end:', page.url());
  } catch (e) {
    console.error('Diagnosis failed:', e);
  } finally {
    await browser.close();
  }
  console.log('Diagnosis finished.');
})();
