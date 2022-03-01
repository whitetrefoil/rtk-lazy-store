/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  root: true,

  extends: [
    '@whitetrefoil/eslint-config/web-react',
  ],

  overrides: [
    {
      files: [
        '**/*.ts',
        '**/*.tsx',
      ],
      rules: {
        '@typescript-eslint/ban-types'        : [0],
        '@typescript-eslint/no-dynamic-delete': [0],
        '@typescript-eslint/no-shadow'        : [0],
      },
    },
  ],
}
