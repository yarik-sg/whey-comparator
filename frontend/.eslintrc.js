module.exports = {
  root: true,
  extends: ['next', 'next/core-web-vitals'],
  ignorePatterns: ['node_modules/', '.next/', 'out/', 'vendor/'],
  rules: {
    'react/no-unescaped-entities': 'off',
  },
};
