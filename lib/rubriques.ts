/**
 * Single source of truth for the editorial taxonomy.
 *
 * Consumed by BOTH the Payload config graph and the frontend, so this file must
 * stay dependency-free and must be imported RELATIVELY from anything under
 * `fields/` or `collections/` (règle d'or #5 — the Payload CLI loaders do not
 * resolve the `@/*` alias).
 *
 * The FR labels and slugs are verbatim from the client brief
 * (`docs/client/Rubriques AL RAQMANA.pdf`) — do not invent or rename rubriques.
 *
 * ⚠️ ARABIC LABELS AND SLUGS ARE PROVISIONAL. They are a first pass and must be
 * validated by the client's Arabic editor BEFORE launch: once published, a slug
 * change costs a permanent redirect. See docs/PLAN.md, Lot 1.
 */

export type Locale = 'fr' | 'ar'

export type Localized = Readonly<Record<Locale, string>>

export interface SousRubrique {
  /** Stable DB value. Never localized, never changes. */
  readonly value: string
  readonly label: Localized
  readonly slug: Localized
}

export interface Rubrique {
  readonly value: string
  readonly label: Localized
  readonly slug: Localized
  readonly sousRubriques: readonly SousRubrique[]
}

export const RUBRIQUES: readonly Rubrique[] = [
  {
    value: 'economie',
    label: { fr: 'Économie', ar: 'الاقتصاد' },
    slug: { fr: 'economie', ar: 'اقتصاد' },
    sousRubriques: [],
  },
  {
    value: 'actus-juridique',
    label: { fr: 'Actus juridique', ar: 'أخبار قانونية' },
    slug: { fr: 'actus-juridique', ar: 'اخبار-قانونية' },
    sousRubriques: [
      {
        value: 'propriete-intellectuelle-numerique',
        label: { fr: 'Propriété intellectuelle et numérique', ar: 'الملكية الفكرية والرقمية' },
        slug: { fr: 'propriete-intellectuelle-numerique', ar: 'الملكية-الفكرية-والرقمية' },
      },
      {
        value: 'droit-des-plateformes',
        label: { fr: 'Droit des plateformes', ar: 'قانون المنصات' },
        slug: { fr: 'droit-des-plateformes', ar: 'قانون-المنصات' },
      },
      {
        value: 'droit-confiance-numerique',
        label: { fr: 'Droit et confiance numérique', ar: 'القانون والثقة الرقمية' },
        slug: { fr: 'droit-confiance-numerique', ar: 'القانون-والثقة-الرقمية' },
      },
      {
        value: 'donnees-personnelles',
        label: { fr: 'Données personnelles', ar: 'المعطيات الشخصية' },
        slug: { fr: 'donnees-personnelles', ar: 'المعطيات-الشخصية' },
      },
    ],
  },
  {
    value: 'la-startup-marocaine',
    label: { fr: 'La startup marocaine', ar: 'الشركات الناشئة المغربية' },
    slug: { fr: 'la-startup-marocaine', ar: 'الشركات-الناشئة-المغربية' },
    sousRubriques: [
      {
        value: 'creativite-par-le-droit',
        label: { fr: 'Booster votre créativité par le Droit', ar: 'تعزيز الإبداع بالقانون' },
        slug: { fr: 'booster-votre-creativite-par-le-droit', ar: 'تعزيز-الابداع-بالقانون' },
      },
      {
        value: 'levees-de-fonds',
        label: { fr: 'Meilleures levées de fonds', ar: 'أبرز جولات التمويل' },
        slug: { fr: 'meilleures-levees-de-fonds', ar: 'ابرز-جولات-التمويل' },
      },
      {
        value: 'classements-par-secteur',
        label: { fr: 'Meilleurs classements par secteur', ar: 'أفضل التصنيفات حسب القطاع' },
        slug: { fr: 'meilleurs-classements-par-secteur', ar: 'افضل-التصنيفات-حسب-القطاع' },
      },
      {
        value: 'ecosysteme',
        label: { fr: 'Écosystème', ar: 'المنظومة' },
        slug: { fr: 'ecosysteme', ar: 'المنظومة' },
      },
    ],
  },
  {
    value: 'legaltech-fintech',
    label: { fr: 'Legaltech – Fintech', ar: 'ليغالتيك – فينتيك' },
    slug: { fr: 'legaltech-fintech', ar: 'ليغالتيك-فينتيك' },
    sousRubriques: [
      {
        value: 'marche-legaltech',
        label: { fr: 'Marché marocain de la Legaltech', ar: 'سوق الليغالتيك بالمغرب' },
        slug: { fr: 'marche-marocain-legaltech', ar: 'سوق-الليغالتيك-بالمغرب' },
      },
      {
        value: 'actualite-fintech',
        label: { fr: 'L’actualité de la Fintech', ar: 'أخبار الفينتيك' },
        slug: { fr: 'actualite-fintech', ar: 'اخبار-الفينتيك' },
      },
    ],
  },
  {
    value: 'decryptage-sectoriel',
    label: { fr: 'Décryptage sectoriel', ar: 'تحليل قطاعي' },
    slug: { fr: 'decryptage-sectoriel', ar: 'تحليل-قطاعي' },
    sousRubriques: [
      {
        value: 'reglementation-numerique',
        label: { fr: 'Réglementation numérique marocaine', ar: 'التنظيم الرقمي المغربي' },
        slug: { fr: 'reglementation-numerique-marocaine', ar: 'التنظيم-الرقمي-المغربي' },
      },
      {
        value: 'encouragement-innovation',
        label: { fr: 'Mesures d’encouragement à l’innovation', ar: 'تدابير تشجيع الابتكار' },
        slug: { fr: 'mesures-encouragement-innovation', ar: 'تدابير-تشجيع-الابتكار' },
      },
    ],
  },
  {
    value: 'tendances',
    label: { fr: 'Tendances', ar: 'اتجاهات' },
    slug: { fr: 'tendances', ar: 'اتجاهات' },
    sousRubriques: [
      {
        value: 'applis-mobiles',
        label: { fr: 'Applis mobiles', ar: 'تطبيقات الهاتف' },
        slug: { fr: 'applis-mobiles', ar: 'تطبيقات-الهاتف' },
      },
      {
        value: 'plateformes-innovantes',
        label: { fr: 'Plateformes innovantes', ar: 'منصات مبتكرة' },
        slug: { fr: 'plateformes-innovantes', ar: 'منصات-مبتكرة' },
      },
      {
        value: 'formations-organisations',
        label: {
          fr: 'Formations, organisations, fédérations',
          ar: 'التكوينات والمنظمات والجامعات المهنية',
        },
        slug: {
          fr: 'formations-organisations-federations',
          ar: 'التكوينات-والمنظمات-والجامعات-المهنية',
        },
      },
    ],
  },
] as const

/** Payload `select` options for the rubrique field. */
export const RUBRIQUE_OPTIONS = RUBRIQUES.map((r) => ({
  label: `${r.label.fr} / ${r.label.ar}`,
  value: r.value,
}))

/** Payload `select` options for the sous-rubrique field, flattened across rubriques. */
export const SOUS_RUBRIQUE_OPTIONS = RUBRIQUES.flatMap((r) =>
  r.sousRubriques.map((s) => ({
    label: `${r.label.fr} › ${s.label.fr}`,
    value: s.value,
  })),
)

export const findRubrique = (value: string): Rubrique | undefined =>
  RUBRIQUES.find((r) => r.value === value)

/** Resolve a rubrique from a URL slug in the given locale. */
export const findRubriqueBySlug = (slug: string, locale: Locale): Rubrique | undefined =>
  RUBRIQUES.find((r) => r.slug[locale] === slug)

export const findSousRubrique = (
  rubrique: Rubrique,
  value: string,
): SousRubrique | undefined => rubrique.sousRubriques.find((s) => s.value === value)

export const findSousRubriqueBySlug = (
  rubrique: Rubrique,
  slug: string,
  locale: Locale,
): SousRubrique | undefined => rubrique.sousRubriques.find((s) => s.slug[locale] === slug)
