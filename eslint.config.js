// ESLint v9 configuration
const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");

const compat = new FlatCompat();

module.exports = [
  // Ignore patterns (replaces .eslintignore)
  {
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**",
      "coverage/**",
      "*.config.js",
      "commitlint.config.js",
    ]
  },
  // Base JS configuration
  js.configs.recommended,
  // TypeScript configuration using compatibility layer
  ...compat.config({
    extends: ["plugin:@typescript-eslint/recommended"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module"
    }
  }),
  // Override rules for specific file patterns
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // Disable specific rules that might be causing problems
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off"
    }
  }
];
