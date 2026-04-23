import { defineConfig, devices } from '@playwright/experimental-ct-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * See https://playwright.dev/docs/test-components
 */
export default defineConfig({
  testDir: './src/components/__tests__',
  testMatch: '**/*.ct.spec.tsx', // CT 전용 테스트만 매칭
  testIgnore: '**/*.test.tsx', // Vitest 테스트 제외
  /* The base directory, relative to the config file, for snapshot files created with toHaveScreenshot and toMatchSnapshot. */
  snapshotDir: './__snapshots__',
  /* Maximum time one test can run for. */
  timeout: 10 * 1000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { outputFolder: 'reports/playwright-report-ct', open: 'never' }]],
  /* 테스트 결과물 저장 경로 */
  outputDir: 'reports/test-results-ct',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Port to use for Playwright HTTP server. */
    ctPort: 3100,

    /* Vite configuration */
    ctViteConfig: {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
