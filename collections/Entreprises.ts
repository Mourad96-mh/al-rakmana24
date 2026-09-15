import type { CollectionConfig } from 'payload'
import { publicRead, isEditorial, canCreateContent } from '../lib/payload-access'
import { revalidationHooks } from '../lib/revalidate'
import { slugField } from '../fields/slugField'
import { seoField } from '../fields/seoField'
import { NATURES, toPayloadOptions } from '../lib/entity-vocab'

/**
 * Entity hub for everything that is not a startup: established companies, banks,
 * law firms, ministries, regulators, professional federations.
 *
 * Same rule as `Startups` — the hub's article list is derived from the articles
 * that cite the entity. Never curate it here.
 */
export const Entreprises: CollectionConfig = {
  slug: 'entreprises',
  labels: {
    singular: { fr: 'Entreprise / Organisation', ar: 'شركة أو منظمة' },
    plural: { fr: 'Entreprises et organisations', ar: 'الشركات والمنظمات' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'nature', 'secteur', 'slug'],
    group: { fr: 'Entités', ar: 'الكيانات' },
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
          name: 'nature',
          type: 'select',
          index: true,
          label: { fr: 'Nature', ar: 'الطبيعة' },
          options: toPayloadOptions(NATURES),
        },
        { name: 'secteur', type: 'text', label: { fr: 'Secteur', ar: 'القطاع' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'siege', type: 'text', label: { fr: 'Siège', ar: 'المقر' } },
        { name: 'siteWeb', type: 'text', label: { fr: 'Site web', ar: 'الموقع الإلكتروني' } },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: { fr: 'Logo', ar: 'الشعار' },
    },
    seoField(),
  ],
}
