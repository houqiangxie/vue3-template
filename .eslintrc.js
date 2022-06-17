/*
 * @Descripttion:
 * @version:
 * @Author: houqiangxie
 * @Date: 2022-03-10 12:24:16
 * @LastEditors: Please set LastEditors
 * @LastEditTime: 2022-05-02 15:05:17
 */
// module.exports = {
//   extends: ['vue-global-api'],
// };
module.exports = {
  env: {
    node: true,
    browser: true,
    es6: true,
    commonjs: true,
  },
  extends: ['prettier', 'prettier/vue', 'vue-global-api'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    log: true,
    BMapGL: 'readonly',
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['vue', 'import'],
  settings: {
    'import/resolver': {
      alias: {
        map: [['@', './src/']],
      },
    },
  },
  rules: {
    'linebreak-style': [0, 'error', 'windows'],
    'max-len': [
      'error',
      {
        comments: 300,
        ignoreStrings: true,
        ignoreUrls: true,
        code: 150,
      },
    ],
    'no-underscore-dangle': 'off',
    'no-param-reassign': ['error', { props: false }],
    'no-unused-vars': ['warn', { args: 'none' }],
    'no-irregular-whitespace': 'warn',
    'class-methods-use-this': 'off',
    'no-restricted-syntax': 'off',
    'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
  },
};
