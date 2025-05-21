/**
 * ESLint v9 Configuration
 * Modern flat configuration format for the @hackettyam/api-middleware library
 * Optimized for REST API middleware development with TypeScript
 */
const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const eslintConfigPrettier = require('eslint-config-prettier');

const compat = new FlatCompat();

module.exports = [
  // Ignore patterns - ESLint v9 uses ignores property instead of .eslintignore
  {
    ignores: [
      'dist/**',
      'build/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js', // Except eslint.config.js which is not ignored
      'commitlint.config.js',
      'examples/**/*.js',
      '**/.next/**',
      '**/out/**',
      '.lintstagedrc.json',
    ],
  },
  // Base JS configuration
  js.configs.recommended,

  // TypeScript configuration
  ...compat.config({
    extends: [
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
    ],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    parserOptions: {
      project: './tsconfig.json',
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  }),

  // Next.js configuration for APIs
  ...compat.config({
    extends: ['plugin:@next/next/recommended'],
  }),

  // Import plugin for optimizing imports
  ...compat.config({
    extends: ['plugin:import/recommended', 'plugin:import/typescript'],
    plugins: ['import'],
    settings: {
      'import/resolver': {
        typescript: {},
      },
    },
  }),

  // Specific rules for Next.js API Routes/Middleware
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-misused-promises': [
        'warn',
        {
          checksVoidReturn: false, // Important for API handlers that return void
        },
      ],

      // Modern practices for imports and exports
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-duplicate-imports': 'off', // Disabled in favor of import/no-duplicates
      'import/no-duplicates': 'warn',
      'sort-imports': [
        'warn',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true, // Because we use import/order for this
        },
      ],
    },
  },

  // JavaScript configuration - for config files
  {
    files: ['*.js', '*.cjs'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  // Common style rules for all files
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx', '**/*.jsx'],
    rules: {
      // Prefer single quotes
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],

      // No semicolons
      semi: ['error', 'never'],

      // Consistent object literal property quotes
      'quote-props': ['error', 'as-needed'],
    },
  },

  // Prettier should be last to override other formatting rules
  eslintConfigPrettier,
];
