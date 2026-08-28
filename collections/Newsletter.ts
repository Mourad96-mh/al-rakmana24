import type { CollectionConfig } from 'payload'
import { isEditorial, isAdmin } from '../lib/payload-access'

/**
 * Newsletter subscribers.
 *
 * This is the only collection holding personal data, so it is the only one with
 * a real legal obligation attached: **loi 09-08** (protection des personnes
 * physiques à l'égard du traitement des données à caractère personnel). Hence
 * `consentement`, `dateConsentement` and `source` — the three things needed to
 * prove, later, that a given address opted in knowingly and when.
 *
 * `read` is editorial-only: no public API route may enumerate the list. The
 * Lot 6 sign-up form writes through a Server Action using Payload's local API
 * with `overrideAccess`, never through the public REST endpoint.
 *
 * Brevo is a MIRROR, not the source of truth — `lib/brevo.ts` (Lot 6) is a
 * tolerant seam: a failed sync leaves the subscriber saved here, with
 * `brevoSynced` false, to be retried.
 */
export const Newsletter: CollectionConfig = {
  slug: 'newsletter',
  labels: {
    singular: { fr: 'Abonné newsletter', ar: 'مشترك في النشرة' },
    plural: { fr: 'Newsletter', ar: 'النشرة البريدية' },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'locale', 'statut', 'dateConsentement', 'brevoSynced'],
    group: { fr: 'Audience', ar: 'الجمهور' },
    description: {
      fr: 'Données personnelles (loi 09-08). Ne pas exporter hors des besoins de la newsletter ; toute désinscription doit être honorée sans délai.',
      ar: 'معطيات شخصية (القانون 09-08). لا تصدر خارج حاجات النشرة؛ كل إلغاء اشتراك يجب أن ينفذ فورا.',
    },
  },
  access: {
    // Public sign-up goes through a Server Action with the local API, not here.
    create: () => false,
    read: isEditorial,
    update: isEditorial,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      label: { fr: 'Adresse e-mail', ar: 'البريد الإلكتروني' },
    },
    {
      name: 'prenom',
      type: 'text',
      label: { fr: 'Prénom', ar: 'الاسم الشخصي' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'locale',
          type: 'select',
          required: true,
          defaultValue: 'fr',
          label: { fr: 'Langue', ar: 'اللغة' },
          options: [
            { label: 'Français', value: 'fr' },
            { label: 'العربية', value: 'ar' },
          ],
        },
        {
          name: 'statut',
          type: 'select',
          required: true,
          defaultValue: 'actif',
          index: true,
          label: { fr: 'Statut', ar: 'الوضعية' },
          options: [
            { label: { fr: 'Actif', ar: 'نشط' }, value: 'actif' },
            { label: { fr: 'Désinscrit', ar: 'ألغى الاشتراك' }, value: 'desinscrit' },
            { label: { fr: 'En erreur (bounce)', ar: 'خطأ في التسليم' }, value: 'bounce' },
          ],
        },
      ],
    },
    {
      name: 'consentement',
      type: 'checkbox',
      required: true,
      defaultValue: false,
      label: { fr: 'Consentement recueilli', ar: 'تم الحصول على الموافقة' },
      admin: {
        description: {
          fr: 'Preuve du consentement explicite (loi 09-08). Ne jamais cocher à la main pour une adresse importée.',
          ar: 'إثبات الموافقة الصريحة (القانون 09-08). لا تحدده يدويا لعنوان مستورد.',
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'dateConsentement',
          type: 'date',
          label: { fr: 'Date du consentement', ar: 'تاريخ الموافقة' },
          admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'dd/MM/yyyy HH:mm' } },
        },
        {
          name: 'source',
          type: 'text',
          label: { fr: 'Origine de l’inscription', ar: 'مصدر الاشتراك' },
          admin: { placeholder: 'footer · page newsletter · import' },
        },
      ],
    },
    {
      name: 'brevoSynced',
      type: 'checkbox',
      defaultValue: false,
      label: { fr: 'Synchronisé avec Brevo', ar: 'مزامن مع Brevo' },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: {
          fr: 'Non coché = l’adresse est bien enregistrée ici mais pas encore poussée chez Brevo.',
          ar: 'غير محدد = العنوان مسجل هنا لكنه لم يرسل بعد إلى Brevo.',
        },
      },
    },
  ],
}
