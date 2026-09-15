import Image from 'next/image'
import type { Entity, EntityKind, EntitySummary } from '@/lib/content-types'
import { ENTITY_LABELS } from '@/lib/content-types'
import { resolveMedia } from '@/lib/media'
import { absolute } from '@/lib/site'
import type { Locale } from '@/lib/rubriques'
import * as links from '@/lib/links'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { SubNav } from '@/components/SubNav/SubNav'
import { EntityCard } from '@/components/EntityCard/EntityCard'
import { ArticleGrid } from '@/components/ArticleGrid/ArticleGrid'
import { DownloadButton } from '@/components/DownloadList/DownloadList'
import styles from './EntityHub.module.css'

/**
 * The four entity hubs — startups, entreprises, personnalités, textes juridiques —
 * are the same page rendered from four collections (CLAUDE.md §5: this taxonomy
 * is the SEO moat). Keeping them in one component is what guarantees they stay
 * identical as they evolve; the four route files are three lines each.
 *
 * A hub NEVER hand-curates its article list. `entity.articles` comes from the
 * articles that reference it, so publishing an article is the only way to change
 * a hub — which is exactly the property that makes the hubs trustworthy.
 */

const ORDER: EntityKind[] = ['startups', 'entreprises', 'personnalites', 'textes-juridiques']

const HUB_INTRO: Record<EntityKind, Record<Locale, string>> = {
  startups: {
    fr: 'Les jeunes pousses marocaines suivies par la rédaction. Chaque fiche rassemble automatiquement les articles qui citent l’entreprise.',
    ar: 'الشركات الناشئة المغربية التي تتابعها هيئة التحرير. تجمع كل بطاقة تلقائيا المقالات التي تذكر الشركة.',
  },
  entreprises: {
    fr: 'Les entreprises dont l’activité croise l’économie numérique, et l’ensemble de nos articles qui les mentionnent.',
    ar: 'المقاولات التي يتقاطع نشاطها مع الاقتصاد الرقمي، وجميع مقالاتنا التي تذكرها.',
  },
  personnalites: {
    fr: 'Dirigeants, juristes, investisseurs et experts cités dans nos articles.',
    ar: 'مسيرون وحقوقيون ومستثمرون وخبراء يذكرون في مقالاتنا.',
  },
  'textes-juridiques': {
    fr: 'Les textes qui encadrent l’activité numérique : le texte officiel en téléchargement, suivi dans la durée, avec les articles qui le commentent.',
    ar: 'النصوص التي تؤطر النشاط الرقمي: النص الرسمي جاهز للتحميل، متتبع عبر الزمن، مع المقالات التي تعلق عليه.',
  },
}

function hubNav(kind: EntityKind, locale: Locale) {
  return ORDER.map((k) => ({
    label: ENTITY_LABELS[k][locale],
    href: links.entityIndex(locale, k),
    current: k === kind,
  }))
}

const home = (locale: Locale) => ({
  label: locale === 'fr' ? 'Accueil' : 'الرئيسية',
  href: links.home(locale),
})

/* ------------------------------------------------------------------- index */

export function EntityIndexView({
  kind,
  entities,
  counts,
  locale,
  emptyLabel,
}: {
  kind: EntityKind
  entities: EntitySummary[]
  /** Per-slug article count, so the index can show how alive each hub is. */
  counts: Record<string, number>
  locale: Locale
  emptyLabel: string
}) {
  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[home(locale), { label: ENTITY_LABELS[kind][locale] }]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader
        kicker={locale === 'fr' ? 'Fiches' : 'بطاقات'}
        title={ENTITY_LABELS[kind][locale]}
        intro={HUB_INTRO[kind][locale]}
      >
        <SubNav
          label={locale === 'fr' ? 'Types de fiches' : 'أنواع البطاقات'}
          items={hubNav(kind, locale)}
        />
      </PageHeader>

      <div className="page-body">
        {entities.length === 0 ? (
          <p className={styles.empty}>{emptyLabel}</p>
        ) : (
          <div className={styles.index}>
            {entities.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                locale={locale}
                count={counts[entity.slug] ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ detail */

export function EntityDetailView({
  entity,
  locale,
  emptyLabel,
}: {
  entity: Entity
  locale: Locale
  emptyLabel: string
}) {
  const isPerson = entity.kind === 'personnalites'
  const image = resolveMedia(
    entity.image,
    entity.slug,
    isPerson ? 'portrait' : 'card',
    locale,
  )

  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[
          home(locale),
          {
            label: ENTITY_LABELS[entity.kind][locale],
            href: links.entityIndex(locale, entity.kind),
          },
          { label: entity.name },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader
        kicker={ENTITY_LABELS[entity.kind][locale]}
        title={entity.name}
        intro={entity.kicker}
      />

      <div className="split page-body">
        <div>
          <p className={styles.summary}>{entity.summary}</p>

          <h2 className={styles.articlesTitle}>
            {locale === 'fr' ? 'Nos articles' : 'مقالاتنا'}
          </h2>
          <ArticleGrid
            articles={entity.articles}
            locale={locale}
            emptyLabel={emptyLabel}
            lead={false}
          />
        </div>

        <aside className={styles.panel} aria-label={locale === 'fr' ? 'Fiche d’identité' : 'بطاقة التعريف'}>
          <div className={`${styles.panelMedia} ${isPerson ? styles.round : ''}`}>
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="320px"
              className={styles.panelImage}
            />
          </div>

          <dl className={styles.facts}>
            {entity.facts.map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt className={styles.factLabel}>{fact.label}</dt>
                <dd className={styles.factValue}>{fact.value}</dd>
              </div>
            ))}
          </dl>

          {entity.file ? (
            <DownloadButton
              file={entity.file}
              locale={locale}
              title={entity.name}
              block
            />
          ) : null}

          <p className={styles.disclaimer}>
            {locale === 'fr'
              ? 'Fiche de démonstration : les informations ci-dessus sont fictives et seront saisies par la rédaction.'
              : 'بطاقة تجريبية: المعلومات أعلاه متخيلة وستدخلها هيئة التحرير.'}
          </p>
        </aside>
      </div>
    </main>
  )
}
