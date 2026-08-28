import type { ArticleSummary, DossierSummary, TickerItem } from './content-types'
import type { Locale } from './rubriques'

/**
 * ⚠️ PLACEHOLDER EDITORIAL CONTENT — NOT REAL NEWS.
 *
 * Every headline below is invented, to fill the layout while the design is being
 * reviewed. None of it describes a real event, company, ruling or person, and it
 * must never be published as-is: the homepage renders a visible "contenu de
 * démonstration" banner for exactly that reason.
 *
 * Lot 3 deletes this file and replaces `getHomeContent()` with Payload queries.
 * The return shape is already the final one, so no component changes then.
 */

const DAY = 86_400_000
const base = Date.UTC(2026, 7, 28, 9, 0, 0)
const ago = (days: number, hours = 0): string =>
  new Date(base - days * DAY - hours * 3_600_000).toISOString()

interface DemoArticle extends Omit<ArticleSummary, 'title' | 'excerpt'> {
  title: Record<Locale, string>
  excerpt?: Record<Locale, string>
}

const ARTICLES: readonly DemoArticle[] = [
  {
    id: 'd1',
    slug: 'reforme-cadre-juridique-plateformes-numeriques',
    rubrique: 'actus-juridique',
    sousRubrique: 'droit-des-plateformes',
    format: 'decryptage',
    publishedAt: ago(0, 2),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    author: { name: 'La rédaction', slug: 'la-redaction' },
    title: {
      fr: 'Plateformes numériques : ce que changerait un cadre juridique dédié',
      ar: 'المنصات الرقمية: ما الذي سيتغير بإطار قانوني خاص',
    },
    excerpt: {
      fr: 'Responsabilité des intermédiaires, obligations de transparence, retrait des contenus : les points sur lesquels un futur texte serait attendu.',
      ar: 'مسؤولية الوسطاء والتزامات الشفافية وسحب المحتويات: أبرز النقاط المنتظرة في أي نص مقبل.',
    },
  },
  {
    id: 'd2',
    slug: 'donnees-personnelles-conformite-entreprises',
    rubrique: 'actus-juridique',
    sousRubrique: 'donnees-personnelles',
    format: 'analyse',
    publishedAt: ago(0, 5),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Données personnelles : où en sont vraiment les entreprises marocaines ?',
      ar: 'المعطيات الشخصية: أين وصلت الشركات المغربية فعلا؟',
    },
    excerpt: {
      fr: 'Registre des traitements, désignation d’un référent, information des personnes : la mise en conformité reste inégale selon la taille.',
      ar: 'سجل المعالجة وتعيين مسؤول وإخبار الأشخاص: الامتثال ما زال متفاوتا حسب حجم المقاولة.',
    },
  },
  {
    id: 'd3',
    slug: 'levees-de-fonds-premier-semestre',
    rubrique: 'la-startup-marocaine',
    sousRubrique: 'levees-de-fonds',
    format: 'actualite',
    publishedAt: ago(0, 8),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Levées de fonds : un premier semestre porté par la fintech',
      ar: 'جولات التمويل: نصف أول تقوده الفينتيك',
    },
    excerpt: {
      fr: 'Les tickets d’amorçage restent majoritaires, mais quelques tours de série A rebattent les cartes.',
      ar: 'تمويلات البذرة تظل الأغلب، لكن بعض جولات السلسلة أ تعيد ترتيب المشهد.',
    },
  },
  {
    id: 'd4',
    slug: 'legaltech-marche-marocain-maturite',
    rubrique: 'legaltech-fintech',
    sousRubrique: 'marche-legaltech',
    format: 'analyse',
    publishedAt: ago(1),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Legaltech : un marché marocain encore en phase d’amorçage',
      ar: 'الليغالتيك: سوق مغربية ما زالت في طور الانطلاق',
    },
    excerpt: {
      fr: 'Automatisation documentaire, signature électronique, gestion de contentieux : les usages qui décollent en premier.',
      ar: 'أتمتة الوثائق والتوقيع الإلكتروني وتدبير المنازعات: الاستعمالات التي تنطلق أولا.',
    },
  },
  {
    id: 'd5',
    slug: 'paiement-mobile-adoption',
    rubrique: 'legaltech-fintech',
    sousRubrique: 'actualite-fintech',
    format: 'actualite',
    publishedAt: ago(1, 4),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Paiement mobile : l’adoption progresse, l’usage quotidien reste le défi',
      ar: 'الأداء عبر الهاتف: الاعتماد يتقدم والاستعمال اليومي هو التحدي',
    },
  },
  {
    id: 'd6',
    slug: 'reglementation-numerique-chantiers',
    rubrique: 'decryptage-sectoriel',
    sousRubrique: 'reglementation-numerique',
    format: 'decryptage',
    publishedAt: ago(1, 9),
    accessLevel: 'public',
    locales: ['fr'],
    title: {
      fr: 'Réglementation numérique : les chantiers à suivre cette année',
      ar: '',
    },
    excerpt: {
      fr: 'Confiance numérique, archivage électronique, interopérabilité : un tour d’horizon des textes en préparation.',
      ar: '',
    },
  },
  {
    id: 'd7',
    slug: 'propriete-intellectuelle-actifs-numeriques',
    rubrique: 'actus-juridique',
    sousRubrique: 'propriete-intellectuelle-numerique',
    format: 'analyse',
    publishedAt: ago(2),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Propriété intellectuelle : protéger un actif numérique, mode d’emploi',
      ar: 'الملكية الفكرية: كيف تحمي أصلا رقميا',
    },
  },
  {
    id: 'd8',
    slug: 'ecosysteme-incubateurs-cartographie',
    rubrique: 'la-startup-marocaine',
    sousRubrique: 'ecosysteme',
    format: 'infographie',
    publishedAt: ago(2, 6),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Cartographie : incubateurs et accélérateurs, qui fait quoi ?',
      ar: 'خريطة: الحاضنات ومسرعات الأعمال، من يقوم بماذا؟',
    },
  },
  {
    id: 'd9',
    slug: 'economie-numerique-contribution-pib',
    rubrique: 'economie',
    format: 'analyse',
    publishedAt: ago(2, 10),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Économie numérique : mesurer sa contribution réelle à la croissance',
      ar: 'الاقتصاد الرقمي: قياس مساهمته الحقيقية في النمو',
    },
    excerpt: {
      fr: 'Le périmètre statistique reste discuté, ce qui complique la comparaison internationale.',
      ar: 'النطاق الإحصائي ما زال محل نقاش، ما يعقد المقارنة الدولية.',
    },
  },
  {
    id: 'd10',
    slug: 'encouragement-innovation-dispositifs',
    rubrique: 'decryptage-sectoriel',
    sousRubrique: 'encouragement-innovation',
    format: 'decryptage',
    publishedAt: ago(3),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Innovation : les dispositifs d’encouragement, et leurs angles morts',
      ar: 'الابتكار: تدابير التشجيع ونقاطها العمياء',
    },
  },
  {
    id: 'd11',
    slug: 'applis-mobiles-marocaines-tendances',
    rubrique: 'tendances',
    sousRubrique: 'applis-mobiles',
    format: 'actualite',
    publishedAt: ago(3, 5),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Applis mobiles : les catégories qui progressent le plus',
      ar: 'تطبيقات الهاتف: الفئات الأكثر نموا',
    },
  },
  {
    id: 'd12',
    slug: 'confiance-numerique-signature-electronique',
    rubrique: 'actus-juridique',
    sousRubrique: 'droit-confiance-numerique',
    format: 'interview',
    publishedAt: ago(3, 11),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: '« La confiance numérique se construit d’abord par la preuve »',
      ar: '«الثقة الرقمية تُبنى أولا بالإثبات»',
    },
  },
  {
    id: 'd13',
    slug: 'classements-startups-par-secteur',
    rubrique: 'la-startup-marocaine',
    sousRubrique: 'classements-par-secteur',
    format: 'infographie',
    publishedAt: ago(4),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Classement : les secteurs qui concentrent le plus de jeunes pousses',
      ar: 'تصنيف: القطاعات الأكثر استقطابا للشركات الناشئة',
    },
  },
  {
    id: 'd14',
    slug: 'plateformes-innovantes-modeles',
    rubrique: 'tendances',
    sousRubrique: 'plateformes-innovantes',
    format: 'analyse',
    publishedAt: ago(4, 7),
    accessLevel: 'public',
    locales: ['ar'],
    title: {
      fr: '',
      ar: 'منصات مبتكرة: نماذج اقتصادية تبحث عن التوازن',
    },
  },
  {
    id: 'd15',
    slug: 'formations-numerique-competences',
    rubrique: 'tendances',
    sousRubrique: 'formations-organisations',
    format: 'actualite',
    publishedAt: ago(5),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Compétences numériques : l’écart entre formation et besoins des entreprises',
      ar: 'المهارات الرقمية: الفجوة بين التكوين وحاجات المقاولات',
    },
  },
  {
    id: 'd16',
    slug: 'creativite-par-le-droit-contrats',
    rubrique: 'la-startup-marocaine',
    sousRubrique: 'creativite-par-le-droit',
    format: 'tribune',
    publishedAt: ago(5, 6),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Le contrat comme outil de créativité, pas comme frein',
      ar: 'العقد أداة للإبداع لا عائقا أمامه',
    },
  },
  {
    id: 'd17',
    slug: 'economie-informelle-digitalisation',
    rubrique: 'economie',
    format: 'decryptage',
    publishedAt: ago(6),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Digitalisation des paiements : quel effet sur l’informel ?',
      ar: 'رقمنة الأداءات: أي أثر على القطاع غير المهيكل؟',
    },
  },
  {
    id: 'd18',
    slug: 'fintech-reglementation-bac-a-sable',
    rubrique: 'legaltech-fintech',
    sousRubrique: 'actualite-fintech',
    format: 'analyse',
    publishedAt: ago(6, 8),
    accessLevel: 'public',
    locales: ['fr', 'ar'],
    title: {
      fr: 'Bac à sable réglementaire : un outil encore peu utilisé',
      ar: 'المختبر التنظيمي: أداة ما تزال قليلة الاستعمال',
    },
  },
]

const DOSSIERS: readonly (Omit<DossierSummary, 'title' | 'kicker'> & {
  title: Record<Locale, string>
  kicker: Record<Locale, string>
})[] = [
  {
    id: 'do1',
    slug: 'droit-du-numerique-les-textes-qui-comptent',
    title: {
      fr: 'Droit du numérique : les textes qui comptent',
      ar: 'قانون الرقمنة: النصوص التي تهم',
    },
    kicker: { fr: 'Dossier', ar: 'ملف' },
  },
  {
    id: 'do2',
    slug: 'financer-sa-startup-au-maroc',
    title: { fr: 'Financer sa startup au Maroc', ar: 'تمويل شركتك الناشئة بالمغرب' },
    kicker: { fr: 'Série', ar: 'سلسلة' },
  },
  {
    id: 'do3',
    slug: 'la-fintech-mode-d-emploi',
    title: { fr: 'La fintech, mode d’emploi', ar: 'الفينتيك: دليل الاستعمال' },
    kicker: { fr: 'Enquête', ar: 'تحقيق' },
  },
]

/** Narrow a demo article to a single locale, dropping it if untranslated. */
function localize(a: DemoArticle, locale: Locale): ArticleSummary | null {
  if (!a.locales.includes(locale)) return null
  const title = a.title[locale]
  if (!title) return null

  return {
    id: a.id,
    slug: a.slug,
    title,
    excerpt: a.excerpt?.[locale] || undefined,
    rubrique: a.rubrique,
    sousRubrique: a.sousRubrique,
    format: a.format,
    publishedAt: a.publishedAt,
    author: a.author,
    image: a.image,
    accessLevel: a.accessLevel,
    locales: a.locales,
  }
}

export interface HomeContent {
  lead: ArticleSummary | null
  secondary: ArticleSummary[]
  byRubrique: { rubrique: string; articles: ArticleSummary[] }[]
  ticker: TickerItem[]
  mostRead: ArticleSummary[]
  dossiers: DossierSummary[]
}

/**
 * Locale-aware, exactly like the Payload queries that will replace it: an
 * article missing in this locale is DROPPED, never shown in the other language
 * (règle d'or #2).
 */
export function getHomeContent(locale: Locale): HomeContent {
  const all = ARTICLES.map((a) => localize(a, locale)).filter(
    (a): a is ArticleSummary => a !== null,
  )

  const sorted = [...all].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const [lead, ...rest] = sorted

  const rubriqueOrder = [
    'actus-juridique',
    'la-startup-marocaine',
    'legaltech-fintech',
    'economie',
    'decryptage-sectoriel',
    'tendances',
  ]

  return {
    lead: lead ?? null,
    secondary: rest.slice(0, 4),
    byRubrique: rubriqueOrder
      .map((rubrique) => ({
        rubrique,
        articles: sorted.filter((a) => a.rubrique === rubrique).slice(0, 5),
      }))
      .filter((group) => group.articles.length > 0),
    ticker: sorted.slice(0, 7).map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      publishedAt: a.publishedAt,
      rubrique: a.rubrique,
    })),
    mostRead: sorted.slice(2, 8),
    dossiers: DOSSIERS.map((d) => ({
      id: d.id,
      slug: d.slug,
      title: d.title[locale],
      kicker: d.kicker[locale],
    })),
  }
}
