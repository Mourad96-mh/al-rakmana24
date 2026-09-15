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
 * Podcast episodes.
 *
 * The audio itself is NOT hosted here (plan, Lot 5): the newsroom publishes to
 * Ausha or Acast, which handles the RSS feed Apple and Spotify need, the
 * download statistics and the bandwidth. We store the embed URL and the
 * editorial material around it. Serving MP3s from the origin would blow the
 * bandwidth budget of a VPS on the first episode that works.
 */
export const Podcasts: CollectionConfig = {
  slug: 'podcasts',
  labels: {
    singular: { fr: 'Épisode de podcast', ar: 'حلقة بودكاست' },
    plural: { fr: 'Podcast', ar: 'البودكاست' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'numero', 'publishedAt', '_status'],
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
      label: { fr: 'Titre de l’épisode', ar: 'عنوان الحلقة' },
    },
    slugField(),
    {
      name: 'description',
      type: 'richText',
      localized: true,
      label: { fr: 'Notes d’épisode', ar: 'ملاحظات الحلقة' },
      admin: {
        description: {
          fr: 'Ce qui se dit dans l’épisode, avec les liens cités. Indexable — contrairement à l’audio.',
          ar: 'ما يقال في الحلقة مع الروابط المذكورة. قابل للفهرسة خلافا للصوت.',
        },
      },
    },
    {
      name: 'embedUrl',
      type: 'text',
      required: true,
      label: { fr: 'URL du lecteur (Ausha / Acast)', ar: 'رابط المشغل' },
      admin: {
        description: {
          fr: 'URL d’intégration fournie par l’hébergeur audio. Ne pas téléverser le MP3 dans la médiathèque.',
          ar: 'رابط التضمين من مستضيف الصوت. لا ترفع ملف MP3 إلى مكتبة الوسائط.',
        },
      },
    },
    {
      name: 'transcription',
      type: 'richText',
      localized: true,
      label: { fr: 'Transcription', ar: 'التفريغ' },
      admin: {
        description: {
          fr: 'Facultatif mais fortement recommandé : accessibilité, et c’est le seul texte que Google peut lire.',
          ar: 'اختياري لكنه موصى به بشدة: إمكانية الوصول، وهو النص الوحيد الذي تقرأه غوغل.',
        },
      },
    },

    {
      type: 'row',
      fields: [
        {
          name: 'numero',
          type: 'number',
          min: 1,
          label: { fr: 'Numéro d’épisode', ar: 'رقم الحلقة' },
        },
        {
          name: 'duree',
          type: 'number',
          min: 1,
          label: { fr: 'Durée (minutes)', ar: 'المدة (دقائق)' },
        },
      ],
    },
    {
      name: 'publishedAt',
      type: 'date',
      index: true,
      label: { fr: 'Date de diffusion', ar: 'تاريخ البث' },
      defaultValue: () => new Date().toISOString(),
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' },
      },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: { fr: 'Visuel de l’épisode', ar: 'صورة الحلقة' },
    },
    {
      name: 'invites',
      type: 'relationship',
      relationTo: 'personnalites',
      hasMany: true,
      label: { fr: 'Invités', ar: 'الضيوف' },
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
