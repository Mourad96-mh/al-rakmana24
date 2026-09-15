import styles from './Welcome.module.css'

/**
 * The newsroom dashboard, as PURE LAYOUT.
 *
 * This component knows nothing about Payload, the database, or the request. It
 * takes already-computed data and renders it. The split exists so the layout
 * can be mounted with sample data and no database at all (`app/(preview)`), and
 * so every state that matters — working newsroom, fresh install, failed query —
 * can be looked at side by side instead of waited for.
 *
 * `Welcome.tsx` is the other half: it runs the queries inside the admin and
 * hands the results down. Adding a panel here means adding its data there.
 */

export type Lang = 'fr' | 'ar'

/**
 * `null` means "the count failed", not "zero" — the difference matters on
 * screen: a failed query renders an em dash, an empty collection renders 0.
 */
export type DashboardCounts = {
  publishedArticles: number | null
  draftArticles: number | null
  videos: number | null
  documents: number | null
  textes: number | null
  activeAds: number | null
}

/**
 * A PUBLISHED article that exists in one locale and not the other.
 *
 * This is the panel the dashboard was missing. `localization.fallback` is off
 * (règle d'or #2), so an article with no Arabic version is not "partially
 * translated" — it is ABSENT from /ar entirely, silently. Nothing in Payload's
 * own UI surfaces that: the editor sees a published article and assumes it is
 * online in both languages. Here it becomes a worklist.
 */
export type TranslationGap = {
  id: string
  /** The title in the locale that DOES exist — so the row is never blank. */
  title: string
  /** The locale whose version is missing. */
  missing: Lang
}

export type DraftItem = {
  id: string
  title: string
  /** Pre-formatted by the server — this component does no date work. */
  updated: string
}

export type DashboardViewProps = {
  lang: Lang
  /** Shown after the greeting. Empty is fine — the comma disappears with it. */
  name?: string
  /** Payload's configured admin route, so the links work under a custom mount. */
  adminRoute?: string
  counts: DashboardCounts
  /**
   * `undefined` = the check itself failed, which is not the same as "no gaps"
   * and must not be reported as good news. `items` is the visible head of
   * `total`.
   */
  gaps?: { items: TranslationGap[]; total: number }
  drafts?: DraftItem[]
  /**
   * True when the draft figures describe the VIEWER'S own unpublished work
   * rather than the whole newsroom's.
   *
   * Set for a `contributeur`, who may only ever edit documents they created and
   * have not published (`canUpdateContent`). Unscoped, this panel was a list of
   * headlines they cannot act on — and of colleagues' unfinished work they have
   * no reason to read.
   *
   * It changes the wording, not just the rows: `drafts`, the draft count and
   * the alert all narrow together. A panel titled « Mes brouillons » above a
   * stat counting the whole paper would be worse than either alone.
   *
   * Published figures are never scoped — a published article is on the website.
   */
  ownDraftsOnly?: boolean
}

const T = {
  greeting: { fr: 'Bonjour', ar: 'مرحبا' },
  intro: {
    fr: 'Voici l’état du journal. Les quatre actions ci-dessous couvrent l’essentiel du travail quotidien.',
    ar: 'هذه حالة الجريدة. الإجراءات الأربعة أدناه تغطي جوهر العمل اليومي.',
  },
  newArticle: { fr: 'Publier un article', ar: 'نشر مقال' },
  newVideo: { fr: 'Ajouter une vidéo', ar: 'إضافة فيديو' },
  newDocument: { fr: 'Déposer un document', ar: 'إيداع وثيقة' },
  newAd: { fr: 'Réserver un espace publicitaire', ar: 'حجز مساحة إعلانية' },
  state: { fr: 'État du site', ar: 'حالة الموقع' },
  articles: { fr: 'Articles', ar: 'المقالات' },
  drafts: { fr: 'brouillons', ar: 'مسودات' },
  draftsOwn: { fr: 'de vous, en brouillon', ar: 'مسوداتك' },
  published: { fr: 'publiés', ar: 'منشورة' },
  videos: { fr: 'Vidéos', ar: 'الفيديوهات' },
  documents: { fr: 'Documents & modèles', ar: 'وثائق ونماذج' },
  textes: { fr: 'Textes légaux', ar: 'نصوص قانونية' },
  ads: { fr: 'Publicités actives', ar: 'إعلانات نشطة' },
  attention: { fr: 'À vérifier', ar: 'يستحسن التحقق' },
  allClear: { fr: 'Rien à signaler.', ar: 'لا شيء يذكر.' },
  draftsPending: {
    fr: 'article(s) en brouillon, dont certains attendent peut-être une relecture.',
    ar: 'مقال (مقالات) في وضع المسودة، وبعضها قد ينتظر المراجعة.',
  },
  draftsPendingOwn: {
    fr: 'de vos articles sont encore en brouillon : un rédacteur en chef doit les relire pour les publier.',
    ar: 'من مقالاتك ما زالت مسودات: يجب أن يراجعها رئيس التحرير لنشرها.',
  },
  adsFree: {
    fr: 'emplacement(s) publicitaire(s) sans campagne active : le site y affiche « Espace publicitaire — réserver cet espace ».',
    ar: 'موضع (مواضع) إعلانية بلا حملة نشطة: يعرض الموقع فيها «مساحة إعلانية — احجز هذه المساحة».',
  },

  /* ---------------------------------------------- translation worklist */
  gapsTitle: { fr: 'Publiés dans une seule langue', ar: 'منشورة بلغة واحدة فقط' },
  gapsIntro: {
    fr: 'En ligne d’un côté, introuvables de l’autre. Le lien ouvre directement la version manquante.',
    ar: 'منشورة بلغة وغير موجودة بالأخرى. الرابط يفتح النسخة الناقصة مباشرة.',
  },
  gapsNone: {
    fr: 'Tous les articles publiés existent dans les deux langues.',
    ar: 'كل المقالات المنشورة متوفرة باللغتين.',
  },
  gapsFailed: {
    fr: 'Vérification des traductions indisponible.',
    ar: 'تعذر التحقق من الترجمات.',
  },
  missingAr: { fr: 'Arabe manquant', ar: 'العربية ناقصة' },
  missingFr: { fr: 'Français manquant', ar: 'الفرنسية ناقصة' },
  gapsMore: { fr: 'Voir tous les articles', ar: 'عرض كل المقالات' },

  /* ------------------------------------------------------------ drafts */
  draftsTitle: { fr: 'Brouillons récents', ar: 'أحدث المسودات' },
  draftsTitleOwn: { fr: 'Mes brouillons', ar: 'مسوداتي' },
  draftsNone: { fr: 'Aucun brouillon en attente.', ar: 'لا توجد مسودات معلقة.' },
  draftsNoneOwn: {
    fr: 'Vous n’avez aucun brouillon en cours.',
    ar: 'ليست لديك أي مسودة جارية.',
  },
  untitled: { fr: 'Sans titre', ar: 'بلا عنوان' },

  bilingual: {
    fr: 'Rappel : un contenu sans version arabe n’apparaît pas du tout sur /ar — il ne bascule jamais en français. C’est voulu.',
    ar: 'تذكير: المحتوى بلا نسخة عربية لا يظهر إطلاقا في /ar ولا يعرض بالفرنسية. هذا سلوك مقصود.',
  },
} satisfies Record<string, Record<Lang, string>>

/** Emplacements sold on the site: header, rail haut, rail bas (lib/ads.ts). */
const AD_SLOTS = 3

export function DashboardView({
  lang,
  name,
  adminRoute = '/admin',
  counts,
  gaps,
  drafts,
  ownDraftsOnly = false,
}: DashboardViewProps) {
  const t = (key: keyof typeof T) => T[key][lang]
  const { publishedArticles, draftArticles, videos, documents, textes, activeAds } = counts

  const actions = [
    { label: t('newArticle'), href: `${adminRoute}/collections/articles/create` },
    { label: t('newVideo'), href: `${adminRoute}/collections/videos/create` },
    { label: t('newDocument'), href: `${adminRoute}/collections/documents/create` },
    { label: t('newAd'), href: `${adminRoute}/collections/publicites/create` },
  ]

  const stats = [
    {
      label: t('articles'),
      value: publishedArticles,
      hint: draftArticles
        ? `${draftArticles} ${ownDraftsOnly ? t('draftsOwn') : t('drafts')}`
        : t('published'),
      href: `${adminRoute}/collections/articles`,
    },
    { label: t('videos'), value: videos, href: `${adminRoute}/collections/videos` },
    { label: t('documents'), value: documents, href: `${adminRoute}/collections/documents` },
    { label: t('textes'), value: textes, href: `${adminRoute}/collections/textes-juridiques` },
    { label: t('ads'), value: activeAds, href: `${adminRoute}/collections/publicites` },
  ]

  const alerts: string[] = []
  if (draftArticles) {
    alerts.push(`${draftArticles} ${ownDraftsOnly ? t('draftsPendingOwn') : t('draftsPending')}`)
  }
  if (activeAds !== null && activeAds < AD_SLOTS) {
    alerts.push(`${AD_SLOTS - activeAds} ${t('adsFree')}`)
  }

  return (
    <section className={styles.welcome} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h2 className={styles.greeting}>
        {t('greeting')}
        {name ? `, ${name}` : ''}.
      </h2>
      <p className={styles.intro}>{t('intro')}</p>

      <div className={styles.actions}>
        {actions.map((action) => (
          <a key={action.href} className={styles.action} href={action.href}>
            {action.label}
          </a>
        ))}
      </div>

      <h3 className={styles.sectionTitle}>{t('state')}</h3>
      <div className={styles.stats}>
        {stats.map((stat) => (
          <a key={stat.href} className={styles.stat} href={stat.href}>
            <span className={styles.statValue}>{stat.value ?? '—'}</span>
            <span className={styles.statLabel}>{stat.label}</span>
            {stat.hint ? <span className={styles.statHint}>{stat.hint}</span> : null}
          </a>
        ))}
      </div>

      <div className={styles.columns}>
        {/* ------------------------------ the bilingual worklist ------ */}
        <div className={styles.panel}>
          <h3 className={styles.sectionTitle}>{t('gapsTitle')}</h3>

          {gaps === undefined ? (
            <p className={styles.ok}>{t('gapsFailed')}</p>
          ) : gaps.items.length === 0 ? (
            <p className={styles.ok}>{t('gapsNone')}</p>
          ) : (
            <>
              <p className={styles.panelIntro}>{t('gapsIntro')}</p>
              <ul className={styles.list}>
                {gaps.items.map((gap) => (
                  <li key={gap.id}>
                    {/*
                      `?locale=` lands the editor in the EMPTY form for the
                      missing language, not on the version that already exists.
                    */}
                    <a
                      className={styles.listLink}
                      href={`${adminRoute}/collections/articles/${gap.id}?locale=${gap.missing}`}
                    >
                      <span className={styles.listTitle}>{gap.title || t('untitled')}</span>
                      <span className={styles.badge} data-missing={gap.missing}>
                        {gap.missing === 'ar' ? t('missingAr') : t('missingFr')}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              {gaps.total > gaps.items.length ? (
                <a className={styles.more} href={`${adminRoute}/collections/articles`}>
                  {t('gapsMore')} ({gaps.total})
                </a>
              ) : null}
            </>
          )}
        </div>

        {/* ------------------------------ what is still unfinished ---- */}
        <div className={styles.panel}>
          <h3 className={styles.sectionTitle}>
            {ownDraftsOnly ? t('draftsTitleOwn') : t('draftsTitle')}
          </h3>

          {!drafts || drafts.length === 0 ? (
            <p className={styles.ok}>{ownDraftsOnly ? t('draftsNoneOwn') : t('draftsNone')}</p>
          ) : (
            <ul className={styles.list}>
              {drafts.map((draft) => (
                <li key={draft.id}>
                  <a
                    className={styles.listLink}
                    href={`${adminRoute}/collections/articles/${draft.id}`}
                  >
                    <span className={styles.listTitle}>{draft.title || t('untitled')}</span>
                    <span className={styles.listMeta}>{draft.updated}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <h3 className={styles.sectionTitle}>{t('attention')}</h3>
      {alerts.length === 0 ? (
        <p className={styles.ok}>{t('allClear')}</p>
      ) : (
        <ul className={styles.alerts}>
          {alerts.map((alert) => (
            <li key={alert}>{alert}</li>
          ))}
        </ul>
      )}

      <p className={styles.note}>{t('bilingual')}</p>
    </section>
  )
}
