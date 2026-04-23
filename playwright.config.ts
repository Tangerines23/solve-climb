import { defineConfig, devices } from '@playwright/test';

/**
 * E2E 테스트용 포트.
 * E2E_DEV_PORT가 설정되어 있으면 사용, 아니면 5173.
 * run-playwright-with-port.js를 통해 포트 점유 시 자동으로 다른 포트 사용.
 */
const DEV_PORT = parseInt(process.env.E2E_DEV_PORT || '5173', 10);
const BASE_URL = `http://localhost:${DEV_PORT}`;

/**
 * Playwright 설정 파일
 * Vite 개발 서버와 연동하여 E2E 및 시각적 회귀 테스트를 수행합니다.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* 전체 테스트 스위트 최대 실행 시간 (5분) - 무한 대기 방지 */
  globalTimeout: 300000,
  /* 개별 테스트 기본 타임아웃 */
  timeout: 60000,
  /* 각각의 테스트를 독립적으로 실행하도록 설정 */
  fullyParallel: true,
  /* CI 환경이 아닐 경우 실패 시 재시도 횟수 */
  retries: process.env.CI ? 2 : 0,
  /* 병렬 실행 worker 수 */
  workers: process.env.CI ? 1 : undefined,
  /* 테스트 결과 리포터 설정 */
  reporter: [['html', { outputFolder: 'reports/playwright-report', open: 'never' }]],
  /* 테스트 결과물(스크린샷, 비디오 등) 저장 경로 */
  outputDir: 'reports/test-results',

  use: {
    /* 테스트 중 사용할 기본 주소 (동적 포트 지원) */
    baseURL: BASE_URL,

    /* 테스트 실패 시 스크린샷 캡처 */
    screenshot: 'only-on-failure',

    /* 실패 시 비디오 기록 (디버깅 용도) */
    video: 'on-first-retry',

    /* 브라우저 컨텍스트 설정 */
    trace: 'on-first-retry',
  },

  /* 프로젝트별 브라우저 설정 (setup → chromium, 세션 재사용으로 429 방지) */
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  /* 테스트 실행 전 로컬 개발 서버를 자동으로 구동 */
  webServer: {
    command: `cross-env DEV_PORT=${DEV_PORT} npm run dev`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      VITE_CI: 'true',
      E2E_DEV_PORT: process.env.E2E_DEV_PORT || '5173',
    },
  },

  /* 스냅샷(스크린샷 기준점) 저장 경로 설정 */
  snapshotDir: './tests/e2e/snapshots',
});
