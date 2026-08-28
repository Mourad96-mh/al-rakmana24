import type { CollectionConfig } from 'payload'
import { publicRead, isEditorial, canCreateContent } from '../lib/payload-access'
import { slugField } from '../fields/slugField'
import { seoField } from '../fields/seoField'

/**
 * The public byline.
 *
 * Deliberately NOT the same thing as `Users`. A user is someone who logs in; an
 * author is a name printed under a headline. They overlap often but not always:
 * an outside contributor signs articles without ever getting CMS credentials,
 * and « La rédaction » is a byline with no human behind it. The optional
 * `compte` relationship links the two when they do coincide.
 */
export const Auteurs: CollectionConfig = {
  slug: 'auteurs',
  labels: {
    singular: { fr: 'Auteur', ar: 'كاتب' },
    plural: { fr: 'Auteurs', ar: 'الكتاب' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'fonction', 'slug'],
    group: { fr: 'Rédaction', ar: 'التحرير' },
  },
  access: {
    read: publicRead,
    create: canCreateContent,
    update: isEditorial,
    delete: isEditorial,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { fr: 'Nom affiché', ar: 'الاسم المعروض' },
      admin: {
        description: {
          fr: 'Localisé : la version arabe porte le nom en arabe, pas une translittération automatique.',
          ar: 'محلي: النسخة العربية تحمل الاسم بالعربية لا نقحرة آلية.',
        },
      },
    },
    slugField(),
    {
      name: 'fonction',
      type: 'text',
      localized: true,
      label: { fr: 'Fonction', ar: 'الصفة' },
      admin: {
        placeholder: 'Journaliste · Avocat au barreau de Casablanca · Chercheur',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
      label: { fr: 'Biographie', ar: 'نبذة' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: { fr: 'Photo', ar: 'الصورة' },
    },
    {
      type: 'collapsible',
      label: { fr: 'Contact et réseaux', ar: 'الاتصال والشبكات' },
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'email', type: 'email', label: { fr: 'E-mail public', ar: 'بريد عمومي' } },
            { name: 'linkedin', type: 'text', label: { fr: 'LinkedIn', ar: 'لينكدإن' } },
            { name: 'x', type: 'text', label: { fr: 'X', ar: 'إكس' } },
          ],
        },
      ],
    },
    {
      name: 'compte',
      type: 'relationship',
      relationTo: 'users',
      label: { fr: 'Compte CMS lié', ar: 'الحساب المرتبط' },
      admin: {
        position: 'sidebar',
        description: {
          fr: 'Facultatif. À renseigner si cet auteur se connecte lui-même au site.',
          ar: 'اختياري. يملأ إذا كان هذا الكاتب يلج بنفسه إلى الموقع.',
        },
      },
    },
    seoField(),
  ],
}
