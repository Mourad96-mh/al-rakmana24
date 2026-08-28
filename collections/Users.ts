import type { CollectionConfig } from 'payload'
import { ROLES, adminOrSelf, adminFieldOnly, isAdmin, staffAdminPanel } from '../lib/payload-access'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  labels: {
    singular: { fr: 'Utilisateur', ar: 'مستخدم' },
    plural: { fr: 'Utilisateurs', ar: 'المستخدمون' },
  },
  admin: {
    useAsTitle: 'nom',
    defaultColumns: ['nom', 'email', 'role'],
    group: { fr: 'Administration', ar: 'الإدارة' },
    hidden: ({ user }) => !staffAdminPanel({ req: { user } }),
  },
  access: {
    read: adminOrSelf,
    update: adminOrSelf,
    create: isAdmin,
    delete: isAdmin,
    admin: ({ req }) => staffAdminPanel({ req }),
  },
  fields: [
    {
      name: 'nom',
      type: 'text',
      required: true,
      label: { fr: 'Nom complet', ar: 'الاسم الكامل' },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      // Never trust the form for this: a public sign-up (Lot 6) forces `abonne`
      // server-side, and only an admin can change it afterwards.
      defaultValue: 'abonne',
      options: [
        { label: { fr: 'Administrateur', ar: 'مدير' }, value: 'admin' },
        { label: { fr: 'Rédacteur en chef', ar: 'رئيس التحرير' }, value: 'redacteur-en-chef' },
        { label: { fr: 'Journaliste', ar: 'صحفي' }, value: 'journaliste' },
        { label: { fr: 'Contributeur', ar: 'مساهم' }, value: 'contributeur' },
        { label: { fr: 'Abonné', ar: 'مشترك' }, value: 'abonne' },
      ],
      access: { create: adminFieldOnly, update: adminFieldOnly },
      label: { fr: 'Rôle', ar: 'الدور' },
    },
    {
      name: 'bio',
      type: 'textarea',
      localized: true,
      label: { fr: 'Biographie', ar: 'نبذة' },
      admin: {
        description: {
          fr: 'Affichée sur la page auteur si la personne signe des articles.',
          ar: 'تظهر في صفحة الكاتب إذا كان يوقع مقالات.',
        },
      },
    },
  ],
}

export const USER_ROLES = ROLES
