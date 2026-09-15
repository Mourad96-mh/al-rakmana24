import type { CollectionConfig } from 'payload'
import { publicRead, isEditorial, canCreateContent } from '../lib/payload-access'
import { revalidationHooks } from '../lib/revalidate'
import { slugField } from '../fields/slugField'
import { seoField } from '../fields/seoField'
import { STATUTS, TYPES_TEXTE, toPayloadOptions } from '../lib/entity-vocab'

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
    // « Textes légaux » : le mot du client, aligné sur ce qu'affiche le site
    // (lib/content-types.ts, ENTITY_LABELS). Le slug reste `textes-juridiques`.
    singular: { fr: 'Texte légal', ar: 'نص قانوني' },
    plural: { fr: 'Textes légaux', ar: 'النصوص القانونية' },
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
  hooks: revalidationHooks,
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
          options: toPayloadOptions(TYPES_TEXTE),
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
          options: toPayloadOptions(STATUTS),
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
      /**
       * The official text itself — this is what makes the legal hub the SECOND
       * download library (client instruction: the two must stay separate). It
       * sits here rather than in `Documents` so a text keeps ONE page: summary,
       * statut, our articles and the PDF, at one URL.
       */
      name: 'fichier',
      type: 'upload',
      relationTo: 'fichiers',
      localized: true,
      label: { fr: 'Texte officiel (fichier)', ar: 'النص الرسمي (ملف)' },
      admin: {
        description: {
          fr: 'Le texte tel que publié. La version arabe et la version française sont deux fichiers distincts.',
          ar: 'النص كما نشر. النسخة العربية والنسخة الفرنسية ملفان منفصلان.',
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
