module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'google',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/strict',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
  ],
  plugins: [
    '@typescript-eslint',
    'import',
    'sort-imports-es6-autofix',
  ],
  rules: {
    'import/no-unresolved': 0,
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['warn', 'never'],
    'object-curly-spacing': ['warn', 'always'],
    'no-trailing-spaces': ['warn', { skipBlankLines: true }],
    'no-unused-vars': ['warn', {
      args: 'none',
      varsIgnorePattern: '^_',
    }],
    'valid-jsdoc': ['warn', { requireReturn: false }],
    'max-len': ['warn', { code: 120 }],
    'comma-dangle': ['warn', {
      functions: 'never',
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
    }],
    'sort-imports-es6-autofix/sort-imports-es6': ['warn'],
    'require-jsdoc': 'off',
    'no-return-await': ['warn'],
    'no-prototype-builtins': ['warn'],
    '@typescript-eslint/await-thenable': ['error'],
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
  },
}
