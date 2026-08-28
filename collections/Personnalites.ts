import type { CollectionConfig } from 'payload'
import { publicRead, isEditorial, canCreateContent } from '../lib/payload-access'
import { slugField } from '../fields/slugField'
import { seoField } from '../fields/seoField'

/**
 * Entity hub for people who are written ABOUT — founders, ministers, judges,
 * regulators, investors, podcast guests.
 *
 * Not to be confused with `Auteurs` (who sign articles) or `Users` (who log in).
 * A person can legitimately exist in all three collections; they answer three
 * different questions.
 *
 * These are records about real, living people. Everything here is public and
 * indexed: keep it to verifiable, professional facts, sourced from the article
 * that introduced them.
 */
export const Personnalites: CollectionConfig = {
  slug: 'personnalites',
  labels: {
    singular: { fr: 'Personnalité', ar: 'شخصية' },
    plural: { fr: 'Personnalités', ar: 'الشخصيات' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'fonction', 'organisation'],
    group: { fr: 'Entités', ar: 'الكيانات' },
    description: {
      fr: 'Fiches publiques de personnes réelles : s’en tenir aux faits professionnels vérifiables et sourcés.',
      ar: 'بطاقات عمومية لأشخاص حقيقيين: يقتصر على الوقائع المهنية القابلة للتحقق والموثقة.',
    },
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
      label: { fr: 'Nom', ar: 'الاسم' },
    },
    slugField(),
    {
      type: 'row',
      fields: [
        {
          name: 'fonction',
          type: 'text',
          localized: true,
          label: { fr: 'Fonction', ar: 'الصفة' },
        },
        {
          name: 'nationalite',
          type: 'text',
          localized: true,
          label: { fr: 'Nationalité', ar: 'الجنسية' },
        },
      ],
    },
    {
      name: 'organisation',
      type: 'relationship',
      relationTo: ['startups', 'entreprises'],
      label: { fr: 'Organisation', ar: 'المنظمة' },
    },
    {
      name: 'bio',
      type: 'richText',
      localized: true,
      label: { fr: 'Biographie', ar: 'السيرة' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: { fr: 'Photo', ar: 'الصورة' },
    },
    {
      type: 'row',
      fields: [
        { name: 'linkedin', type: 'text', label: { fr: 'LinkedIn', ar: 'لينكدإن' } },
        { name: 'x', type: 'text', label: { fr: 'X', ar: 'إكس' } },
      ],
    },
    seoField(),
  ],
}
