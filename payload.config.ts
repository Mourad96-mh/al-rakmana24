import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import { fr } from '@payloadcms/translations/languages/fr'
import { ar } from '@payloadcms/translations/languages/ar'

// RELATIVE imports only in this graph — the Payload CLI loaders do not resolve
// the `@/*` alias (règle d'or #5).
import { Articles } from './collections/Articles'
import { Podcasts } from './collections/Podcasts'
import { Videos } from './collections/Videos'
import { Documents } from './collections/Documents'
import { Fichiers } from './collections/Fichiers'
import { Publicites } from './collections/Publicites'
import { cloudinaryStorage } from './lib/cloudinary-storage'
import { Dossiers } from './collections/Dossiers'
import { Pages } from './collections/Pages'
import { Media } from './collections/Media'
import { Startups } from './collections/Startups'
import { Entreprises } from './collections/Entreprises'
import { Personnalites } from './collections/Personnalites'
import { TextesJuridiques } from './collections/TextesJuridiques'
import { Auteurs } from './collections/Auteurs'
import { Tags } from './collections/Tags'
import { Newsletter } from './collections/Newsletter'
import { Abonnes } from './collections/Abonnes'
import { Users } from './collections/Users'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: dirname },
    meta: {
      titleSuffix: ' · Al-Raqmana24',
      icons: [{ rel: 'icon', type: 'image/png', url: '/logo-mark.png' }],
    },

    /**
     * Component paths are resolved against `importMap.baseDir` (the project
     * root) by Payload's own loader — they are NOT module specifiers, so règle
     * d'or #5 does not apply to them. Re-run `pnpm payload -- --use-swc
     * generate:importmap` after touching this block, or the admin renders the
     * default component and nothing says why.
     */
    components: {
      // Replaces nothing: it sits ABOVE Payload's collection list, which stays.
      beforeDashboard: ['/components/admin/Dashboard/Welcome#Welcome'],
      graphics: {
        Logo: '/components/admin/Graphics/Logo#Logo',
        Icon: '/components/admin/Graphics/Icon#Icon',
      },
    },
  },

  /**
   * Order here is the order of the admin sidebar, within each `admin.group`.
   * Editorial work first, entity hubs second, reference data last — that is the
   * frequency with which the newsroom touches them.
   */
  collections: [
    // Contenu
    Articles,
    Podcasts,
    Videos,
    Documents,
    Dossiers,
    Pages,
    Media,
    Fichiers,
    // Entités — les hubs SEO, alimentés par les relations des articles
    Startups,
    Entreprises,
    Personnalites,
    TextesJuridiques,
    // Rédaction
    Auteurs,
    Tags,
    // Régie — les créations publicitaires des emplacements du site
    Publicites,
    // Audience — les lecteurs. Comptes gratuits et inscrits à la newsletter :
    // deux choses distinctes, et ni l'une ni l'autre n'entre dans le back-office.
    Newsletter,
    Abonnes,
    // Administration — la rédaction. `admin.user` ci-dessus pointe ICI, et
    // nulle part ailleurs : c'est ce qui fait que les identifiants d'un lecteur
    // ne sont pas acceptés sur /admin/login.
    Users,
  ],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET ?? '',

  /**
   * MongoDB Atlas. Payload derives the schema from the collections above, so
   * there is nothing to migrate by hand — that is the practical reason for the
   * switch away from Postgres (décision du 5 septembre 2026, base encore vide).
   */
  db: mongooseAdapter({
    url: process.env.DATABASE_URI ?? '',
  }),

  sharp,

  /**
   * Media and downloadable files live on Cloudinary, never on the application
   * server: the server must stay disposable, and its disk is ephemeral on every
   * host we are considering. See lib/cloudinary-storage.ts.
   */
  plugins: [cloudinaryStorage(['media', 'fichiers'])],

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
    /**
     * 25 MB. Raised from 10 for the download library: a scanned Bulletin
     * officiel or an illustrated study routinely passes 10 MB, and a failed
     * upload in the back-office is the kind of thing a newsroom works around by
     * emailing the file instead — which is exactly what this feature replaces.
     */
    limits: { fileSize: 25_000_000 },
  },
})
