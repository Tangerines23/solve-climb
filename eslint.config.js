import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import security from 'eslint-plugin-security';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.agent', 'scripts/archive'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      security.configs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      security,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/__tests__/**', 'src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    plugins: {
      boundaries,
    },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
      'boundaries/elements': [
        {
          type: 'component',
          pattern: 'src/components/**',
        },
        {
          type: 'component/quiz',
          pattern: 'src/components/quiz/**',
          mode: 'folder',
        },
        {
          type: 'component/my',
          pattern: 'src/components/my/**',
          mode: 'folder',
        },
        {
          type: 'component/algebra',
          pattern: 'src/components/algebra/**',
          mode: 'folder',
        },
        {
          type: 'component/roadmap',
          pattern: 'src/components/roadmap/**',
          mode: 'folder',
        },
        {
          type: 'component/common',
          pattern: 'src/components/common/**',
          mode: 'folder',
        },
        {
          type: 'component/ui',
          pattern: 'src/components/ui/**',
          mode: 'folder',
        },
        {
          type: 'feature/quiz',
          pattern: 'src/features/quiz/**',
        },
        {
          type: 'feature/quiz/internal',
          pattern: 'src/features/quiz/!(index.ts)**',
          private: true,
        },
        {
          type: 'feature/quiz/public',
          pattern: 'src/features/quiz/index.ts',
        },
        {
          type: 'hook',
          pattern: 'src/hooks/**',
        },
        {
          type: 'util',
          pattern: 'src/utils/**',
        },
        {
          type: 'store',
          pattern: 'src/stores/**',
        },
        {
          type: 'page',
          pattern: 'src/pages/**',
        },
        {
          type: 'type',
          pattern: 'src/types/**',
        },
        {
          type: 'config',
          pattern: 'src/config/**',
        },
        {
          type: 'context',
          pattern: 'src/contexts/**',
        },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: { type: 'component' },
              disallow: [{ to: { type: 'util' } }, { to: { type: 'store' } }],
              message:
                'UI Components must not import Utils or Stores directly. Use Hooks as a bridge.',
            },
            {
              from: { type: 'page' },
              disallow: [{ to: { type: 'util' } }, { to: { type: 'store' } }],
              message: 'Pages must not import Utils or Stores directly. Use Hooks as a bridge.',
            },
            {
              from: { type: 'hook' },
              disallow: [{ to: { type: 'component' } }, { to: { type: 'page' } }],
              message: 'Hooks must not import UI Components or Pages.',
            },
            {
              from: { type: 'util' },
              disallow: [
                { to: { type: 'hook' } },
                { to: { type: 'store' } },
                { to: { type: 'component' } },
                { to: { type: 'page' } },
              ],
              message: 'Utils must be pure and not depend on Hooks, Stores, or UI.',
            },
            {
              from: { type: 'store' },
              disallow: [
                { to: { type: 'component' } },
                { to: { type: 'page' } },
                { to: { type: 'hook' } },
              ],
              message: 'Stores must not depend on UI or Hooks.',
            },
            {
              from: { type: 'component/quiz' },
              disallow: [{ to: { type: 'component/my' } }, { to: { type: 'component/roadmap' } }],
              message:
                'Quiz components should not depend on MyPage or Roadmap components directly.',
            },
            {
              from: { type: 'component/my' },
              disallow: [{ to: { type: 'component/quiz' } }, { to: { type: 'component/roadmap' } }],
              message:
                'MyPage components should not depend on Quiz or Roadmap components directly.',
            },
            {
              from: { type: 'component/roadmap' },
              disallow: [{ to: { type: 'component/my' } }],
              message:
                'Roadmap components should not depend on MyPage components directly.',
            },
            {
              from: '*',
              disallow: [{ to: { type: 'feature/quiz/internal' } }],
              message: 'Quiz feature internals must not be accessed from outside. Use the barrel file (@/features/quiz) instead.',
            },
            {
              from: { type: 'feature/quiz/internal' },
              allow: [{ to: { type: 'feature/quiz/internal' } }, { to: { type: 'type' } }, { to: { type: 'config' } }, { to: { type: 'util' } }, { to: { type: 'context' } }],
              disallow: [{ to: { type: 'store' } }, { to: { type: 'hook' } }],
              message: 'Quiz feature internals should use internal relative paths and avoid legacy global stores/hooks where possible.',
            },
          ],
        },
      ],
    },
  }
);
