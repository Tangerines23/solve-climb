import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfigCallback from './vite.config.js';

const baseConfig =
  typeof baseConfigCallback === 'function'
    ? baseConfigCallback({ mode: 'test', command: 'serve' })
    : baseConfigCallback;

export default mergeConfig(baseConfig, {
  test: {
    name: 'integration',
    include: [
      '**/storage.test.ts',
      '**/debugPresets.test.ts',
      '**/debugPresets.error.test.ts',
      '**/useHistoryData.test.ts',
    ],
    pool: 'forks',
    forks: {
      singleFork: true,
    },
    testTimeout: 10000,
  },
});
