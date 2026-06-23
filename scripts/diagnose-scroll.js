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

  // Mock Supabase auth API requests to avoid 429 Rate Limits and 403 Forbidden redirects
  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/v1/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'bbeac0c8-2d1b-458c-9eba-4126d8c8e926',
          email: 'tester@example.com',
          user_metadata: { nickname: 'DiagnosisTester' },
          role: 'authenticated',
          aud: 'authenticated',
        }),
      });
    } else if (url.includes('/auth/v1/token')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock.jwt.token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock_refresh_token',
          user: {
            id: 'bbeac0c8-2d1b-458c-9eba-4126d8c8e926',
            email: 'tester@example.com',
            user_metadata: { nickname: 'DiagnosisTester' },
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{}',
      });
    }
  });

  // Patch HTMLElement.prototype.scrollTo to log arguments and call stacks
  await page.addInitScript(() => {
    // Inject Mock Supabase Session to bypass 429 rate limit redirect
    localStorage.setItem(
      'sb-aekcjzxxjczqibxkoakg-auth-token',
      JSON.stringify({
        access_token: 'mock.jwt.token',
        refresh_token: 'mock_refresh_token',
        user: {
          id: 'bbeac0c8-2d1b-458c-9eba-4126d8c8e926',
          email: 'tester@example.com',
          user_metadata: { nickname: 'DiagnosisTester' },
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      })
    );

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
  const targetUrl = `${baseUrl}/level-select?mountain=math&world=World1&category=%EA%B8%B0%EC%B4%88`;

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

    // Wait for ClimbGraphic to render in DOM
    const mapContainer = page.locator('.level-map-container');
    try {
      await mapContainer.waitFor({ state: 'attached', timeout: 5000 });
      console.log('ClimbGraphic is attached to DOM!');
    } catch {
      console.log('ClimbGraphic is NOT attached to DOM!');
    }

    await page.waitForTimeout(4000);
    console.log('Current URL at end:', page.url());
  } catch (e) {
    console.error('Diagnosis failed:', e);
  } finally {
    await browser.close();
  }
  console.log('Diagnosis finished.');
})();
