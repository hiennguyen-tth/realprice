/** @type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser', // 👈 thêm
  plugins: ['@typescript-eslint'],     // 👈 thêm
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended', // 👈 thêm luôn cho đủ
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "warn",
    "react/display-name": "off",
    "prefer-const": "error",
  },
};