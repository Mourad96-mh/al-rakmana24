import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import { fr } from '@payloadcms/translations/languages/fr'
import { ar } from '@payloadcms/translations/languages/ar'

// RELATIVE imports only in this graph — the Payload CLI loaders do not resolve
// the `@/*` alias (règle d'or #5).
import { Users } from './collections/Users'
import { Media } from './collections/Media'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: {
      titleSuffix: ' · Al-Raqmana24',
    },
  },

  collections: [Users, Media],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET ?? '',

  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI ?? '' },
  }),

  sharp,

  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },

  /**
   * Content localization.
   *
   * `fallback: false` is a règle d'or (#2) — DO NOT turn it on. With fallback
   * enabled an untranslated Arabic article silently renders its French text and
   * Google indexes a broken bilingual page. Off, the field comes back empty and
   * the route 404s, which is the correct behaviour.
   *
   * The consequence is that partial translation is the NORMAL case: every
   * listing query must filter on the active locale, and hreflang is emitted only
   * when the counterpart genuinely exists.
   */
  localization: {
    locales: [
      { label: 'Français', code: 'fr' },
      { label: 'العربية', code: 'ar', rtl: true },
    ],
    defaultLocale: 'fr',
    fallback: false,
  },

  /** Admin UI chrome — the newsroom works in French, with Arabic available. */
  i18n: {
    supportedLanguages: { fr, ar },
    fallbackLanguage: 'fr',
  },

  upload: {
    limits: { fileSize: 10_000_000 }, // 10 MB
  },
})
