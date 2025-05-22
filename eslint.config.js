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

  // TypeScript configuration - for files in src
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
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
  },

  // Next.js configuration for APIs - for files in src
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ...compat.config({
      extends: ['plugin:@next/next/recommended'],
    }),
  },

  // Import plugin for optimizing imports - for files in src
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ...compat.config({
      extends: ['plugin:import/recommended', 'plugin:import/typescript'],
      plugins: ['import'],
      settings: {
        'import/resolver': {
          typescript: {},
        },
      },
    }),
  },

  // Scripts configuration - JavaScript specific
  {
    files: ['scripts/**/*.js'],
    // Use standard JavaScript ESLint config for scripts
    languageOptions: {
      // No TypeScript parser for JavaScript files
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'commonjs',
      },
      globals: {
        // Node.js globals
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      // Allow console.log in scripts
      'no-console': 'off',
      // Allow process.exit in scripts
      'no-process-exit': 'off',
      // Allow unused catch parameters
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      // Disable TypeScript rules for JavaScript files
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

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
