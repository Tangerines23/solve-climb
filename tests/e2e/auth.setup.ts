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
    await page.waitForLoadState('load');

    authOk = await waitForAuth(page);
    if (authOk) break;

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
