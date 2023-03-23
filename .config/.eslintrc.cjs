/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  // Ignore the submodule directories
  ignorePatterns: ['protochess-engine', 'chessgroundx', 'functions'],
  rules: {
    // Use '_' as a prefix for unused variables
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'quotes': ['warn', 'single'],
    'semi': ['warn', 'never'],
    'no-trailing-spaces': ['warn', { skipBlankLines: true }],
  }
}
