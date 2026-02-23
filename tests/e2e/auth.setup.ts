import { test as setup } from '@playwright/test';
import type { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * E2E 세션 재사용: 익명 로그인 1회만 수행 후 storage state 저장.
 * 429 방지를 위해 모든 E2E에서 이 세션을 재사용합니다.
 * Supabase 429/일시 오류 시 재시도 + 지수 백오프로 플래키 감소.
 */
const AUTH_FILE = '.auth/user.json';
const AUTH_WAIT_TIMEOUT_MS = 25000; // 1회 대기 25초
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 2000; // 2s, 4s, 8s

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAuth(page: Page): Promise<boolean> {
  try {
    await page.waitForFunction(
      () => {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('sb-') && key?.includes('auth')) return true;
        }
        return false;
      },
      { timeout: AUTH_WAIT_TIMEOUT_MS }
    );
    return true;
  } catch {
    return false;
  }
}

setup('authenticate once (anonymous)', async ({ page }) => {
  setup.setTimeout(90000); // 재시도 포함 90초

  const authPath = path.resolve(AUTH_FILE);
  if (fs.existsSync(authPath)) {
    const stat = fs.statSync(authPath);
    const hourAgo = Date.now() - 60 * 60 * 1000;
    if (stat.mtimeMs > hourAgo) {
      return;
    }
  }

  let authOk = false;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    authOk = await waitForAuth(page);
    console.log(`[auth.setup] attempt ${attempt}: authOk = ${authOk}, url = ${page.url()}`);
    if (authOk) {
      // 익명 로그인 버튼 대기 (선택적)
      const anonymousBtn = page.getByText('익명 로그인하기');
      try {
        await anonymousBtn.waitFor({ state: 'visible', timeout: 3000 });
        await anonymousBtn.click();
      } catch (_e) {
        // 무시: 자동 익명 로그인이 활성화되어 이미 넘어갔을 수 있음
      }

      // 프로필 입력 폼 대기 (마이페이지 리다이렉트를 고려하여 대기)
      const nicknameInput = page.locator('#nickname');
      try {
        // Redirection might take a moment, so wait for the input.
        await nicknameInput.waitFor({ state: 'visible', timeout: 5000 });
        console.log('[auth.setup] Filling nickname');
        await nicknameInput.fill('SmokeTester');
        await page.click('button[type="submit"]');

        console.log('[auth.setup] Waiting for redirect after submit...');
        await page.waitForURL('**/?(redirectPath=*)', { timeout: 10000 });

        // 홈 또는 딴 곳에 도착해야 함
        await page.waitForFunction(
          () => {
            return (
              window.location.pathname === '/' || window.location.pathname === '/category-select'
            );
          },
          { timeout: 10000 }
        );
        console.log('[auth.setup] Redirect completed!');
      } catch (e) {
        console.log(`[auth.setup] Profile creation skipped or failed: ${e}`);
        // 만약 못찾았다면 현재 URL이 정상적인 페이지인지 확인
        if (page.url().includes('my-page')) {
          console.error('[auth.setup] Stuck on my-page without nickname input!');
          throw new Error('Stuck on my-page during setup');
        }
      }
      break;
    }

    if (attempt < MAX_ATTEMPTS) {
      const backoffMs = BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
      await sleep(backoffMs);
    }
  }

  // 429 등으로 세션 없어도 저장해 두면, 이후 테스트에서 앱이 재시도함
  const authDir = path.dirname(authPath);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  await page.context().storageState({ path: AUTH_FILE });
});
