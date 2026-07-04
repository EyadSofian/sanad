import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['**/node_modules/**', 'web/dist/**', 'web/dev-dist/**', 'coverage/**', 'server/prisma/migrations/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['web/src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    rules: {
      // React 18 automatic JSX runtime: component identifiers are "used" by JSX.
      // `motion` is framer-motion's lowercase JSX namespace (<motion.div>).
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^([A-Z_]|motion$)' }],
    },
  },
];
