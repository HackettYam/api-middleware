// Modern ESLint configuration for v9.0.0+ (CommonJS format)
const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");

const compat = new FlatCompat();

module.exports = [
  // Ignore patterns (replaces .eslintignore)
  {
    ignores: [
      // Build artifacts
      "dist/**",
      "build/**",
      // Dependencies
      "node_modules/**",
      // Test coverage
      "coverage/**",
      // Configuration files
      "*.config.js",
      "commitlint.config.js",
    ]
  },
  // Base JS configuration
  js.configs.recommended,
  // TypeScript configuration
  ...compat.config({
    extends: ["plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    parserOptions: {
      project: "./tsconfig.json",
      ecmaVersion: 2020,
      sourceType: "module"
    }
  }),
  // React configuration
  ...compat.config({
    extends: [
      "plugin:react/recommended",
      "plugin:react-hooks/recommended"
    ],
    settings: {
      react: {
        version: "detect"
      }
    }
  }),
  // Override rules for specific file patterns
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      
      // React specific rules
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
    }
  }
];
