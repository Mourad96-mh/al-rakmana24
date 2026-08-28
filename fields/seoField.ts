import type { Field } from 'payload'

/**
 * Per-locale SEO overrides.
 *
 * The whole group is `localized: true`, so the French and Arabic versions of a
 * document carry independent titles, descriptions, share images and noindex
 * flags. That matters: an Arabic headline that reads well is not a translation
 * of the French meta title, and an FR-only article must be able to be indexed
 * in French while not existing at all in Arabic (règle d'or #2).
 *
 * Every subfield is optional — the page falls back to the document's own title
 * and excerpt. Only fill these in to override.
 */
export const seoField = (): Field => ({
  name: 'seo',
  type: 'group',
  localized: true,
  label: { fr: 'Référencement (SEO)', ar: 'تحسين الظهور' },
  admin: {
    description: {
      fr: 'Facultatif. Vide = le titre et le chapeau de l’article sont utilisés.',
      ar: 'اختياري. إذا ترك فارغا يستعمل عنوان المقال وملخصه.',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: { fr: 'Titre pour Google', ar: 'العنوان في غوغل' },
      maxLength: 70,
      admin: {
        description: {
          fr: 'Environ 60 caractères. Au-delà, Google tronque.',
          ar: 'حوالي 60 حرفا. ما زاد تقتطعه غوغل.',
        },
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: { fr: 'Méta-description', ar: 'الوصف' },
      maxLength: 200,
      admin: {
        description: {
          fr: 'Environ 155 caractères.',
          ar: 'حوالي 155 حرفا.',
        },
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: { fr: 'Image de partage', ar: 'صورة المشاركة' },
      admin: {
        description: {
          fr: '1200 × 630. Vide = image de couverture, puis image par défaut du site.',
          ar: '1200 × 630. إذا تركت فارغة تستعمل صورة الغلاف ثم صورة الموقع الافتراضية.',
        },
      },
    },
    {
      name: 'noindex',
      type: 'checkbox',
      defaultValue: false,
      label: { fr: 'Ne pas indexer cette version', ar: 'عدم فهرسة هذه النسخة' },
      admin: {
        description: {
          fr: 'Retire la page des moteurs de recherche, dans cette langue uniquement.',
          ar: 'يزيل الصفحة من محركات البحث، في هذه اللغة فقط.',
        },
      },
    },
  ],
})
