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
      'node_modules',
      'android/**',
      'proxy-server/**',
      'playwright-report/**',
      'test-results/**',
      '**/*.js.map',
    ],
  },
  js.configs.recommended,
  {
    plugins: {
      security,
    },
    rules: {
      ...security.configs.recommended.rules,
    },
  },
  {
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['**/*.backup.tsx', '**/*.refactored.tsx'],
    languageOptions: {
      parser: tsparser,
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
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
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-undef': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/new-features/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  ...storybook.configs['flat/recommended'],
  {
    files: ['scripts/**/*.{js,cjs}', 'scripts/*.{js,cjs}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-object-injection': 'off',
      'security/detect-child-process': 'off',
      'security/detect-non-literal-require': 'off',
      'security/detect-non-literal-regexp': 'off',
    },
  },
];
