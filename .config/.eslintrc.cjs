/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  'extends': [
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'eslint:recommended',
    '@vue/eslint-config-typescript'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest'
  },
  // Ignore the submodule directories
  // Also ignore the functions directory and any file that ends with .guard.ts
  ignorePatterns: ['protochess-engine', 'chessgroundx', 'functions', '*.guard.ts', 'src/make-moderator.mjs'],
  plugins: [
    'import',
    'sort-imports-es6-autofix',
  ],
  rules: {
    'import/no-unresolved': 0,
    'quotes': ['warn', 'single'],
    'semi': ['warn', 'never'],
    'object-curly-spacing': ['warn', 'always'],
    'no-trailing-spaces': ['warn', { skipBlankLines: true }],
    // Use '_' as a prefix for unused variables
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'vue/script-indent': ['warn', 2, { baseIndent: 1 }],
    'vue/html-indent': ['warn', 2, { baseIndent: 1 }],
    'comma-dangle': ['warn', {
      functions: 'never',
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
    }],
    'sort-imports-es6-autofix/sort-imports-es6': ['warn'],
    'no-return-await': ['warn'],
    'no-prototype-builtins': ['warn'],
    // @typescript-eslint/strict rules:
    '@typescript-eslint/prefer-ts-expect-error': 'warn',
    '@typescript-eslint/prefer-literal-enum-member': 'warn',
    '@typescript-eslint/prefer-for-of': 'warn',
    '@typescript-eslint/no-unsafe-declaration-merging': 'warn',
    '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'warn',
    '@typescript-eslint/no-invalid-void-type': 'warn',
    '@typescript-eslint/no-extraneous-class': 'warn',
    '@typescript-eslint/no-dynamic-delete': 'warn',
    '@typescript-eslint/no-duplicate-enum-values': 'warn',
    '@typescript-eslint/consistent-type-definitions': 'warn',
    '@typescript-eslint/consistent-type-assertions': 'warn',
    '@typescript-eslint/consistent-indexed-object-style': 'warn',
    '@typescript-eslint/consistent-generic-constructors': 'warn',
    '@typescript-eslint/class-literal-property-style': 'warn',
    '@typescript-eslint/ban-tslint-comment': 'warn',
    '@typescript-eslint/array-type': 'warn',
  },
  overrides: [{
    files: ['**/*.mts'],
    parser: '@typescript-eslint/parser',
  }]
}
