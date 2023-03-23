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
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['tsconfig.json', 'tsconfig.dev.json'],
    sourceType: 'module',
  },
  ignorePatterns: [
    '/lib/**/*', // Ignore built files.
  ],
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  rules: {
    'import/no-unresolved': 0,
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'semi': ['warn', 'never'],
    'no-trailing-spaces': ['warn', { skipBlankLines: true }],
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'valid-jsdoc': ['warn', { requireReturn: false }],
    'max-len': ['warn', { code: 120 }],
    'object-curly-spacing': ['warn', 'always'],
    'comma-dangle': ['warn', {
      functions: 'never',
      arrays: 'always-multiline',
      objects: 'always-multiline',
      imports: 'always-multiline',
      exports: 'always-multiline',
    }],
  },
}
