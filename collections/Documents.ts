import type { CollectionConfig } from 'payload'
import {
  readPublished,
  canCreateContent,
  canUpdateContent,
  canDeleteContent,
  editorialHooks,
  createdByField,
} from '../lib/payload-access'
import { revalidationHooks } from '../lib/revalidate'
import { slugField } from '../fields/slugField'
import { seoField } from '../fields/seoField'

/**
 * « Documents & modèles » — the first of the TWO download libraries the client
 * asked for: contrats types, attestations, études, synthèses.
 *
 * The second library is NOT here and must not be merged into it: official legal
 * texts live on `TextesJuridiques`, where the file sits beside the summary, the
 * statut and every article that comments the text. One text, one URL. Mixing
 * them would give each legal text a second page competing with its own hub —
 * and would blur, for the reader, the line between what the newsroom drafted
 * and what the State published. That distinction is the whole point of keeping
 * the two rubriques apart.
 */
export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: {
    singular: { fr: 'Document', ar: 'وثيقة' },
    plural: { fr: 'Documents & modèles', ar: 'وثائق ونماذج' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'categorie', 'publishedAt', '_status'],
    group: { fr: 'Contenu', ar: 'المحتوى' },
  },
  versions: {
    drafts: { autosave: { interval: 800 } },
    maxPerDoc: 20,
  },
  access: {
    read: readPublished,
    create: canCreateContent,
    update: canUpdateContent,
    delete: canDeleteContent,
  },
  hooks: { ...editorialHooks, ...revalidationHooks },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: { fr: 'Titre du document', ar: 'عنوان الوثيقة' },
    },
    slugField(),
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: { fr: 'Description', ar: 'الوصف' },
      admin: {
        description: {
          fr: 'Deux lignes : ce que contient le document et à qui il sert. C’est le seul texte indexable — le PDF, lui, ne l’est pas.',
          ar: 'سطران: ما تتضمنه الوثيقة ولمن تصلح. هذا هو النص الوحيد القابل للفهرسة، أما ملف PDF فلا.',
        },
      },
    },
    {
      name: 'categorie',
      type: 'select',
      required: true,
      index: true,
      label: { fr: 'Catégorie', ar: 'الصنف' },
      options: [
        { label: { fr: 'Contrat type', ar: 'عقد نموذجي' }, value: 'contrat' },
        { label: { fr: 'Attestation / formulaire', ar: 'شهادة / نموذج' }, value: 'attestation' },
        { label: { fr: 'Étude', ar: 'دراسة' }, value: 'etude' },
        { label: { fr: 'Synthèse', ar: 'خلاصة' }, value: 'synthese' },
        { label: { fr: 'Autre document', ar: 'وثيقة أخرى' }, value: 'autre' },
      ],
      admin: {
        description: {
          fr: 'Décide la section dans laquelle le document apparaît sur la page Documents & modèles.',
          ar: 'يحدد القسم الذي تظهر فيه الوثيقة في صفحة وثائق ونماذج.',
        },
      },
    },
    {
      name: 'fichier',
      type: 'upload',
      relationTo: 'fichiers',
      required: true,
      /**
       * Localized: a French contract and its Arabic version are two files, and
       * with `localization.fallback: false` an Arabic reader must never be
       * handed the French PDF silently (règle d'or #2 — same reasoning as text).
       */
      localized: true,
      label: { fr: 'Fichier à télécharger', ar: 'الملف القابل للتحميل' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      label: { fr: 'Date de publication', ar: 'تاريخ النشر' },
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
      },
    },
    {
      name: 'articlesLies',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      label: { fr: 'Articles liés', ar: 'مقالات ذات صلة' },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: { fr: 'Mots-clés', ar: 'الوسوم' },
    },
    createdByField(),
    seoField(),
  ],
}
