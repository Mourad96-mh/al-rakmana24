import type { CollectionConfig } from 'payload'
import { publicRead, isEditorial, canCreateContent } from '../lib/payload-access'
import { slugField } from '../fields/slugField'
import { seoField } from '../fields/seoField'

/**
 * Entity hub for laws, decrees, bills and circulars.
 *
 * This is the single most defensible page type on the site: « loi 09-08 », « loi
 * 43-20 » and their successors are searched constantly and are, today, served by
 * PDFs of the Bulletin officiel and by nothing else. A stable URL carrying the
 * reference, the status and every article we ever wrote about the text is the
 * whole point of the entity-hub architecture.
 *
 * `statut` is the field that decays. A bill becomes a law; a law gets amended or
 * repealed. Keeping it accurate is an editorial duty, not a nice-to-have — hence
 * `dateStatut`, so a reader can see how fresh the claim is.
 */
export const TextesJuridiques: CollectionConfig = {
  slug: 'textes-juridiques',
  labels: {
    singular: { fr: 'Texte juridique', ar: 'نص قانوني' },
    plural: { fr: 'Textes juridiques', ar: 'النصوص القانونية' },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'reference', 'typeTexte', 'statut', 'datePublicationBO'],
    group: { fr: 'Entités', ar: 'الكيانات' },
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
      label: { fr: 'Intitulé', ar: 'العنوان' },
      admin: {
        placeholder: 'Loi n° 09-08 relative à la protection des personnes physiques…',
      },
    },
    slugField(),
    {
      type: 'row',
      fields: [
        {
          name: 'reference',
          type: 'text',
          required: true,
          index: true,
          label: { fr: 'Référence', ar: 'المرجع' },
          admin: {
            placeholder: '09-08',
            description: {
              fr: 'Numéro seul, tel qu’il est cité : « 09-08 », « 43-20 ». C’est ce que les gens tapent dans Google.',
              ar: 'الرقم وحده كما يستشهد به: «09-08»، «43-20». هذا ما يكتبه الناس في غوغل.',
            },
          },
        },
        {
          name: 'typeTexte',
          type: 'select',
          required: true,
          index: true,
          label: { fr: 'Type', ar: 'النوع' },
          options: [
            { label: { fr: 'Loi', ar: 'قانون' }, value: 'loi' },
            { label: { fr: 'Projet de loi', ar: 'مشروع قانون' }, value: 'projet-de-loi' },
            { label: { fr: 'Décret', ar: 'مرسوم' }, value: 'decret' },
            { label: { fr: 'Arrêté', ar: 'قرار' }, value: 'arrete' },
            { label: { fr: 'Circulaire', ar: 'دورية' }, value: 'circulaire' },
            { label: { fr: 'Dahir', ar: 'ظهير' }, value: 'dahir' },
            { label: { fr: 'Convention internationale', ar: 'اتفاقية دولية' }, value: 'convention' },
            { label: { fr: 'Décision / jurisprudence', ar: 'قرار قضائي' }, value: 'jurisprudence' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'statut',
          type: 'select',
          required: true,
          defaultValue: 'en-vigueur',
          index: true,
          label: { fr: 'Statut', ar: 'الوضعية' },
          options: [
            { label: { fr: 'En vigueur', ar: 'ساري المفعول' }, value: 'en-vigueur' },
            { label: { fr: 'En projet', ar: 'قيد المسطرة' }, value: 'projet' },
            { label: { fr: 'Modifié', ar: 'معدل' }, value: 'modifie' },
            { label: { fr: 'Abrogé', ar: 'ملغى' }, value: 'abroge' },
          ],
        },
        {
          name: 'dateStatut',
          type: 'date',
          label: { fr: 'Statut vérifié le', ar: 'تم التحقق من الوضعية في' },
          admin: {
            date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
            description: {
              fr: 'À remettre à jour à chaque vérification : c’est ce qui rend la fiche fiable.',
              ar: 'يحدث عند كل تحقق: هذا ما يجعل البطاقة موثوقة.',
            },
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'datePublicationBO',
          type: 'date',
          label: { fr: 'Publication au Bulletin officiel', ar: 'النشر بالجريدة الرسمية' },
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' } },
        },
        {
          name: 'numeroBO',
          type: 'text',
          label: { fr: 'Numéro du BO', ar: 'عدد الجريدة الرسمية' },
        },
      ],
    },
    {
      name: 'lienOfficiel',
      type: 'text',
      label: { fr: 'Lien officiel', ar: 'الرابط الرسمي' },
      admin: {
        description: {
          fr: 'URL du texte sur le site du SGG ou du Bulletin officiel.',
          ar: 'رابط النص في موقع الأمانة العامة للحكومة أو الجريدة الرسمية.',
        },
      },
    },
    {
      name: 'resume',
      type: 'richText',
      localized: true,
      label: { fr: 'Ce que dit le texte', ar: 'ما ينص عليه النص' },
      admin: {
        description: {
          fr: 'Résumé de vulgarisation, pas une recopie du texte. C’est le contenu qui fait ranker la page.',
          ar: 'ملخص تبسيطي لا نسخ للنص. هذا هو المحتوى الذي يرفع ترتيب الصفحة.',
        },
      },
    },
    {
      name: 'textesLies',
      type: 'relationship',
      relationTo: 'textes-juridiques',
      hasMany: true,
      label: { fr: 'Textes liés', ar: 'نصوص ذات صلة' },
      admin: {
        description: {
          fr: 'Texte modifié, décret d’application, texte abrogé…',
          ar: 'النص المعدل، مرسوم التطبيق، النص الملغى…',
        },
      },
    },
    seoField(),
  ],
}
