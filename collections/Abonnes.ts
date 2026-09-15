import type { CollectionConfig } from 'payload'
import { isAdmin, isEditorial, isEditorialUser, adminOrSelf } from '../lib/payload-access'

/**
 * Les comptes gratuits des lecteurs.
 *
 * WHY THIS IS NOT IN `Users`. Payload's admin panel authenticates against
 * exactly ONE collection — the one named by `admin.user` in payload.config.ts,
 * which is `users`. Keeping readers there meant a reader's e-mail and password
 * were *valid credentials at /admin/login*: they would authenticate, and only
 * then be refused by an access rule (`staffAdminPanel`). One regression in that
 * rule and the newsroom is open.
 *
 * Split into its own collection, a reader's password is not a key that fits the
 * admin lock at all. The refusal stops depending on a role check being right.
 *
 * Consequences worth knowing:
 *  - There is NO `role` field here, deliberately. A reader cannot be promoted;
 *    to make someone staff you create a `Users` record. Privilege is a property
 *    of which collection the account lives in, not of a column someone can edit.
 *  - `req.user` on a public request is an Abonne, so `roleOf()` in
 *    lib/payload-access.ts returns undefined and every staff check fails
 *    closed — which is the correct reading: a subscriber is not staff.
 *  - Règle d'or #1: this is a FREE account. No tier, no payment, no gating.
 *    `accessLevel` on Articles stays dormant.
 */
export const Abonnes: CollectionConfig = {
  slug: 'abonnes',
  auth: true,
  labels: {
    singular: { fr: 'Abonné', ar: 'مشترك' },
    plural: { fr: 'Abonnés', ar: 'المشتركون' },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'nom', 'localePreferee', 'createdAt'],
    group: { fr: 'Audience', ar: 'الجمهور' },
    description: {
      fr: 'Les comptes lecteurs gratuits. Ils n’ont jamais accès à ce tableau de bord.',
      ar: 'حسابات القراء المجانية. لا تصل أبدا إلى لوحة التحكم هذه.',
    },
    // Hidden from anyone who cannot read it, so the nav never offers an entry
    // that then refuses. Kept in sync with `access.read` below BY HAND — the
    // two have different signatures and Payload does not derive one from the
    // other.
    hidden: ({ user }) => !isEditorialUser(user),
  },
  access: {
    /**
     * EDITORIAL, not staff.
     *
     * This is a list of readers' e-mail addresses — personal data under loi
     * 09-08, same as `Newsletter`, which is already `isEditorial`. `isStaff`
     * included `contributeur`, so an outside contributor holding a
     * drafts-only account could page through the entire subscriber base. A
     * contributor needs none of it to file a piece, and the cost of the
     * mistake is not a wrong article — it is a leak.
     */
    read: isEditorial,
    /**
     * Closed until Lot 6.
     *
     * The free sign-up at /inscription will need public creation, but that
     * endpoint has to arrive WITH its rate limiting and its consent capture,
     * not months before them. An open account-creation route on a collection no
     * feature uses yet is pure attack surface.
     */
    create: isAdmin,
    update: adminOrSelf,
    delete: isAdmin,
    /** Belt and braces: this collection is not `admin.user`, so this never
     *  grants the panel — it only makes the intent unambiguous. */
    admin: () => false,
  },
  fields: [
    {
      name: 'nom',
      type: 'text',
      label: { fr: 'Nom', ar: 'الاسم' },
      admin: {
        description: {
          fr: 'Facultatif : un lecteur n’est pas obligé de se nommer pour recevoir la newsletter.',
          ar: 'اختياري: ليس على القارئ أن يذكر اسمه لتلقي النشرة البريدية.',
        },
      },
    },
    {
      name: 'localePreferee',
      type: 'select',
      defaultValue: 'fr',
      options: [
        { label: { fr: 'Français', ar: 'الفرنسية' }, value: 'fr' },
        { label: { fr: 'العربية', ar: 'العربية' }, value: 'ar' },
      ],
      label: { fr: 'Langue préférée', ar: 'اللغة المفضلة' },
      admin: {
        description: {
          fr: 'Détermine la langue des envois. Un article sans version dans cette langue n’est pas envoyé (règle d’or #2).',
          ar: 'تحدد لغة الإرسال. المقال بلا نسخة بهذه اللغة لا يرسل (القاعدة الذهبية رقم 2).',
        },
      },
    },
    {
      name: 'consentementNewsletter',
      type: 'checkbox',
      defaultValue: false,
      label: { fr: 'Consent à recevoir la newsletter', ar: 'يوافق على تلقي النشرة البريدية' },
      admin: {
        description: {
          fr: 'Loi 09-08 : le consentement doit être explicite et daté. Ne jamais cocher à la place du lecteur.',
          ar: 'القانون 09-08: يجب أن تكون الموافقة صريحة ومؤرخة. لا تؤشر أبدا نيابة عن القارئ.',
        },
      },
    },
  ],
  timestamps: true,
}

