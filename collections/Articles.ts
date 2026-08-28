import type { CollectionConfig } from 'payload'
import {
  readPublished,
  canCreateContent,
  canUpdateContent,
  canDeleteContent,
  editorialHooks,
  createdByField,
} from '../lib/payload-access'
import { slugField } from '../fields/slugField'
import { seoField } from '../fields/seoField'
import { accessLevelField } from '../fields/accessLevelField'
import { rubriqueField, sousRubriqueField } from '../fields/rubriqueFields'

/**
 * The newsroom's main object.
 *
 * Two things to keep in mind when editing this file.
 *
 * **Partial translation is normal** (règle d'or #2). `title`, `slug`, `excerpt`,
 * `body` and `seo` are localized and `localization.fallback` is off, so an
 * article can exist in French, in Arabic, or in both. Nothing here should ever
 * be marked `required` in a way that forces an editor to invent an Arabic
 * headline just to save a French article — Payload validates required localized
 * fields per-locale on save, which is exactly the behaviour we want: required in
 * the locale you are actually writing, absent in the one you are not.
 *
 * **The entity relationships are the product**, not decoration. They are what
 * auto-populates `/startups/{slug}`, `/textes-juridiques/{slug}` and the « À
 * lire aussi » block, with no curation anywhere. An article that mentions a
 * startup and does not link it is a missed page.
 */
export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: {
    singular: { fr: 'Article', ar: 'مقال' },
    plural: { fr: 'Articles', ar: 'المقالات' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'rubrique', 'format', 'publishedAt', '_status'],
    group: { fr: 'Contenu', ar: 'المحتوى' },
    preview: () => null,
  },
  versions: {
    drafts: { autosave: { interval: 800 } },
    maxPerDoc: 50,
  },
  access: {
    read: readPublished,
    create: canCreateContent,
    update: canUpdateContent,
    delete: canDeleteContent,
  },
  hooks: editorialHooks,
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
      name: 'excerpt',
      type: 'textarea',
      localized: true,
      maxLength: 320,
      label: { fr: 'Chapeau', ar: 'التقديم' },
      admin: {
        description: {
          fr: 'Deux ou trois phrases. Sert de résumé sur les listes, dans les partages et comme méta-description par défaut.',
          ar: 'جملتان أو ثلاث. يستعمل كملخص في اللوائح وفي المشاركات وكوصف افتراضي.',
        },
      },
    },
    {
      name: 'body',
      type: 'richText',
      localized: true,
      label: { fr: 'Corps de l’article', ar: 'متن المقال' },
    },

    // ---- Sidebar: classement et publication ----
    {
      name: 'format',
      type: 'select',
      required: true,
      defaultValue: 'actualite',
      index: true,
      label: { fr: 'Format', ar: 'الصيغة' },
      options: [
        { label: { fr: 'Actualité', ar: 'خبر' }, value: 'actualite' },
        { label: { fr: 'Analyse', ar: 'تحليل' }, value: 'analyse' },
        { label: { fr: 'Décryptage', ar: 'قراءة' }, value: 'decryptage' },
        { label: { fr: 'Interview', ar: 'حوار' }, value: 'interview' },
        { label: { fr: 'Tribune', ar: 'رأي' }, value: 'tribune' },
        { label: { fr: 'Infographie', ar: 'إنفوغرافيك' }, value: 'infographie' },
      ],
      admin: { position: 'sidebar' },
    },
    rubriqueField(),
    sousRubriqueField(),
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      label: { fr: 'Date de publication', ar: 'تاريخ النشر' },
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' },
        description: {
          fr: 'Commune aux deux langues. Une date future ne programme rien pour l’instant : elle ne fait que dater l’article.',
          ar: 'مشترك بين اللغتين. التاريخ المستقبلي لا يبرمج النشر حاليا بل يؤرخ المقال فقط.',
        },
      },
    },
    {
      name: 'aLaUne',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      label: { fr: 'À la une', ar: 'في الواجهة' },
      admin: {
        position: 'sidebar',
        description: {
          fr: 'Candidat à la mise en avant sur l’accueil. Le plus récent des articles cochés prend la grande place.',
          ar: 'مرشح للإبراز في الصفحة الرئيسية. الأحدث من المقالات المحددة يأخذ المكان الكبير.',
        },
      },
    },
    accessLevelField(),
    createdByField(),

    // ---- Habillage ----
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: { fr: 'Image de couverture', ar: 'صورة الغلاف' },
      admin: {
        description: {
          fr: 'Commune aux deux langues. 1200 × 675 minimum — c’est aussi l’image de partage par défaut.',
          ar: 'مشتركة بين اللغتين. 1200 × 675 على الأقل — وهي أيضا صورة المشاركة الافتراضية.',
        },
      },
    },
    {
      name: 'auteurs',
      type: 'relationship',
      relationTo: 'auteurs',
      hasMany: true,
      label: { fr: 'Signature', ar: 'التوقيع' },
      admin: {
        description: {
          fr: 'Un ou plusieurs auteurs. Vide = « La rédaction ».',
          ar: 'كاتب أو أكثر. إذا ترك فارغا يوقع باسم «هيئة التحرير».',
        },
      },
    },

    // ---- Les liens qui font vivre les hubs ----
    {
      type: 'collapsible',
      label: { fr: 'Entités citées', ar: 'الكيانات المذكورة' },
      admin: {
        initCollapsed: false,
        description: {
          fr: 'Chaque lien fait apparaître cet article sur la page de l’entité, automatiquement. C’est là que se construit le référencement du site.',
          ar: 'كل ربط يظهر هذا المقال في صفحة الكيان تلقائيا. هنا يبنى ترتيب الموقع في محركات البحث.',
        },
      },
      fields: [
        {
          name: 'startups',
          type: 'relationship',
          relationTo: 'startups',
          hasMany: true,
          label: { fr: 'Startups', ar: 'الشركات الناشئة' },
        },
        {
          name: 'entreprises',
          type: 'relationship',
          relationTo: 'entreprises',
          hasMany: true,
          label: { fr: 'Entreprises et organisations', ar: 'الشركات والمنظمات' },
        },
        {
          name: 'personnalites',
          type: 'relationship',
          relationTo: 'personnalites',
          hasMany: true,
          label: { fr: 'Personnalités', ar: 'الشخصيات' },
        },
        {
          name: 'textesJuridiques',
          type: 'relationship',
          relationTo: 'textes-juridiques',
          hasMany: true,
          label: { fr: 'Textes juridiques', ar: 'النصوص القانونية' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'dossiers',
          type: 'relationship',
          relationTo: 'dossiers',
          hasMany: true,
          label: { fr: 'Dossiers', ar: 'الملفات' },
        },
        {
          name: 'tags',
          type: 'relationship',
          relationTo: 'tags',
          hasMany: true,
          label: { fr: 'Mots-clés', ar: 'الوسوم' },
        },
      ],
    },

    seoField(),
  ],
}
