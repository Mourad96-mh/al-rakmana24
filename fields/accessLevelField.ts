import type { Field } from 'payload'

/**
 * DORMANT SEAM — règle d'or #1: no payment, no paywall, ever.
 *
 * The client brief says « S'abonner gratuitement ». This field exists so that a
 * future decision would not require a migration of every published article, and
 * for NO other reason. Nothing reads it: every page renders identically whatever
 * the value, and the article JSON-LD hardcodes `isAccessibleForFree: true`.
 *
 * It is hidden from everyone except `admin`, on purpose. A journalist who sees a
 * "Premium" option in the sidebar will eventually pick it, and then wonder why
 * nothing happened. If the client ever asks for gating, the wiring is a
 * deliberate decision made here — not an accident of the UI.
 */
export const accessLevelField = (): Field => ({
  name: 'accessLevel',
  type: 'select',
  required: true,
  defaultValue: 'public',
  label: { fr: 'Niveau d’accès', ar: 'مستوى الوصول' },
  options: [
    { label: { fr: 'Public (gratuit)', ar: 'عمومي (مجاني)' }, value: 'public' },
    { label: { fr: 'Compteur — inactif', ar: 'عداد — غير مفعل' }, value: 'metered' },
    { label: { fr: 'Premium — inactif', ar: 'مدفوع — غير مفعل' }, value: 'premium' },
  ],
  admin: {
    position: 'sidebar',
    condition: (_data, _siblingData, { user }) =>
      (user as { role?: string } | null)?.role === 'admin',
    description: {
      fr: 'SANS EFFET. Le site est intégralement gratuit ; ce champ est une réserve technique.',
      ar: 'بدون أي أثر. الموقع مجاني بالكامل؛ هذا الحقل احتياط تقني فقط.',
    },
  },
})
