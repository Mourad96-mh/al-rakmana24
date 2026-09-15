import type { Locale } from './rubriques'

/**
 * The closed vocabularies of the entity hubs — every `select` option in
 * `Startups`, `Entreprises` and `TextesJuridiques`, in one place.
 *
 * WHY IT IS A MODULE AND NOT JUST THE `options` ARRAYS IN THE COLLECTIONS.
 * Payload stores the option's `value` (`'fintech'`, `'en-vigueur'`), never its
 * label — so the public hub has to turn `'en-vigueur'` back into « En vigueur »
 * or « ساري المفعول ». Written twice, the two copies drift, and the drift shows
 * up as a legal text whose status the admin calls « Abrogé » and the reader
 * sees as `abroge`. Here, the collection and the page read the same table.
 *
 * Same contract as `lib/rubriques.ts`, for the same reason: this file is in the
 * `payload.config.ts` graph, so it must stay DEPENDENCY-FREE and be imported
 * RELATIVELY from anything under `collections/` (règle d'or #5 — the Payload
 * CLI loaders do not resolve the `@/*` alias).
 *
 * ⚠️ The Arabic labels are a first pass and must be validated by the client's
 * Arabic editor before launch, exactly like the rubrique labels.
 */

export type Localized = Readonly<Record<Locale, string>>

export interface VocabOption {
  readonly value: string
  readonly label: Localized
}

/** Shape Payload's `options` expects — `label` may be an object of locales. */
export const toPayloadOptions = (options: readonly VocabOption[]) =>
  options.map((o) => ({ label: o.label, value: o.value }))

/** `'fintech'` → « Fintech » / « فينتيك ». Unknown values come back untouched. */
export function vocabLabel(
  options: readonly VocabOption[],
  value: unknown,
  locale: Locale,
): string | undefined {
  if (typeof value !== 'string' || !value) return undefined
  const found = options.find((o) => o.value === value)
  // An unknown value means the option list changed under existing data. Showing
  // the raw value is ugly but honest — silently blanking it hides the problem.
  return found ? found.label[locale] : value
}

/* ------------------------------------------------------------------ startups */

export const SECTEURS: readonly VocabOption[] = [
  { value: 'fintech', label: { fr: 'Fintech', ar: 'فينتيك' } },
  { value: 'legaltech', label: { fr: 'Legaltech', ar: 'ليغالتيك' } },
  { value: 'e-commerce', label: { fr: 'E-commerce', ar: 'التجارة الإلكترونية' } },
  { value: 'healthtech', label: { fr: 'Santé numérique', ar: 'الصحة الرقمية' } },
  { value: 'edtech', label: { fr: 'Éducation', ar: 'التعليم' } },
  { value: 'logistique', label: { fr: 'Logistique', ar: 'اللوجستيك' } },
  { value: 'agritech', label: { fr: 'Agritech', ar: 'أغريتيك' } },
  { value: 'energie', label: { fr: 'Énergie', ar: 'الطاقة' } },
  { value: 'ia', label: { fr: 'Intelligence artificielle', ar: 'الذكاء الاصطناعي' } },
  { value: 'cybersecurite', label: { fr: 'Cybersécurité', ar: 'الأمن السيبراني' } },
  { value: 'autre', label: { fr: 'Autre', ar: 'أخرى' } },
]

export const STADES: readonly VocabOption[] = [
  { value: 'idee', label: { fr: 'Idée', ar: 'فكرة' } },
  { value: 'amorcage', label: { fr: 'Amorçage', ar: 'بذرة' } },
  { value: 'serie-a', label: { fr: 'Série A', ar: 'السلسلة أ' } },
  { value: 'serie-b-plus', label: { fr: 'Série B et +', ar: 'السلسلة ب فما فوق' } },
  { value: 'rentable', label: { fr: 'Rentable', ar: 'مربحة' } },
  { value: 'rachetee', label: { fr: 'Rachetée', ar: 'مستحوذ عليها' } },
  { value: 'cessee', label: { fr: 'Cessée', ar: 'متوقفة' } },
]

/**
 * The funding rounds. These lived inline in `collections/Startups.ts` until the
 * hub had to PRINT them: « Meilleures levées de fonds » is a client rubrique
 * (CLAUDE.md §7), so the tour is reader-facing text, not just an admin dropdown
 * — and the moment a value is rendered on the public site, this file's whole
 * reason for existing applies to it.
 */
export const TOURS: readonly VocabOption[] = [
  { value: 'pre-seed', label: { fr: 'Pre-seed', ar: 'ما قبل البذرة' } },
  { value: 'seed', label: { fr: 'Seed', ar: 'بذرة' } },
  { value: 'serie-a', label: { fr: 'Série A', ar: 'السلسلة أ' } },
  { value: 'serie-b', label: { fr: 'Série B', ar: 'السلسلة ب' } },
  { value: 'serie-c-plus', label: { fr: 'Série C et +', ar: 'السلسلة ج فما فوق' } },
  { value: 'dette', label: { fr: 'Dette', ar: 'دين' } },
  { value: 'subvention', label: { fr: 'Subvention', ar: 'منحة' } },
  { value: 'nc', label: { fr: 'Non communiqué', ar: 'غير معلن' } },
]

/* --------------------------------------------------------------- entreprises */

export const NATURES: readonly VocabOption[] = [
  { value: 'entreprise', label: { fr: 'Entreprise privée', ar: 'شركة خاصة' } },
  { value: 'banque', label: { fr: 'Banque / assurance', ar: 'بنك أو تأمين' } },
  { value: 'cabinet', label: { fr: 'Cabinet d’avocats', ar: 'مكتب محاماة' } },
  { value: 'administration', label: { fr: 'Administration publique', ar: 'إدارة عمومية' } },
  { value: 'regulateur', label: { fr: 'Régulateur', ar: 'جهة تنظيمية' } },
  { value: 'federation', label: { fr: 'Fédération / association', ar: 'جامعة أو جمعية' } },
  { value: 'fonds', label: { fr: 'Fonds d’investissement', ar: 'صندوق استثمار' } },
  { value: 'universite', label: { fr: 'Université / école', ar: 'جامعة أو مدرسة' } },
  { value: 'autre', label: { fr: 'Autre', ar: 'أخرى' } },
]

/* ---------------------------------------------------------- textes juridiques */

export const TYPES_TEXTE: readonly VocabOption[] = [
  { value: 'loi', label: { fr: 'Loi', ar: 'قانون' } },
  { value: 'projet-de-loi', label: { fr: 'Projet de loi', ar: 'مشروع قانون' } },
  { value: 'decret', label: { fr: 'Décret', ar: 'مرسوم' } },
  { value: 'arrete', label: { fr: 'Arrêté', ar: 'قرار' } },
  { value: 'circulaire', label: { fr: 'Circulaire', ar: 'دورية' } },
  { value: 'dahir', label: { fr: 'Dahir', ar: 'ظهير' } },
  { value: 'convention', label: { fr: 'Convention internationale', ar: 'اتفاقية دولية' } },
  { value: 'jurisprudence', label: { fr: 'Décision / jurisprudence', ar: 'قرار قضائي' } },
]

export const STATUTS: readonly VocabOption[] = [
  { value: 'en-vigueur', label: { fr: 'En vigueur', ar: 'ساري المفعول' } },
  { value: 'projet', label: { fr: 'En projet', ar: 'قيد المسطرة' } },
  { value: 'modifie', label: { fr: 'Modifié', ar: 'معدل' } },
  { value: 'abroge', label: { fr: 'Abrogé', ar: 'ملغى' } },
]

/* ------------------------------------------------------------- fact labels */

/**
 * The labels of the identity panel rows, per hub. They are display strings, so
 * they live next to the vocabularies they caption rather than in the page.
 */
export const FACT_LABELS = {
  secteur: { fr: 'Secteur', ar: 'القطاع' },
  stade: { fr: 'Stade', ar: 'المرحلة' },
  creation: { fr: 'Création', ar: 'التأسيس' },
  ville: { fr: 'Ville', ar: 'المدينة' },
  siege: { fr: 'Siège', ar: 'المقر' },
  siteWeb: { fr: 'Site web', ar: 'الموقع الإلكتروني' },
  nature: { fr: 'Nature', ar: 'الطبيعة' },
  fonction: { fr: 'Fonction', ar: 'الصفة' },
  nationalite: { fr: 'Nationalité', ar: 'الجنسية' },
  organisation: { fr: 'Organisation', ar: 'المؤسسة' },
  reference: { fr: 'Référence', ar: 'المرجع' },
  type: { fr: 'Type', ar: 'النوع' },
  statut: { fr: 'Statut', ar: 'الوضعية' },
  publicationBO: { fr: 'Publication au BO', ar: 'النشر بالجريدة الرسمية' },
  numeroBO: { fr: 'Numéro du BO', ar: 'عدد الجريدة الرسمية' },
  fondateurs: { fr: 'Fondateurs', ar: 'المؤسسون' },
  derniereLevee: { fr: 'Dernière levée', ar: 'آخر جولة تمويل' },
  dateStatut: { fr: 'Statut vérifié le', ar: 'تم التحقق من الوضعية في' },
  lienOfficiel: { fr: 'Texte officiel', ar: 'النص الرسمي' },
} as const satisfies Record<string, Localized>

/* --------------------------------------------- « Meilleures levées de fonds » */

/** Column headings of the funding table on a startup hub. */
export const LEVEE_LABELS = {
  titre: { fr: 'Levées de fonds', ar: 'جولات التمويل' },
  date: { fr: 'Date', ar: 'التاريخ' },
  tour: { fr: 'Tour', ar: 'الجولة' },
  montant: { fr: 'Montant', ar: 'المبلغ' },
  investisseurs: { fr: 'Investisseurs', ar: 'المستثمرون' },
  source: { fr: 'Source', ar: 'المصدر' },
  nonCommunique: { fr: 'Non communiqué', ar: 'غير معلن' },
} as const satisfies Record<string, Localized>
