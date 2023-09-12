module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    jest: true,
  },
  extends: ['airbnb-base', 'prettier'],
  overrides: [
    {
      env: {
        node: true,
      },
      files: ['.eslintrc.{js,cjs}'],
      parserOptions: {
        sourceType: 'script',
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
    'func-names': 'off',
    'no-unused-vars': 'off',
    'global-require': 'off',
  },
};
