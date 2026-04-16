import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfigCallback from './vite.config.js';

const baseConfig =
  typeof baseConfigCallback === 'function'
    ? baseConfigCallback({ mode: 'test', command: 'serve' })
    : baseConfigCallback;

export default mergeConfig(baseConfig, {
  test: {
    name: 'unit',
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: [],
    testTimeout: 10000,
    hookTimeout: 10000,
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 4,
      },
    },
  },
});
