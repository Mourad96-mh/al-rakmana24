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
  hooks: {
    // The very first account must be an admin, and nothing else can make it one.
    // Payload's /admin/create-first-user screen posts with no session, so
    // `adminFieldOnly` strips `role` from the form and the `contributeur`
    // default would apply — an owner locked out of their own CMS, with
    // `create: isAdmin` leaving no way back in. This is not an escalation path:
    // it only fires while the collection is empty, which is exactly when Payload
    // allows first-register.
    //
    // Prefer `pnpm create-admin` (scripts/create-admin.ts) in any environment
    // that is reachable from the internet: it creates the account before the
    // site is exposed, so the create-first-user screen never appears at all and
    // this hook never has to be the thing standing between a stranger and the
    // newsroom.
    beforeChange: [
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        // `count` is illegal inside the transaction Payload opens for a create on
        // Mongo, so ask for one document with pagination off instead.
        const existing = await req.payload.find({
          collection: 'users',
          limit: 1,
          depth: 0,
          pagination: false,
          req,
        })
        if (existing.docs.length > 0) return data
        return { ...data, role: 'admin' }
      },
    ],
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
      /**
       * EVERY record in this collection is staff — readers live in
       * `collections/Abonnes` and cannot appear here.
       *
       * The default is therefore the least-privileged STAFF role, not the
       * least-privileged role that exists: if `role` is ever dropped from a
       * payload (field access strips it for non-admins), the account that
       * results can draft and nothing else. It can never publish, never delete,
       * and never edit another journalist's work.
       */
      defaultValue: 'contributeur',
      options: [
        { label: { fr: 'Administrateur', ar: 'مدير' }, value: 'admin' },
        { label: { fr: 'Rédacteur en chef', ar: 'رئيس التحرير' }, value: 'redacteur-en-chef' },
        { label: { fr: 'Journaliste', ar: 'صحفي' }, value: 'journaliste' },
        { label: { fr: 'Contributeur', ar: 'مساهم' }, value: 'contributeur' },
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
