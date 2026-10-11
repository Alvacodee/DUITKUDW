import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: { react },
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        __APP_VERSION__: 'readonly', // di-inject vite.config.js (define)
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Tandai variabel yang dipakai sebagai komponen JSX (<Icon />) sebagai "terpakai",
      // sehingga no-unused-vars bisa dipakai tanpa pengecualian huruf kapital.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off',
      'no-unused-vars': 'error',
      // Pola shadcn/ui: file komponen juga mengekspor *Variants (cva)
      'react-refresh/only-export-components': ['error', { allowExportNames: ['buttonVariants', 'badgeVariants'] }],
    },
  },
  {
    files: ['**/*.test.{js,jsx}', 'vite.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
])
