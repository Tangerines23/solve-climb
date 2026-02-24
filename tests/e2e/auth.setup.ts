import { test as setup } from '@playwright/test';
import type { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * E2E 세션 재사용: 익명 로그인 1회만 수행 후 storage state 저장.
 * 429 방지를 위해 모든 E2E에서 이 세션을 재사용합니다.
 */
const AUTH_FILE = '.auth/user.json';
const AUTH_WAIT_TIMEOUT_MS = 25000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAuth(page: Page, timeout = AUTH_WAIT_TIMEOUT_MS): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const hasAuth = await page.evaluate(() => {
      // Supabase auth token 또는 Local Session 존재 여부 확인
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('sb-') && key?.includes('auth')) return true;
        if (key === 'solve-climb-local-session') return true;
      }
      return false;
    });
    if (hasAuth) return true;
    await sleep(500);
  }
  return false;
}

setup('authenticate once (anonymous)', async ({ page }) => {
  setup.setTimeout(120000);

  const authPath = path.resolve(AUTH_FILE);
  if (fs.existsSync(authPath)) {
    const stat = fs.statSync(authPath);
    const hourAgo = Date.now() - 60 * 60 * 1000;
    if (stat.mtimeMs > hourAgo) {
      console.log('[auth.setup] Using cached auth file.');
      const content = fs.readFileSync(authPath, 'utf8');
      try {
        const data = JSON.parse(content);
        const currentPort = process.env.E2E_DEV_PORT || '5173';
        const expectedOrigin = `http://localhost:${currentPort}`;

        let originUpdated = false;
        if (Array.isArray(data.origins)) {
          data.origins.forEach((org: { origin: string }) => {
            if (org.origin && org.origin.includes('localhost')) {
              if (org.origin !== expectedOrigin) {
                console.log(`[auth.setup] Updating origin from ${org.origin} to ${expectedOrigin}`);
                org.origin = expectedOrigin;
                originUpdated = true;
              }
            }
          });
        }
        if (originUpdated) {
          fs.writeFileSync(authPath, JSON.stringify(data, null, 2), 'utf8');
        }
      } catch (e) {
        console.error('[auth.setup] Failed to rewrite origin in cached auth file:', e);
      }
      return;
    }
  }

  let authOk = false;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[auth.setup] Attempt ${attempt} starting...`);
    await page.goto('/', { waitUntil: 'networkidle' });

    // 1. 초기 인증 체크
    authOk = await waitForAuth(page, 5000);
    console.log(`[auth.setup] Initial auth check: ${authOk}, URL: ${page.url()}`);

    if (!authOk) {
      console.log('[auth.setup] Not authenticated. Navigating to MyPage Guest View...');
      if (!page.url().includes('/my-page')) {
        await page.goto('/my-page', { waitUntil: 'networkidle' });
      }

      // Guest View의 익명 로그인 버튼 대기 (MyPage.tsx:462)
      const anonymousBtn = page.locator('.my-page-guest-anonymous-link');
      try {
        await anonymousBtn.waitFor({ state: 'visible', timeout: 10000 });
        console.log('[auth.setup] Anonymous login link visible, clicking...');
        await anonymousBtn.click();

        // 클릭 후 세션이 생길 때까지 잠시 대기
        await sleep(2000);
      } catch (_e) {
        console.log('[auth.setup] Anonymous login link not found. URL:', page.url());
      }
    }

    // 2. 프로필 정보 입력 (닉네임 설정) 대기
    // MyPage.tsx 에서는 session은 있지만 profile.nickname이 없으면 ProfileForm을 보여줌
    console.log('[auth.setup] Checking for Profile Form...');
    const nicknameInput = page.locator('#nickname');
    try {
      // 닉네임 입력란이 보이나 최대 10초 대기
      await nicknameInput.waitFor({ state: 'visible', timeout: 10000 });

      console.log('[auth.setup] Filling nickname');
      await nicknameInput.fill(`Test${Date.now().toString().slice(-4)}`);

      // 제출 버튼 클릭 전 잠시 대기 (입력 이벤트 반영)
      await sleep(500);

      // 제출 버튼 클릭
      await page.click('button[type="submit"]');

      console.log('[auth.setup] Profile submitted. Waiting for redirect...');
      // 제출 후 앱이 홈('/')으로 보내주길 기다림
      await page.waitForURL((url) => url.pathname === '/', { timeout: 15000 });
      console.log('[auth.setup] Redirected to home.');
    } catch (_e) {
      console.log(
        '[auth.setup] Profile Form did not appear or timed out. Current URL:',
        page.url()
      );
    }

    // 3. 최종 인증 및 프로필 완료 상태 확인
    authOk = await waitForAuth(page, 10000);
    if (authOk) {
      // 추가로 닉네임이 로컬에 저장되었는지 확인 (옵션)
      const profileComplete = await page.evaluate(() => {
        let activeId = localStorage.getItem('solve-climb-active-profile-id');
        if (!activeId) return false;
        // LocalStorageService stringifies everything, including strings, so we need to strip quotes
        activeId = activeId.replace(/^"|"$/g, '');

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('solve-climb-profiles-')) {
            try {
              const profiles = JSON.parse(localStorage.getItem(key) || '[]');
              const activeProfile = profiles.find(
                (p: { profileId: string; nickname?: string }) => p.profileId === activeId
              );
              if (activeProfile?.nickname) return true;
            } catch (_e) {
              /* ignore */
            }
          }
        }
        return false;
      });
      console.log(
        `[auth.setup] Final check - authOk: ${authOk}, profileComplete: ${profileComplete}`
      );
      if (profileComplete) {
        // 마지막으로 my-page로 이동하여 헤더가 보이는지 확인 (상태 확정)
        await page.goto('/my-page', { waitUntil: 'networkidle' });
        const headerVisible = await page.locator('.my-page-header').isVisible();
        console.log(`[auth.setup] Header visibility check: ${headerVisible}`);
        if (headerVisible) break;
      }
    }

    if (attempt < MAX_ATTEMPTS) {
      const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
      console.log(`[auth.setup] Retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }

  // 저장 전 마지막으로 networkidle 상태 대기 (스테이트 안정화)
  await page.waitForLoadState('networkidle');

  const authDir = path.dirname(authPath);
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
  console.log('[auth.setup] Storage state saved to', AUTH_FILE);
});
