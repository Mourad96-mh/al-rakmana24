import type { CollectionConfig } from 'payload'
import { publicRead, isEditorial, isEditorialUser } from '../lib/payload-access'

/**
 * Espaces publicitaires — the creatives behind the slots the client asked for
 * (bandeau en tête de page, colonne de droite).
 *
 * Advertising is not a paywall: règle d'or #1 forbids payment and gating, not
 * display advertising. Nothing here gates an article.
 *
 * Two things this collection deliberately does NOT do:
 *   - it does not host a script tag. A slot is an image plus a link, so the ad
 *     cannot execute code on the reader's page, cannot track them across sites,
 *     and cannot slow the site down after we measured it. An ad server, if the
 *     client ever buys one, goes inside the reserved box as a client island —
 *     see components/AdSlot.
 *   - it does not accept an arbitrary size. The slot decides the format; a
 *     creative that does not match its emplacement is letterboxed, never
 *     allowed to resize the box and shift the page.
 *
 * Only the editorial leadership can touch this: a booked campaign is a
 * contract, not editorial content.
 */
export const Publicites: CollectionConfig = {
  slug: 'publicites',
  labels: {
    singular: { fr: 'Espace publicitaire', ar: 'مساحة إعلانية' },
    plural: { fr: 'Publicité', ar: 'الإعلانات' },
  },
  admin: {
    useAsTitle: 'annonceur',
    defaultColumns: ['annonceur', 'emplacement', 'actif', 'dateDebut', 'dateFin'],
    group: { fr: 'Régie', ar: 'الإشهار' },
    description: {
      fr: 'Un emplacement libre affiche une invitation à réserver l’espace. Rien à supprimer pour « éteindre » une campagne : décochez « Active ».',
      ar: 'المساحة الشاغرة تعرض دعوة للحجز. لإيقاف حملة يكفي إلغاء تحديد «نشطة» دون حذف أي شيء.',
    },
    /**
     * PUREMENT COSMÉTIQUE, contrairement à `Abonnes` et `Newsletter`.
     *
     * `read` est public ici — il le faut, le site récupère les créations sans
     * être authentifié. Cacher l'entrée ne protège donc rien : elle range
     * simplement la régie hors de la barre latérale d'un contributeur, qui ne
     * peut de toute façon ni en créer, ni en modifier, ni en supprimer.
     */
    hidden: ({ user }) => !isEditorialUser(user),
  },
  access: {
    read: publicRead,
    create: isEditorial,
    update: isEditorial,
    delete: isEditorial,
  },
  fields: [
    {
      name: 'annonceur',
      type: 'text',
      required: true,
      label: { fr: 'Annonceur', ar: 'المعلن' },
      admin: {
        description: {
          fr: 'Le nom réel de l’annonceur : il sert de texte alternatif à l’image, donc il est lu par les lecteurs d’écran.',
          ar: 'الاسم الحقيقي للمعلن: يستعمل نصا بديلا للصورة ويقرأه قارئ الشاشة.',
        },
      },
    },
    {
      name: 'emplacement',
      type: 'select',
      required: true,
      index: true,
      label: { fr: 'Emplacement', ar: 'الموضع' },
      options: [
        {
          label: { fr: 'Bandeau en tête de page — 970 × 90', ar: 'شريط أعلى الصفحة — 970 × 90' },
          value: 'header-leaderboard',
        },
        {
          label: { fr: 'Colonne de droite, haut — 300 × 250', ar: 'العمود الجانبي، أعلى — 300 × 250' },
          value: 'rail-top',
        },
        {
          label: { fr: 'Colonne de droite, bas — 300 × 600', ar: 'العمود الجانبي، أسفل — 300 × 600' },
          value: 'rail-bottom',
        },
      ],
      admin: {
        description: {
          fr: 'Le format est imposé par l’emplacement. Fournir l’image à ces dimensions exactes : une image au mauvais rapport sera centrée dans le cadre, pas étirée.',
          ar: 'المقاس يحدده الموضع. زود الصورة بهذه الأبعاد بالضبط: الصورة بنسبة خاطئة توسط في الإطار ولا تمدد.',
        },
      },
    },
    {
      name: 'visuel',
      type: 'upload',
      relationTo: 'media',
      required: true,
      /**
       * Localized: an Arabic reader gets the Arabic creative or nothing at all.
       * Showing the French banner on /ar is the same failure as showing a French
       * headline there (règle d'or #2).
       */
      localized: true,
      label: { fr: 'Visuel', ar: 'الصورة' },
    },
    {
      name: 'lienCible',
      type: 'text',
      required: true,
      label: { fr: 'Lien de destination', ar: 'رابط الوجهة' },
      admin: {
        description: {
          fr: 'URL complète, https:// inclus. Le lien est marqué « sponsorisé » pour Google — obligatoire, et cela protège le référencement du journal.',
          ar: 'رابط كامل يبدأ بـ https://. يوسم الرابط بـ«إعلاني» لغوغل، وهو إلزامي ويحمي ترتيب الجريدة.',
        },
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string' || !value.trim()) return true
        try {
          const url = new URL(value)
          return url.protocol === 'https:' || url.protocol === 'http:'
            ? true
            : 'Le lien doit commencer par https://'
        } catch {
          return 'Lien invalide. Exemple : https://exemple.ma/offre'
        }
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'dateDebut',
          type: 'date',
          label: { fr: 'Début de diffusion', ar: 'بداية العرض' },
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
        },
        {
          name: 'dateFin',
          type: 'date',
          label: { fr: 'Fin de diffusion', ar: 'نهاية العرض' },
          admin: {
            date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
            description: {
              fr: 'Laisser vide pour une diffusion sans échéance.',
              ar: 'اتركه فارغا لعرض بلا أجل.',
            },
          },
        },
      ],
    },
    {
      name: 'actif',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      label: { fr: 'Active', ar: 'نشطة' },
      admin: { position: 'sidebar' },
    },
    {
      name: 'note',
      type: 'textarea',
      label: { fr: 'Note interne', ar: 'ملاحظة داخلية' },
      admin: {
        position: 'sidebar',
        description: {
          fr: 'Contact, numéro de bon de commande, montant. Jamais affiché sur le site.',
          ar: 'جهة الاتصال ورقم الطلبية والمبلغ. لا يعرض في الموقع أبدا.',
        },
      },
    },
  ],
}
