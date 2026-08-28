import type { CollectionConfig } from 'payload'
import { publicRead, isEditorial, canCreateContent } from '../lib/payload-access'
import { slugField } from '../fields/slugField'
import { seoField } from '../fields/seoField'

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
          options: [
            { label: { fr: 'Entreprise privée', ar: 'شركة خاصة' }, value: 'entreprise' },
            { label: { fr: 'Banque / assurance', ar: 'بنك أو تأمين' }, value: 'banque' },
            { label: { fr: 'Cabinet d’avocats', ar: 'مكتب محاماة' }, value: 'cabinet' },
            { label: { fr: 'Administration publique', ar: 'إدارة عمومية' }, value: 'administration' },
            { label: { fr: 'Régulateur', ar: 'جهة تنظيمية' }, value: 'regulateur' },
            { label: { fr: 'Fédération / association', ar: 'جامعة أو جمعية' }, value: 'federation' },
            { label: { fr: 'Fonds d’investissement', ar: 'صندوق استثمار' }, value: 'fonds' },
            { label: { fr: 'Université / école', ar: 'جامعة أو مدرسة' }, value: 'universite' },
            { label: { fr: 'Autre', ar: 'أخرى' }, value: 'autre' },
          ],
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
