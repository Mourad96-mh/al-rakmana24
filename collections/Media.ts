import type { CollectionConfig } from 'payload'
import { publicRead, canCreateContent, isEditorial } from '../lib/payload-access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { fr: 'Média', ar: 'وسائط' },
    plural: { fr: 'Médiathèque', ar: 'مكتبة الوسائط' },
  },
  admin: {
    group: { fr: 'Contenu', ar: 'المحتوى' },
  },
  access: {
    read: publicRead,
    create: canCreateContent,
    update: isEditorial,
    delete: isEditorial,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
    // Widths mirror the responsive srcset the reference site serves.
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 512, position: 'centre' },
      { name: 'feature', width: 1200, height: 675, position: 'centre' },
      { name: 'wide', width: 1920, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      label: { fr: 'Texte alternatif', ar: 'النص البديل' },
      admin: {
        description: {
          fr: 'Obligatoire pour l’accessibilité et le référencement. Décrire l’image, pas la légender.',
          ar: 'إلزامي لإمكانية الوصول وتحسين الظهور. صف الصورة ولا تكتب تعليقا.',
        },
      },
    },
    {
      name: 'credit',
      type: 'text',
      label: { fr: 'Crédit photo', ar: 'مصدر الصورة' },
    },
    {
      name: 'legende',
      type: 'text',
      localized: true,
      label: { fr: 'Légende', ar: 'التعليق' },
    },
  ],
}
