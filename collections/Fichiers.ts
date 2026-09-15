import type { CollectionConfig } from 'payload'
import { publicRead, canCreateContent, isEditorial } from '../lib/payload-access'

/**
 * The file store for DOCUMENTS — the `Media` collection of everything that is
 * not an image.
 *
 * Kept separate from `Media` for two reasons: Payload generates image
 * renditions for what lands in Media (meaningless for a PDF), and the
 * médiathèque is where the newsroom looks for photographs — burying a 12 MB
 * study in it would make both harder to use.
 *
 * Two collections consume it, and they stay separate on purpose (client
 * instruction): `Documents` — the newsroom's own contrats, attestations, études
 * and synthèses — and `TextesJuridiques.fichier`, the official text itself.
 */
export const Fichiers: CollectionConfig = {
  slug: 'fichiers',
  labels: {
    singular: { fr: 'Fichier', ar: 'ملف' },
    plural: { fr: 'Fichiers', ar: 'الملفات' },
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'mimeType', 'filesize'],
    group: { fr: 'Contenu', ar: 'المحتوى' },
    description: {
      fr: 'Les fichiers téléchargeables. Le titre et la description se saisissent sur la fiche qui les utilise, pas ici.',
      ar: 'الملفات القابلة للتحميل. العنوان والوصف يدخلان في البطاقة التي تستعملها لا هنا.',
    },
  },
  access: {
    read: publicRead,
    create: canCreateContent,
    update: isEditorial,
    delete: isEditorial,
  },
  upload: {
    staticDir: 'fichiers',
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
    ],
  },
  fields: [
    {
      name: 'note',
      type: 'text',
      label: { fr: 'Note interne', ar: 'ملاحظة داخلية' },
      admin: {
        description: {
          fr: 'Pour la rédaction uniquement : version, provenance, date de mise à jour du fichier.',
          ar: 'لهيئة التحرير فقط: النسخة والمصدر وتاريخ تحديث الملف.',
        },
      },
    },
  ],
}
