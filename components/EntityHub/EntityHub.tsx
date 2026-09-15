import Image from 'next/image'
import type { Entity, EntityKind, EntitySummary, Levee } from '@/lib/content-types'
import { ENTITY_LABELS } from '@/lib/content-types'
import { LEVEE_LABELS, TOURS, vocabLabel } from '@/lib/entity-vocab'
import { resolveMedia } from '@/lib/media'
import { formatDate } from '@/lib/format'
import { absolute } from '@/lib/site'
import { entityHubJsonLd, entityIndexJsonLd } from '@/lib/jsonld'
import type { Locale } from '@/lib/rubriques'
import * as links from '@/lib/links'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { SubNav } from '@/components/SubNav/SubNav'
import { EntityCard } from '@/components/EntityCard/EntityCard'
import { ArticleGrid } from '@/components/ArticleGrid/ArticleGrid'
import { DownloadButton } from '@/components/DownloadList/DownloadList'
import { JsonLd } from '@/components/JsonLd/JsonLd'
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

/**
 * « Meilleures levées de fonds » is one of the client's own sous-rubriques
 * (CLAUDE.md §7), so a startup's funding history is editorial material, not a
 * footnote: the identity panel shows the latest round, this shows the record.
 *
 * A round with no amount is still a row — « Non communiqué » is information,
 * and dropping the line would make the company look like it raised less often
 * than it did. The source link is what makes an amount publishable at all
 * (collections/Startups.ts), so it is rendered whenever it exists.
 */
function LeveeTable({ levees, locale }: { levees: readonly Levee[]; locale: Locale }) {
  const l = (key: keyof typeof LEVEE_LABELS) => LEVEE_LABELS[key][locale]

  return (
    <section className={styles.levees} aria-labelledby="levees-titre">
      <h2 className={styles.articlesTitle} id="levees-titre">
        {l('titre')}
      </h2>

      {/* Tables are the one thing allowed to scroll sideways on a phone. */}
      <div className={styles.leveesScroll}>
        <table className={styles.leveesTable}>
          <thead>
            <tr>
              <th scope="col">{l('date')}</th>
              <th scope="col">{l('tour')}</th>
              <th scope="col">{l('montant')}</th>
              <th scope="col">{l('investisseurs')}</th>
            </tr>
          </thead>
          <tbody>
            {levees.map((levee, index) => (
              <tr key={`${levee.date ?? ''}-${levee.tour ?? ''}-${index}`}>
                <td>
                  {levee.date ? (
                    <time dateTime={levee.date}>{formatDate(levee.date, locale)}</time>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{vocabLabel(TOURS, levee.tour, locale) ?? '—'}</td>
                <td>
                  {levee.montant !== undefined
                    ? `${levee.montant.toLocaleString(locale === 'ar' ? 'ar-MA' : 'fr-MA')}${
                        levee.devise ? ` ${levee.devise}` : ''
                      }`
                    : l('nonCommunique')}
                </td>
                <td>
                  {levee.investisseurs ?? '—'}
                  {levee.source ? (
                    <>
                      {' '}
                      <a
                        className={styles.leveeSource}
                        href={levee.source}
                        rel="nofollow noopener"
                        target="_blank"
                      >
                        {l('source')}
                      </a>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
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
      {/* CollectionPage + ItemList: the index is a LIST of fiches, and saying so
          is what lets a crawler follow it into the hubs. */}
      <JsonLd data={entityIndexJsonLd(kind, entities, locale, HUB_INTRO[kind][locale])} />

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

  const levees = entity.data.kind === 'startups' ? entity.data.levees : []

  return (
    <main id="contenu" className="container">
      {/* Organization · Person · Legislation, plus the derived article list.
          `mainEntity` is what says this page is ABOUT the thing rather than one
          that merely mentions it — the distinction the hubs exist to make. */}
      <JsonLd data={entityHubJsonLd(entity, locale)} />

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

          {levees.length > 0 ? <LeveeTable levees={levees} locale={locale} /> : null}

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
                <dd className={styles.factValue}>
                  {fact.href ? (
                    // `nofollow` on an outbound link a source controls: the site
                    // web of a startup and the SGG's copy of a law are useful to
                    // the reader, not endorsements to hand a crawler.
                    <a
                      className={styles.factLink}
                      href={fact.href}
                      rel="nofollow noopener"
                      target="_blank"
                    >
                      {fact.value}
                    </a>
                  ) : (
                    fact.value
                  )}
                </dd>
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
