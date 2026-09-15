import type { CollectionConfig } from 'payload'
import { publicRead, isEditorial, canCreateContent } from '../lib/payload-access'
import { revalidationHooks } from '../lib/revalidate'
import { slugField } from '../fields/slugField'
import { seoField } from '../fields/seoField'

/**
 * A running editorial thread — « Levées de fonds 2026 », « Réforme de la loi
 * 09-08 », « Ramadan et e-commerce ».
 *
 * Like the entity hubs, a dossier does NOT hold a list of articles: articles
 * point at the dossier, and the page collects them. That is what lets a
 * journalist add a piece to a running dossier from inside the article they are
 * already writing, without a second editing pass.
 */
export const Dossiers: CollectionConfig = {
  slug: 'dossiers',
  labels: {
    singular: { fr: 'Dossier', ar: 'ملف' },
    plural: { fr: 'Dossiers', ar: 'الملفات' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'enCours', 'updatedAt'],
    group: { fr: 'Contenu', ar: 'المحتوى' },
    description: {
      fr: 'Les articles s’ajoutent depuis la fiche de l’article, pas depuis ici.',
      ar: 'تضاف المقالات من بطاقة المقال لا من هنا.',
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
      label: { fr: 'Titre du dossier', ar: 'عنوان الملف' },
    },
    slugField(),
    {
      name: 'kicker',
      type: 'text',
      localized: true,
      label: { fr: 'Surtitre', ar: 'العنوان الفرعي العلوي' },
      admin: {
        placeholder: 'Enquête · Série · Grand format',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: { fr: 'Chapeau', ar: 'التقديم' },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: { fr: 'Image du dossier', ar: 'صورة الملف' },
    },
    {
      name: 'enCours',
      type: 'checkbox',
      defaultValue: true,
      label: { fr: 'Dossier en cours', ar: 'ملف مفتوح' },
      admin: {
        position: 'sidebar',
        description: {
          fr: 'Décocher quand le sujet est clos : le dossier reste en ligne mais sort des mises en avant.',
          ar: 'ألغ التحديد عند إغلاق الموضوع: يبقى الملف على الخط لكنه يخرج من الإبرازات.',
        },
      },
    },
    seoField(),
  ],
}
