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
import { seoField } from '../fields/seoField'
import { parseVideoUrl } from '../lib/video-url'

/**
 * Videos.
 *
 * The file is NOT hosted here — same reasoning as the podcast audio: a KVM VPS
 * cannot serve video, and one clip that works would eat the month's bandwidth.
 * The newsroom publishes to YouTube or Vimeo (which also brings the audience)
 * and we keep the id plus the editorial material around it.
 *
 * The site renders a click-to-play FACADE (components/VideoCard): the provider's
 * iframe — and its cookies — only load when a reader presses play. That is what
 * keeps a page with three videos as fast as a page with none, and keeps the site
 * cookie-free until the reader asks for the video.
 */
export const Videos: CollectionConfig = {
  slug: 'videos',
  labels: {
    singular: { fr: 'Vidéo', ar: 'فيديو' },
    plural: { fr: 'Vidéos', ar: 'الفيديوهات' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'publishedAt', '_status'],
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
      label: { fr: 'Titre', ar: 'العنوان' },
    },
    {
      name: 'kicker',
      type: 'text',
      localized: true,
      label: { fr: 'Surtitre', ar: 'عنوان فرعي' },
      admin: {
        description: {
          fr: 'Deux mots au-dessus du titre : « Décryptage », « Entretien », « En 5 minutes ».',
          ar: 'كلمتان فوق العنوان: «قراءة»، «حوار»، «في 5 دقائق».',
        },
      },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      label: { fr: 'URL de la vidéo (YouTube / Vimeo)', ar: 'رابط الفيديو (يوتيوب / فيميو)' },
      admin: {
        description: {
          fr: 'Collez l’URL telle quelle : lien de partage, lien watch ou lien d’intégration. Ne pas téléverser le fichier vidéo.',
          ar: 'الصق الرابط كما هو: رابط المشاركة أو المشاهدة أو التضمين. لا ترفع ملف الفيديو.',
        },
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string' || !value.trim()) return true
        return parseVideoUrl(value)
          ? true
          : 'URL non reconnue. Attendu : une vidéo YouTube ou Vimeo.'
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'duree',
          type: 'number',
          min: 1,
          label: { fr: 'Durée (secondes)', ar: 'المدة (ثوان)' },
          admin: {
            description: {
              fr: 'Affichée sur la vignette (8:32).',
              ar: 'تظهر على الصورة المصغرة (8:32).',
            },
          },
        },
        {
          name: 'publishedAt',
          type: 'date',
          index: true,
          label: { fr: 'Date de publication', ar: 'تاريخ النشر' },
          defaultValue: () => new Date().toISOString(),
          admin: {
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' },
          },
        },
      ],
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: { fr: 'Image de couverture', ar: 'صورة الغلاف' },
      admin: {
        description: {
          fr: 'Recommandée en 16:9. À défaut, une image d’attente aux couleurs du journal est affichée — jamais la vignette de la plateforme.',
          ar: 'يفضل بنسبة 16:9. عند غيابها تعرض صورة انتظار بألوان الجريدة، لا صورة المنصة.',
        },
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
