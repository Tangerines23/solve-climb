// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import security from 'eslint-plugin-security';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      '**/dist/**',
      'apps-in-toss-examples-main',
      'node_modules',
      'android/**',
      'proxy-server/**',
      'playwright/.cache/**',
      'playwright-report/**',
      'test-results/**',
      '**/*.js.map',
    ],
  },
  js.configs.recommended,
  security.configs.recommended,
  reactHooks.configs['recommended-latest'],
  reactRefresh.configs.vite,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['**/*.backup.tsx', '**/*.refactored.tsx'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^[A-Z_]|^_',
          argsIgnorePattern: '^[A-Z_]|^_',
          caughtErrorsIgnorePattern: '^[A-Z_]|^_',
        },
      ],
      'no-unused-vars': 'off', // TypeScript 규칙 사용
      '@typescript-eslint/no-explicit-any': 'warn', // any 타입 경고로 변경
      'no-undef': 'off', // TypeScript가 타입 체크를 하므로 off
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // 새 기능 디렉토리에 대해서만 any 타입을 엄격하게 검사
  // 기존 코드는 warn 유지, 새 코드는 error로 설정
  {
    files: ['src/new-features/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error', // 새 코드는 엄격하게
    },
  },
  ...storybook.configs['flat/recommended'],
  // Scripts override at the end for highest precedence
  {
    files: ['scripts/**/*.{js,cjs}', 'scripts/*.{js,cjs}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^[A-Z_]|^_',
          argsIgnorePattern: '^[A-Z_]|^_',
          caughtErrorsIgnorePattern: '^[A-Z_]|^_',
        },
      ],
      'no-undef': 'off',
      // Disable all security rules for scripts
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-child-process': 'off',
      'security/detect-non-literal-require': 'off',
      'security/detect-non-literal-regexp': 'off',
    },
  },
];
