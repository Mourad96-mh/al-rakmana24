import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'
import reactHooks from 'eslint-plugin-react-hooks'

/**
 * Native flat config — deliberately NOT `FlatCompat` + `compat.extends('next/...')`.
 *
 * The legacy eslintrc resolver that FlatCompat wraps resolved
 * `@next/eslint-plugin-next` out of a SIBLING project's node_modules
 * (Bureau/crewstay), whose older copy calls `context.getAncestors()` — removed in
 * ESLint 9 — so every lint run crashed with `TypeError: context.getAncestors is
 * not a function`. Importing the plugins directly pins resolution to this
 * project's own dependency graph. Do not reintroduce FlatCompat here.
 */
export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'media/**',
      'next-env.d.ts',
      'payload-types.ts',
      'app/(payload)/admin/importMap.js',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Payload's generated types are loose in places; keep the escape hatch
      // visible rather than silently allowed.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  {
    // Payload template files are vendored verbatim from upstream.
    files: ['app/(payload)/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

  {
    // Build-time Node scripts: not bundled, so they get Node globals.
    files: ['scripts/**', '*.config.{js,mjs,ts}'],
    languageOptions: {
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        // Node 22 ships these as globals; the scripts fetch and resize images.
        fetch: 'readonly',
        AbortSignal: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
)
