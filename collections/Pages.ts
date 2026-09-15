import type { CollectionConfig } from 'payload'
import {
  readPublished,
  isEditorial,
  isAdmin,
  editorialHooks,
  createdByField,
} from '../lib/payload-access'
import { revalidationHooks } from '../lib/revalidate'
import { slugField } from '../fields/slugField'
import { seoField } from '../fields/seoField'

/**
 * Institutional pages: qui-sommes-nous, la-rédaction, nous-rejoindre,
 * nous-contacter, mentions légales, politique de confidentialité.
 *
 * `cle` — not `slug` — is what the routes bind to. The URLs are localized
 * pathnames declared in `lib/i18n/routing.ts` (`/qui-sommes-nous` ↔ `/من-نحن`),
 * so the page a route needs must be findable by a language-independent key. The
 * localized `slug` is kept for the SEO metadata and for any page outside the
 * fixed set.
 *
 * Creating and deleting is admin-only: these pages are legal surface (loi 09-08
 * notice, mentions légales) and the routes expect specific keys to resolve.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: { fr: 'Page', ar: 'صفحة' },
    plural: { fr: 'Pages institutionnelles', ar: 'الصفحات المؤسساتية' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'cle', '_status', 'updatedAt'],
    group: { fr: 'Contenu', ar: 'المحتوى' },
  },
  versions: {
    drafts: { autosave: { interval: 800 } },
    maxPerDoc: 20,
  },
  access: {
    read: readPublished,
    create: isAdmin,
    update: isEditorial,
    delete: isAdmin,
  },
  hooks: { ...editorialHooks, ...revalidationHooks },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { fr: 'Titre', ar: 'العنوان' },
    },
    slugField(),
    {
      name: 'cle',
      type: 'select',
      required: true,
      unique: true,
      index: true,
      label: { fr: 'Page du site', ar: 'صفحة الموقع' },
      options: [
        { label: { fr: 'Qui sommes-nous', ar: 'من نحن' }, value: 'qui-sommes-nous' },
        { label: { fr: 'La rédaction', ar: 'هيئة التحرير' }, value: 'la-redaction' },
        { label: { fr: 'Nous rejoindre', ar: 'انضم إلينا' }, value: 'nous-rejoindre' },
        { label: { fr: 'Nous contacter', ar: 'اتصل بنا' }, value: 'nous-contacter' },
        { label: { fr: 'Newsletter', ar: 'النشرة البريدية' }, value: 'newsletter' },
        { label: { fr: 'Mentions légales', ar: 'المعلومات القانونية' }, value: 'mentions-legales' },
        {
          label: { fr: 'Politique de confidentialité', ar: 'سياسة الخصوصية' },
          value: 'politique-de-confidentialite',
        },
      ],
      admin: {
        position: 'sidebar',
        description: {
          fr: 'Détermine l’URL dans les deux langues. Une seule page par clé.',
          ar: 'يحدد الرابط في اللغتين. صفحة واحدة لكل مفتاح.',
        },
      },
    },
    {
      name: 'chapeau',
      type: 'textarea',
      localized: true,
      label: { fr: 'Chapeau', ar: 'التقديم' },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      label: { fr: 'Contenu', ar: 'المحتوى' },
    },
    createdByField(),
    seoField(),
  ],
}
