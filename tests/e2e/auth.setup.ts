import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * E2E 세션 재사용: 익명 로그인 1회만 수행 후 storage state 저장.
 * 429 방지를 위해 모든 E2E에서 이 세션을 재사용합니다.
 */
const AUTH_FILE = '.auth/user.json';

setup('authenticate once (anonymous)', async ({ page }) => {
  setup.setTimeout(60000); // 60초로 단축 (기존 세션 있으면 빠르게 완료)

  // 기존 auth 파일이 있고 최근 1시간 이내라면 빠르게 건너뛰기
  const authPath = path.resolve(AUTH_FILE);
  if (fs.existsSync(authPath)) {
    const stat = fs.statSync(authPath);
    const hourAgo = Date.now() - 60 * 60 * 1000;
    if (stat.mtimeMs > hourAgo) {
      // 기존 세션 유효 (1시간 이내) → 바로 종료
      return;
    }
  }

  await page.goto('/');
  await page.waitForLoadState('load'); // networkidle 대신 load 사용

  // 앱의 getSession → signInAnonymously() 비동기 완료 대기
  await page.waitForFunction(
    () => {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('sb-') && key?.includes('auth')) return true;
      }
      return false;
    },
    { timeout: 20000 }
  ).catch(() => {
    // 429 등으로 세션 없어도 저장해 두면, 이후 테스트에서 앱이 재시도함
  });

  await page.context().storageState({ path: AUTH_FILE });
});
