import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 설정 파일
 * Vite 개발 서버와 연동하여 E2E 및 시각적 회귀 테스트를 수행합니다.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* 각각의 테스트를 독립적으로 실행하도록 설정 */
  fullyParallel: true,
  /* CI 환경이 아닐 경우 실패 시 재시도 횟수 */
  retries: process.env.CI ? 2 : 0,
  /* 병렬 실행 worker 수 */
  workers: process.env.CI ? 1 : undefined,
  /* 테스트 결과 리포터 설정 */
  reporter: 'html',

  use: {
    /* 테스트 중 사용할 기본 주소 (Vite 기본 포트) */
    baseURL: 'http://localhost:5173',

    /* 테스트 실패 시 스크린샷 캡처 */
    screenshot: 'only-on-failure',

    /* 실패 시 비디오 기록 (디버깅 용도) */
    video: 'on-first-retry',

    /* 브라우저 컨텍스트 설정 */
    trace: 'on-first-retry',
  },

  /* 프로젝트별 브라우저 설정 (현재는 Chromium 위주) */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /* 필요 시 다른 브라우저 추가 가능 */
  ],

  /* 테스트 실행 전 로컬 개발 서버를 자동으로 구동 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  /* 스냅샷(스크린샷 기준점) 저장 경로 설정 */
  snapshotDir: './tests/e2e/snapshots',
});
