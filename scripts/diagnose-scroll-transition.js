import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

(async () => {
  console.log('Launching browser for full scroll transition diagnosis...');
  const browser = await chromium.launch();

  const storageStatePath = path.resolve('.auth/user.json');
  const contextOptions = {
    viewport: { width: 375, height: 812 },
  };

  if (fs.existsSync(storageStatePath)) {
    contextOptions.storageState = storageStatePath;
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  // Patch HTMLElement.prototype.scrollTo
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

  try {
    // 1. Go to Home Page
    console.log('1. Navigating to Home Page...');
    await page.goto(baseUrl, { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // Profile form fill if visible
    const profileInput = page.locator('#nickname');
    if (await profileInput.isVisible()) {
      await profileInput.fill('Tester');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }

    // 2. Click "수학의 산" to go to Category Select
    console.log('2. Clicking "수학의 산"...');
    await page.click('text=수학의 산');
    await page.waitForTimeout(1000);

    // 3. Click "기초" category to enter Level Select (World 1)
    console.log('3. Clicking "기초" category...');
    await page.click('text=기초 (Training)');
    await page.waitForTimeout(3000); // Wait for Level Select page load and scroll

    // 4. Switch to World 2 using switcher
    console.log('4. Clicking Next World switcher...');
    await page.click('.world-switch-btn.next');
    await page.waitForTimeout(3000); // Wait for transition and scroll

    // 5. Switch back to World 1
    console.log('5. Clicking Prev World switcher to return to World 1...');
    await page.click('.world-switch-btn.prev');
    await page.waitForTimeout(3000); // Wait for transition and scroll
  } catch (e) {
    console.error('Diagnosis failed:', e);
  } finally {
    await browser.close();
  }
  console.log('Diagnosis finished.');
})();
