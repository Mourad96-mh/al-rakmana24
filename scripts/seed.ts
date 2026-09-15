/**
 * Idempotent bilingual seed.
 *
 * Run it as many times as you like: every document is looked up by a stable
 * natural key first (localized `slug`, `reference`, `cle`, `email`) and updated
 * rather than re-created. Nothing is ever deleted, so it is safe against a
 * database that already has real editorial content in it.
 *
 *     pnpm seed
 *
 * WHAT IT IS FOR — and this is the important part — is Lot 3. The seed
 * deliberately creates articles that exist **in French only**, **in Arabic
 * only**, and **in both**, because `localization.fallback` is off (règle d'or
 * #2) and partial translation is the normal case on this site. A seed where
 * every article is fully bilingual would let every listing query, every
 * `hreflang` tag and every `LangSwitcher` link ship broken and still look green.
 *
 * ⚠️ The editorial copy below is INVENTED — plausible-sounding placeholder text,
 * not reporting. No headline here describes a real event, ruling, company or
 * person, and the two `textes-juridiques` records carry real references
 * (09-08, 43-20) with a summary written for layout purposes only. Never let this
 * reach production as published content.
 *
 * Images: none. `lib/media.ts` falls back to the generated placeholders in
 * `public/placeholders/`, so the seed does not need to push files through the
 * upload pipeline — the newsroom's real photography arrives via /admin.
 */

import { getPayload } from 'payload'
import type { Payload } from 'payload'

import config from '../payload.config'
import type { Config } from '../payload-types'
import type { Locale } from '../lib/rubriques'

/* ------------------------------------------------------------------ helpers */

type Localized<T> = Partial<Record<Locale, T>>

const LOCALES: readonly Locale[] = ['fr', 'ar']

/** Minimal valid Lexical document. `direction` is what makes the Arabic version render RTL. */
function richText(paragraphs: string[], locale: Locale) {
  const direction = locale === 'ar' ? 'rtl' : 'ltr'
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction,
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '' as const,
        indent: 0,
        version: 1,
        direction,
        textFormat: 0,
        children: [
          {
            type: 'text',
            text,
            format: 0,
            style: '',
            mode: 'normal',
            detail: 0,
            version: 1,
          },
        ],
      })),
    },
  }
}

const DAY = 86_400_000
const now = Date.now()
/** Deterministic dates so two runs produce the same rows. */
const ago = (days: number, hours = 0): string =>
  new Date(now - days * DAY - hours * 3_600_000).toISOString()

let created = 0
let updated = 0

/**
 * Upsert one document, locale by locale.
 *
 * `shared` holds the non-localized fields (rubrique, dates, relationships);
 * `byLocale` holds only the locales this document genuinely exists in. The first
 * present locale performs the `create`, the rest are `update`s scoped to their
 * locale — which is exactly how Payload models a partially translated document.
 */
/**
 * Options communes a chaque ecriture du seed.
 *
 * `disableRevalidate` : le seed tourne dans un simple process Node, hors du
 * serveur Next. Les hooks `afterChange` de lib/revalidate.ts y appelleraient
 * `revalidatePath` sans requete a laquelle se rattacher — une centaine
 * d'avertissements pour rien. Le site est de toute facon rebati juste apres.
 */
const WRITE_OPTS = {
  overrideAccess: true,
  context: { disableRevalidate: true },
} as const

async function upsert<TSlug extends keyof Config['collections'] & string>(
  payload: Payload,
  collection: TSlug,
  /** Natural key: a field/value pair unique enough to find the doc again. */
  key: { field: string; value: string; locale?: Locale },
  shared: Record<string, unknown>,
  byLocale: Localized<Record<string, unknown>>,
): Promise<number | string> {
  /**
   * The local API's `data` type is resolved from the *concrete* collection slug.
   * It cannot be satisfied from inside a function that is generic over the slug,
   * so this one call site goes through a structural facade. The `TSlug`
   * constraint above still catches a typo in a collection name, which is the
   * mistake actually worth catching here — everything else is validated by
   * Payload at runtime, loudly, on the first `pnpm seed`.
   */
  const api = payload as unknown as {
    find(args: Record<string, unknown>): Promise<{ docs: { id: number | string }[] }>
    create(args: Record<string, unknown>): Promise<{ id: number | string }>
    update(args: Record<string, unknown>): Promise<unknown>
  }

  const existing = await api.find({
    collection,
    where: { [key.field]: { equals: key.value } },
    locale: key.locale ?? 'fr',
    limit: 1,
    depth: 0,
    draft: true,
    overrideAccess: true,
  })

  const locales = LOCALES.filter((l) => byLocale[l] !== undefined)
  if (locales.length === 0) {
    throw new Error(`[seed] ${collection}/${key.value}: aucune locale fournie`)
  }

  let id = existing.docs[0]?.id

  for (const locale of locales) {
    const data = { ...shared, ...byLocale[locale] }

    if (id === undefined) {
      const doc = await api.create({ collection, locale, data, ...WRITE_OPTS })
      id = doc.id
      created += 1
    } else {
      await api.update({ collection, id, locale, data, ...WRITE_OPTS })
      updated += 1
    }
  }

  return id
}

/* -------------------------------------------------------------------- data */

async function seed(payload: Payload): Promise<void> {
  /* --- Auteurs ---------------------------------------------------------- */

  const redaction = await upsert(
    payload,
    'auteurs',
    { field: 'slug', value: 'la-redaction' },
    {},
    {
      fr: { title: 'La rédaction', slug: 'la-redaction', fonction: 'Al-Raqmana24' },
      ar: { title: 'هيئة التحرير', slug: 'هيئه-التحرير', fonction: 'الرقمنة24' },
    },
  )

  const chroniqueur = await upsert(
    payload,
    'auteurs',
    { field: 'slug', value: 'salma-benali' },
    {},
    {
      fr: {
        title: 'Salma Benali',
        slug: 'salma-benali',
        fonction: 'Juriste, spécialiste du droit du numérique',
        bio: 'Signature de démonstration. Cette fiche est un exemple : elle ne correspond à aucune personne réelle.',
      },
      ar: {
        title: 'سلمى بنعلي',
        slug: 'سلمي-بنعلي',
        fonction: 'حقوقية متخصصة في قانون الرقمنة',
        bio: 'توقيع للعرض التوضيحي. هذه البطاقة مثال ولا تعود إلى أي شخص حقيقي.',
      },
    },
  )

  /* --- Tags ------------------------------------------------------------- */

  const tagIds: Record<string, number | string> = {}
  const tags: { key: string; fr: [string, string]; ar: [string, string] }[] = [
    { key: 'donnees', fr: ['Données personnelles', 'donnees-personnelles'], ar: ['المعطيات الشخصية', 'المعطيات-الشخصيه'] },
    { key: 'financement', fr: ['Financement', 'financement'], ar: ['التمويل', 'التمويل'] },
    { key: 'regulation', fr: ['Régulation', 'regulation'], ar: ['التنظيم', 'التنظيم'] },
  ]
  for (const t of tags) {
    tagIds[t.key] = await upsert(
      payload,
      'tags',
      { field: 'slug', value: t.fr[1] },
      {},
      {
        fr: { title: t.fr[0], slug: t.fr[1] },
        ar: { title: t.ar[0], slug: t.ar[1] },
      },
    )
  }

  /* --- Entités : startups, entreprises, personnalités -------------------- */

  const startup = await upsert(
    payload,
    'startups',
    { field: 'slug', value: 'demo-paytech' },
    {
      secteur: 'fintech',
      stade: 'serie-a',
      anneeCreation: 2019,
      ville: 'Casablanca',
      levees: [
        {
          date: ago(240),
          tour: 'seed',
          montant: 12_000_000,
          devise: 'MAD',
          investisseurs: 'Investisseurs de démonstration',
          source: 'https://example.org/annonce-fictive',
        },
        {
          date: ago(45),
          tour: 'serie-a',
          montant: 60_000_000,
          devise: 'MAD',
          investisseurs: 'Investisseurs de démonstration',
          source: 'https://example.org/annonce-fictive',
        },
      ],
    },
    {
      fr: {
        title: 'Demo PayTech',
        slug: 'demo-paytech',
        description: richText(
          [
            'Fiche de démonstration. Demo PayTech est une entreprise fictive utilisée pour valider la page hub startup avant la mise en ligne.',
          ],
          'fr',
        ),
      },
      ar: {
        title: 'ديمو بايتيك',
        slug: 'ديمو-بايتيك',
        description: richText(
          ['بطاقة توضيحية. «ديمو بايتيك» شركة وهمية تستعمل للتحقق من صفحة الشركات الناشئة قبل النشر.'],
          'ar',
        ),
      },
    },
  )

  const entreprise = await upsert(
    payload,
    'entreprises',
    { field: 'slug', value: 'organisme-de-demonstration' },
    { nature: 'regulateur', secteur: 'Numérique', siege: 'Rabat' },
    {
      fr: {
        title: 'Organisme de démonstration',
        slug: 'organisme-de-demonstration',
        description: richText(
          ['Fiche de démonstration : cet organisme n’existe pas. Elle sert à valider la page hub « entreprises et organisations ».'],
          'fr',
        ),
      },
      ar: {
        title: 'هيئة للعرض التوضيحي',
        slug: 'هيئه-للعرض-التوضيحي',
        description: richText(['بطاقة توضيحية: هذه الهيئة غير موجودة. تستعمل للتحقق من صفحة «الشركات والمنظمات».'], 'ar'),
      },
    },
  )

  const personnalite = await upsert(
    payload,
    'personnalites',
    { field: 'slug', value: 'karim-demo' },
    { organisation: { relationTo: 'startups', value: startup } },
    {
      fr: {
        title: 'Karim Demo',
        slug: 'karim-demo',
        fonction: 'Cofondateur de Demo PayTech',
        bio: richText(['Personne fictive, créée pour valider la page hub « personnalités ».'], 'fr'),
      },
      ar: {
        title: 'كريم ديمو',
        slug: 'كريم-ديمو',
        fonction: 'شريك مؤسس لديمو بايتيك',
        bio: richText(['شخصية وهمية أنشئت للتحقق من صفحة «الشخصيات».'], 'ar'),
      },
    },
  )

  /* --- Textes juridiques ------------------------------------------------ */

  const loi0908 = await upsert(
    payload,
    'textes-juridiques',
    { field: 'reference', value: '09-08' },
    {
      reference: '09-08',
      typeTexte: 'loi',
      statut: 'en-vigueur',
      dateStatut: ago(30),
      lienOfficiel: 'https://www.sgg.gov.ma/',
    },
    {
      fr: {
        title:
          'Loi n° 09-08 relative à la protection des personnes physiques à l’égard du traitement des données à caractère personnel',
        slug: 'loi-09-08-protection-donnees-personnelles',
        resume: richText(
          [
            'Résumé de démonstration, à réécrire par la rédaction avant toute mise en ligne.',
            'La fiche a vocation à expliquer le texte en langage clair : à qui il s’applique, quelles obligations il crée, et quelles sont les démarches à accomplir.',
          ],
          'fr',
        ),
      },
      ar: {
        title: 'القانون رقم 09-08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي',
        slug: 'قانون-09-08-حمايه-المعطيات-الشخصيه',
        resume: richText(
          [
            'ملخص للعرض التوضيحي، على هيئة التحرير إعادة كتابته قبل أي نشر.',
            'الغاية من البطاقة شرح النص بلغة واضحة: على من يطبق، وما الالتزامات التي ينشئها، وما المساطر الواجب سلوكها.',
          ],
          'ar',
        ),
      },
    },
  )

  const loi4320 = await upsert(
    payload,
    'textes-juridiques',
    { field: 'reference', value: '43-20' },
    {
      reference: '43-20',
      typeTexte: 'loi',
      statut: 'en-vigueur',
      dateStatut: ago(30),
      lienOfficiel: 'https://www.sgg.gov.ma/',
      textesLies: [loi0908],
    },
    {
      fr: {
        title: 'Loi n° 43-20 relative aux services de confiance pour les transactions électroniques',
        slug: 'loi-43-20-services-de-confiance-transactions-electroniques',
        resume: richText(
          ['Résumé de démonstration. À remplacer par une synthèse rédigée et vérifiée avant publication.'],
          'fr',
        ),
      },
      // Volontairement pas de version arabe : elle valide le cas « texte FR-only ».
    },
  )

  /* --- Dossier ---------------------------------------------------------- */

  const dossier = await upsert(
    payload,
    'dossiers',
    { field: 'slug', value: 'financer-une-startup-au-maroc' },
    { enCours: true },
    {
      fr: {
        title: 'Financer une startup au Maroc',
        slug: 'financer-une-startup-au-maroc',
        kicker: 'Série',
        description:
          'Dossier de démonstration. Les articles s’y ajoutent depuis la fiche de chaque article, jamais depuis le dossier.',
      },
      ar: {
        title: 'تمويل شركة ناشئة بالمغرب',
        slug: 'تمويل-شركه-ناشئه-بالمغرب',
        kicker: 'سلسلة',
        description: 'ملف للعرض التوضيحي. تضاف المقالات إليه من بطاقة كل مقال لا من الملف نفسه.',
      },
    },
  )

  /* --- Articles ---------------------------------------------------------
   *
   * Six articles, on purpose:
   *   3 bilingues · 2 FR seulement · 1 AR seulement
   * Lot 3 must make every listing, hreflang tag and language switcher behave
   * correctly on all three shapes.
   */

  interface SeedArticle {
    key: string
    shared: Record<string, unknown>
    fr?: Record<string, unknown>
    ar?: Record<string, unknown>
  }

  const articles: SeedArticle[] = [
    {
      key: 'plateformes-numeriques-cadre-juridique-dedie',
      shared: {
        rubrique: 'actus-juridique',
        sousRubrique: 'droit-des-plateformes',
        format: 'decryptage',
        publishedAt: ago(0, 3),
        accessLevel: 'public',
        aLaUne: true,
        _status: 'published',
        auteurs: [redaction],
        textesJuridiques: [loi4320],
        tags: [tagIds.regulation],
      },
      fr: {
        title: 'Plateformes numériques : ce que changerait un cadre juridique dédié',
        slug: 'plateformes-numeriques-cadre-juridique-dedie',
        excerpt:
          'Responsabilité des intermédiaires, obligations de transparence, retrait des contenus : les points sur lesquels un futur texte serait attendu.',
        body: richText(
          [
            'Article de démonstration. Le texte ci-dessous n’a aucune valeur informative et sera remplacé par la production de la rédaction.',
            'Il sert uniquement à vérifier la mise en page d’un décryptage : longueur des paragraphes, respiration typographique, comportement de la colonne de lecture.',
          ],
          'fr',
        ),
      },
      ar: {
        title: 'المنصات الرقمية: ما الذي سيتغير بإطار قانوني خاص',
        slug: 'المنصات-الرقميه-اطار-قانوني-خاص',
        excerpt: 'مسؤولية الوسطاء والتزامات الشفافية وسحب المحتويات: أبرز النقاط المنتظرة في أي نص مقبل.',
        body: richText(
          [
            'مقال للعرض التوضيحي. النص أسفله بلا أي قيمة إخبارية وسيعوض بإنتاج هيئة التحرير.',
            'الغاية منه التحقق من إخراج قراءة تحليلية بالعربية: طول الفقرات، وتنفس النص، وسلوك عمود القراءة من اليمين إلى اليسار.',
          ],
          'ar',
        ),
      },
    },
    {
      key: 'donnees-personnelles-conformite-entreprises',
      shared: {
        rubrique: 'actus-juridique',
        sousRubrique: 'donnees-personnelles',
        format: 'analyse',
        publishedAt: ago(0, 9),
        accessLevel: 'public',
        _status: 'published',
        auteurs: [chroniqueur],
        textesJuridiques: [loi0908],
        entreprises: [entreprise],
        tags: [tagIds.donnees],
      },
      fr: {
        title: 'Données personnelles : où en sont vraiment les entreprises marocaines ?',
        slug: 'donnees-personnelles-conformite-entreprises',
        excerpt:
          'Registre des traitements, désignation d’un référent, information des personnes : la mise en conformité reste inégale selon la taille.',
        body: richText(
          ['Article de démonstration lié à la loi 09-08, servant à valider l’affichage du hub « textes juridiques ».'],
          'fr',
        ),
      },
      ar: {
        title: 'المعطيات الشخصية: أين وصلت الشركات المغربية فعلا؟',
        slug: 'المعطيات-الشخصيه-امتثال-الشركات',
        excerpt: 'سجل المعالجة وتعيين مسؤول وإخبار الأشخاص: الامتثال ما زال متفاوتا حسب حجم المقاولة.',
        body: richText(['مقال للعرض التوضيحي مرتبط بالقانون 09-08 للتحقق من عرض صفحة «النصوص القانونية».'], 'ar'),
      },
    },
    {
      key: 'levees-de-fonds-premier-semestre',
      shared: {
        rubrique: 'la-startup-marocaine',
        sousRubrique: 'levees-de-fonds',
        format: 'actualite',
        publishedAt: ago(1, 2),
        accessLevel: 'public',
        aLaUne: true,
        _status: 'published',
        auteurs: [redaction],
        startups: [startup],
        personnalites: [personnalite],
        dossiers: [dossier],
        tags: [tagIds.financement],
      },
      fr: {
        title: 'Levées de fonds : un premier semestre porté par la fintech',
        slug: 'levees-de-fonds-premier-semestre',
        excerpt:
          'Les tickets d’amorçage restent majoritaires, mais quelques tours de série A rebattent les cartes.',
        body: richText(
          ['Article de démonstration. Il est relié à une startup, à une personnalité et à un dossier : les trois hubs doivent le faire apparaître sans aucune action supplémentaire.'],
          'fr',
        ),
      },
      ar: {
        title: 'جولات التمويل: نصف أول تقوده الفينتيك',
        slug: 'جولات-التمويل-النصف-الاول',
        excerpt: 'تمويلات البذرة تظل الأغلب، لكن بعض جولات السلسلة أ تعيد ترتيب المشهد.',
        body: richText(
          ['مقال للعرض التوضيحي. مرتبط بشركة ناشئة وشخصية وملف: على الصفحات الثلاث أن تظهره دون أي إجراء إضافي.'],
          'ar',
        ),
      },
    },

    // ---- FR uniquement -------------------------------------------------
    {
      key: 'marche-legaltech-marocain-etat-des-lieux',
      shared: {
        rubrique: 'legaltech-fintech',
        sousRubrique: 'marche-legaltech',
        format: 'analyse',
        publishedAt: ago(2),
        accessLevel: 'public',
        _status: 'published',
        auteurs: [chroniqueur],
        tags: [tagIds.regulation],
      },
      fr: {
        title: 'Legaltech : un marché marocain encore en formation',
        slug: 'marche-legaltech-marocain-etat-des-lieux',
        excerpt:
          'Article volontairement disponible en français uniquement : il sert à vérifier qu’il ne fuite pas côté arabe.',
        body: richText(
          [
            'Cet article existe en français et PAS en arabe, délibérément.',
            'En /ar, il doit être absent de toutes les listes, sa page doit répondre 404, et aucune balise hreflang arabe ne doit être émise pour lui. C’est le test de la règle d’or n° 2.',
          ],
          'fr',
        ),
      },
    },
    {
      key: 'mesures-encouragement-innovation-mode-emploi',
      shared: {
        rubrique: 'decryptage-sectoriel',
        sousRubrique: 'encouragement-innovation',
        format: 'decryptage',
        publishedAt: ago(3),
        accessLevel: 'public',
        _status: 'published',
        auteurs: [redaction],
        dossiers: [dossier],
      },
      fr: {
        title: 'Soutien à l’innovation : mode d’emploi des dispositifs existants',
        slug: 'mesures-encouragement-innovation-mode-emploi',
        excerpt: 'Second article français seul, pour que la liste des rubriques ait un écart FR/AR mesurable.',
        body: richText(['Article de démonstration, français uniquement.'], 'fr'),
      },
    },

    // ---- AR uniquement -------------------------------------------------
    {
      key: 'tatbiqat-mobile-almaghribia',
      shared: {
        rubrique: 'tendances',
        sousRubrique: 'applis-mobiles',
        format: 'actualite',
        publishedAt: ago(1, 6),
        accessLevel: 'public',
        _status: 'published',
        auteurs: [redaction],
      },
      ar: {
        title: 'تطبيقات مغربية تكسب مستعملين خارج الحدود',
        slug: 'تطبيقات-مغربيه-خارج-الحدود',
        excerpt: 'مقال متوفر بالعربية وحدها عمدا: للتحقق من أنه لا يظهر في النسخة الفرنسية.',
        body: richText(
          [
            'هذا المقال موجود بالعربية فقط، وليس بالفرنسية، وذلك عن قصد.',
            'في /fr يجب أن يغيب عن كل اللوائح، وأن ترد صفحته بخطأ 404، وألا تصدر له أي وسم hreflang فرنسي. هذا اختبار القاعدة الذهبية رقم 2.',
          ],
          'ar',
        ),
      },
    },
  ]

  for (const a of articles) {
    const byLocale: Localized<Record<string, unknown>> = {}
    if (a.fr) byLocale.fr = a.fr
    if (a.ar) byLocale.ar = a.ar

    // The natural key is the slug in whichever locale the article actually has.
    const keyLocale: Locale = a.fr ? 'fr' : 'ar'
    const keyValue = (byLocale[keyLocale]!.slug as string) ?? a.key

    await upsert(payload, 'articles', { field: 'slug', value: keyValue, locale: keyLocale }, a.shared, byLocale)
  }

  /* --- Podcast ---------------------------------------------------------- */

  await upsert(
    payload,
    'podcasts',
    { field: 'slug', value: 'episode-1-demonstration' },
    {
      numero: 1,
      duree: 32,
      publishedAt: ago(5),
      embedUrl: 'https://player.ausha.co/index.html?showId=demo',
      invites: [personnalite],
      _status: 'published',
    },
    {
      fr: {
        title: 'Épisode 1 — Épisode de démonstration',
        slug: 'episode-1-demonstration',
        description: richText(
          ['Épisode fictif. Le lecteur pointe vers une URL d’exemple : remplacer par l’URL fournie par l’hébergeur audio.'],
          'fr',
        ),
      },
      ar: {
        title: 'الحلقة 1 — حلقة للعرض التوضيحي',
        slug: 'الحلقه-1-عرض-توضيحي',
        description: richText(['حلقة وهمية. المشغل يشير إلى رابط مثال: يعوض بالرابط الذي يقدمه مستضيف الصوت.'], 'ar'),
      },
    },
  )

  /* --- Pages institutionnelles ------------------------------------------ */

  const pages: { cle: string; fr: [string, string, string]; ar: [string, string, string] }[] = [
    {
      cle: 'qui-sommes-nous',
      fr: [
        'Qui sommes-nous',
        'qui-sommes-nous',
        'Al-Raqmana24 est un journal en ligne marocain consacré à l’économie numérique, au droit du numérique, aux startups, à la legaltech et à la fintech. Texte de démonstration, à réécrire par la rédaction.',
      ],
      ar: [
        'من نحن',
        'من-نحن',
        'الرقمنة24 جريدة إلكترونية مغربية تعنى بالاقتصاد الرقمي وقانون الرقمنة والشركات الناشئة والليغالتيك والفينتيك. نص للعرض التوضيحي تعيد هيئة التحرير كتابته.',
      ],
    },
    {
      cle: 'la-redaction',
      fr: ['La rédaction', 'la-redaction', 'Présentation de l’équipe éditoriale. Texte de démonstration.'],
      ar: ['هيئة التحرير', 'هيئه-التحرير', 'تقديم الفريق التحريري. نص للعرض التوضيحي.'],
    },
    {
      cle: 'nous-contacter',
      fr: ['Nous contacter', 'nous-contacter', 'Coordonnées de la rédaction. Texte de démonstration.'],
      ar: ['اتصل بنا', 'اتصل-بنا', 'عناوين الاتصال بهيئة التحرير. نص للعرض التوضيحي.'],
    },
    /**
     * Les trois suivantes ne sont pas décoratives : le pied de page renvoie
     * vers « Nous rejoindre », « Mentions légales » et « Politique de
     * confidentialité » depuis CHAQUE page du site. Sans document derrière la
     * clé, `getPage` retourne `null` et ces trois liens répondent 404 —
     * partout, dans les deux langues.
     *
     * ⚠️ Les deux dernières sont de la surface juridique (loi 09-08). Le texte
     * ci-dessous est un GABARIT à faire relire, pas une mention légale valable.
     */
    {
      cle: 'nous-rejoindre',
      fr: [
        'Nous rejoindre',
        'nous-rejoindre',
        'Le journal accueille des contributions de juristes, de journalistes et de praticiens du numérique. Texte de démonstration, à réécrire par la rédaction.',
      ],
      ar: [
        'انضم إلينا',
        'انضم-الينا',
        'ترحب الجريدة بمساهمات الحقوقيين والصحافيين وممارسي الرقمنة. نص للعرض التوضيحي تعيد هيئة التحرير كتابته.',
      ],
    },
    {
      cle: 'mentions-legales',
      fr: [
        'Mentions légales',
        'mentions-legales',
        'Directeur de la publication, hébergeur, numéro de dépôt légal et coordonnées de la société éditrice. Gabarit de démonstration : à compléter et à faire valider avant la mise en ligne.',
      ],
      ar: [
        'المعلومات القانونية',
        'المعلومات-القانونيه',
        'مدير النشر والمستضيف ورقم الإيداع القانوني وعنوان الشركة الناشرة. نموذج للعرض التوضيحي: يستكمل ويصادق عليه قبل النشر.',
      ],
    },
    {
      cle: 'politique-de-confidentialite',
      fr: [
        'Politique de confidentialité',
        'politique-de-confidentialite',
        'Données collectées, finalités, durée de conservation et droits d’accès et de rectification au titre de la loi 09-08. Gabarit de démonstration : à compléter et à faire valider avant la mise en ligne.',
      ],
      ar: [
        'سياسة الخصوصية',
        'سياسه-الخصوصيه',
        'المعطيات المجمعة والغايات ومدة الحفظ وحقوق الولوج والتصحيح بمقتضى القانون 09-08. نموذج للعرض التوضيحي: يستكمل ويصادق عليه قبل النشر.',
      ],
    },
  ]

  /** Boilerplate juridique : aucune valeur de référencement, et ça dilue l'index. */
  const NOINDEX = new Set(['mentions-legales', 'politique-de-confidentialite'])

  for (const p of pages) {
    const seo = NOINDEX.has(p.cle) ? { noindex: true } : undefined

    await upsert(
      payload,
      'pages',
      { field: 'cle', value: p.cle },
      { cle: p.cle, _status: 'published' },
      {
        fr: { title: p.fr[0], slug: p.fr[1], body: richText([p.fr[2]], 'fr'), seo },
        ar: { title: p.ar[0], slug: p.ar[1], body: richText([p.ar[2]], 'ar'), seo },
      },
    )
  }
}

/* --------------------------------------------------------------------- run */

const payload = await getPayload({ config })

try {
  await seed(payload)
  console.log(`[seed] terminé — ${created} document(s) créé(s), ${updated} écriture(s) de mise à jour.`)
} catch (error) {
  console.error('[seed] échec :', error)
  process.exitCode = 1
} finally {
  await payload.destroy?.()
}
