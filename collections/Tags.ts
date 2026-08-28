import type { CollectionConfig } from 'payload'
import { publicRead, isEditorial, canCreateContent } from '../lib/payload-access'
import { slugField } from '../fields/slugField'
import { seoField } from '../fields/seoField'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: {
    singular: { fr: 'Mot-clé', ar: 'وسم' },
    plural: { fr: 'Mots-clés', ar: 'الوسوم' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: { fr: 'Rédaction', ar: 'التحرير' },
    description: {
      fr: 'Transversal aux rubriques. Un mot-clé n’est utile que s’il regroupe plusieurs articles dans la durée.',
      ar: 'عرضي بين الأركان. الوسم مفيد فقط إذا جمع عدة مقالات على المدى الطويل.',
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
      label: { fr: 'Intitulé', ar: 'التسمية' },
    },
    slugField(),
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      label: { fr: 'Description', ar: 'الوصف' },
      admin: {
        description: {
          fr: 'Affichée en tête de la page du mot-clé. Deux phrases suffisent.',
          ar: 'تعرض في رأس صفحة الوسم. جملتان تكفيان.',
        },
      },
    },
    seoField(),
  ],
}
