import type { CollectionConfig } from 'payload'
import { publicRead, isEditorial, canCreateContent } from '../lib/payload-access'
import { revalidationHooks } from '../lib/revalidate'
import { slugField } from '../fields/slugField'
import { seoField } from '../fields/seoField'
import { SECTEURS, STADES, toPayloadOptions } from '../lib/entity-vocab'

/**
 * Entity hub — the SEO moat (/CLAUDE.md §5, plan Lot 4).
 *
 * A startup record is a FICHE, never a list of articles. The article list on
 * `/startups/{slug}` is derived at render time from articles that point here,
 * so it can never go stale and no one has to remember to curate it. That is why
 * there is no `articles` field below, and there must never be one.
 *
 * `levees` feeds the « Meilleures levées de fonds » sous-rubrique.
 */
export const Startups: CollectionConfig = {
  slug: 'startups',
  labels: {
    singular: { fr: 'Startup', ar: 'شركة ناشئة' },
    plural: { fr: 'Startups', ar: 'الشركات الناشئة' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'secteur', 'stade', 'anneeCreation'],
    group: { fr: 'Entités', ar: 'الكيانات' },
    description: {
      fr: 'Fiche d’entité. La liste d’articles de la page se remplit toute seule à partir des articles qui citent la startup — ne rien lister ici.',
      ar: 'بطاقة كيان. لائحة المقالات في الصفحة تتغذى تلقائيا من المقالات التي تذكر الشركة — لا تضف شيئا هنا.',
    },
  },
  access: {
    read: publicRead,
    create: canCreateContent,
    update: isEditorial,
    delete: isEditorial,
  },
  hooks: revalidationHooks,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { fr: 'Nom', ar: 'الاسم' },
    },
    slugField(),
    {
      name: 'description',
      type: 'richText',
      localized: true,
      label: { fr: 'Présentation', ar: 'التعريف' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'secteur',
          type: 'select',
          index: true,
          label: { fr: 'Secteur', ar: 'القطاع' },
          options: toPayloadOptions(SECTEURS),
        },
        {
          name: 'stade',
          type: 'select',
          label: { fr: 'Stade', ar: 'المرحلة' },
          options: toPayloadOptions(STADES),
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'anneeCreation',
          type: 'number',
          min: 1990,
          max: 2100,
          label: { fr: 'Année de création', ar: 'سنة التأسيس' },
        },
        { name: 'ville', type: 'text', label: { fr: 'Ville', ar: 'المدينة' } },
        { name: 'siteWeb', type: 'text', label: { fr: 'Site web', ar: 'الموقع الإلكتروني' } },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: { fr: 'Logo', ar: 'الشعار' },
    },
    {
      name: 'fondateurs',
      type: 'relationship',
      relationTo: 'personnalites',
      hasMany: true,
      label: { fr: 'Fondateurs', ar: 'المؤسسون' },
    },
    {
      name: 'levees',
      type: 'array',
      label: { fr: 'Levées de fonds', ar: 'جولات التمويل' },
      labels: {
        singular: { fr: 'Levée', ar: 'جولة' },
        plural: { fr: 'Levées', ar: 'جولات' },
      },
      admin: {
        initCollapsed: true,
        description: {
          fr: 'Une ligne par tour annoncé. Montant en chiffres, sans espace ni symbole.',
          ar: 'سطر لكل جولة معلنة. المبلغ بالأرقام دون فراغ أو رمز.',
        },
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'date',
              type: 'date',
              required: true,
              label: { fr: 'Date d’annonce', ar: 'تاريخ الإعلان' },
              admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
            },
            {
              name: 'tour',
              type: 'select',
              required: true,
              label: { fr: 'Tour', ar: 'الجولة' },
              options: [
                { label: 'Pre-seed', value: 'pre-seed' },
                { label: 'Seed', value: 'seed' },
                { label: 'Série A', value: 'serie-a' },
                { label: 'Série B', value: 'serie-b' },
                { label: 'Série C et +', value: 'serie-c-plus' },
                { label: { fr: 'Dette', ar: 'دين' }, value: 'dette' },
                { label: { fr: 'Subvention', ar: 'منحة' }, value: 'subvention' },
                { label: { fr: 'Non communiqué', ar: 'غير معلن' }, value: 'nc' },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'montant',
              type: 'number',
              min: 0,
              label: { fr: 'Montant', ar: 'المبلغ' },
              admin: {
                description: {
                  fr: 'Laisser vide si non communiqué.',
                  ar: 'يترك فارغا إذا لم يعلن.',
                },
              },
            },
            {
              name: 'devise',
              type: 'select',
              defaultValue: 'MAD',
              label: { fr: 'Devise', ar: 'العملة' },
              options: [
                { label: 'MAD', value: 'MAD' },
                { label: 'USD', value: 'USD' },
                { label: 'EUR', value: 'EUR' },
              ],
            },
          ],
        },
        {
          name: 'investisseurs',
          type: 'text',
          label: { fr: 'Investisseurs', ar: 'المستثمرون' },
          admin: { placeholder: 'Séparés par des virgules' },
        },
        {
          name: 'source',
          type: 'text',
          label: { fr: 'Source', ar: 'المصدر' },
          admin: {
            description: {
              fr: 'Lien vers l’annonce officielle. Un montant sans source ne se publie pas.',
              ar: 'رابط الإعلان الرسمي. لا ينشر مبلغ بدون مصدر.',
            },
          },
        },
      ],
    },
    seoField(),
  ],
}
