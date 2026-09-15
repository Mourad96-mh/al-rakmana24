import { cache } from 'react'

import type {
  Article,
  ArticleSummary,
  Author,
  AuthorSummary,
  BodyBlock,
  DocumentCategory,
  DocumentSummary,
  Dossier,
  DossierSummary,
  DownloadFile,
  Entity,
  EntityFact,
  EntityKind,
  EntityRef,
  EntitySummary,
  ImageInput,
  PodcastEpisode,
  PodcastSummary,
  StaticPage,
  TagSummary,
  TickerItem,
  VideoSummary,
} from './content-types'
import { DOCUMENT_CATEGORIES } from './content-types'
import type { Locale } from './rubriques'
import {
  FACT_LABELS,
  NATURES,
  SECTEURS,
  STADES,
  STATUTS,
  TYPES_TEXTE,
  vocabLabel,
} from './entity-vocab'
import { formatDate } from './format'
import { encodeParam } from './params'
import { getPayloadClient } from './payload'
import { lexicalToBlocks, readingMinutes } from './lexical'
import { parseVideoUrl } from './video-url'

/**
 * THE read API of the site. Every page and every server component imports from
 * here and from nowhere else.
 *
 * It replaces `lib/demo`, which fed the pages invented fixtures so the design
 * could be built and reviewed before the database existed. The signatures were
 * designed for this moment, so the switch is one import line per page.
 *
 * The migration is COMPLETE: every function below queries Payload and
 * `lib/demo` is gone. The signatures never changed while it happened — they
 * were async from the first day, precisely so that no call site had to move
 * twice.
 *
 * Règle d'or #2 lives here, in `rowOf()`, and nowhere else: a document with no
 * content in the requested locale is DROPPED. Not fallen back, not rendered
 * empty — absent. A caller cannot leak a French headline onto the Arabic site
 * because a caller never sees one.
 */

/* ------------------------------------------------------------------ helpers */

/**
 * Every query runs with `locale: 'all'`, so Payload returns each localized
 * field as `{ fr, ar }` instead of resolving one language.
 *
 * Two reasons, and the second is the important one:
 *   - one query answers both "what does this say in Arabic" and "does an Arabic
 *     version exist at all" — the second is what `hreflang` and the language
 *     switcher need, and a per-locale query cannot answer it without a second
 *     round-trip;
 *   - `fallback: false` means a missing translation comes back as `undefined`
 *     here, which is exactly the signal `rowOf()` filters on.
 */
type Localized<T> = Partial<Record<Locale, T>>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Read one locale out of a localized field. */
function pick<T>(value: unknown, locale: Locale): T | undefined {
  if (!isRecord(value)) return undefined
  return (value as Localized<T>)[locale]
}

/** A localized string, trimmed; `undefined` when absent or blank. */
function text(value: unknown, locale: Locale): string | undefined {
  const raw = pick<string>(value, locale)
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  return trimmed.length > 0 ? trimmed : undefined
}

/** Which locales a document genuinely exists in, judged on its title. */
function localesOf(title: unknown): Locale[] {
  const out: Locale[] = []
  for (const locale of ['fr', 'ar'] as const) if (text(title, locale)) out.push(locale)
  return out
}

/** A populated upload → the UI's image input. `resolveMedia` handles the rest. */
function imageOf(value: unknown, locale: Locale): ImageInput | undefined {
  if (!isRecord(value)) return undefined
  const url = typeof value.url === 'string' ? value.url : undefined
  if (!url) return undefined
  return {
    src: url,
    alt: text(value.alt, locale),
    width: typeof value.width === 'number' ? value.width : undefined,
    height: typeof value.height === 'number' ? value.height : undefined,
    credit: typeof value.credit === 'string' ? value.credit : undefined,
  }
}

/** Populated relationships only: an unpopulated one is still an id string. */
const populated = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter(isRecord) : isRecord(value) ? [value] : []

/** `{ slug, title }` for a related document, in this locale, or nothing. */
function refOf(doc: Record<string, unknown>, locale: Locale) {
  const slug = text(doc.slug, locale)
  const title = text(doc.title, locale)
  return slug && title ? { slug, title } : null
}

/* -------------------------------------------------------------------- rows */

/**
 * One article, already resolved into this locale, plus the related slugs the
 * list filters need (`ArticleSummary` deliberately does not carry them).
 */
type Row = {
  summary: ArticleSummary
  /** `aLaUne` — shared between locales, so it is a property of the row. */
  aLaUne: boolean
  body: BodyBlock[]
  authorSlug?: string
  tagSlugs: readonly string[]
  tags: readonly { slug: string; label: string }[]
  dossierSlug?: string
  dossier?: { slug: string; title: string }
  entities: readonly EntityRef[]
}

const ENTITY_FIELDS: readonly { field: string; kind: EntityKind }[] = [
  { field: 'startups', kind: 'startups' },
  { field: 'entreprises', kind: 'entreprises' },
  { field: 'personnalites', kind: 'personnalites' },
  { field: 'textesJuridiques', kind: 'textes-juridiques' },
]

/**
 * A Payload article document → a row, or `null` if it has no life in `locale`.
 *
 * Takes `unknown` on purpose. Under `locale: 'all'` every localized field comes
 * back as `{ fr, ar }`, which is NOT the shape `payload-types.ts` describes —
 * those types document the single-locale response. Accepting the generated
 * `Article` type here would be a lie that typechecks; accepting `unknown` and
 * narrowing field by field is the honest version, and it is why every read
 * below goes through `text()` / `pick()` rather than a property access.
 */
function rowOf(input: unknown, locale: Locale): Row | null {
  if (!isRecord(input)) return null
  const doc = input

  // RÈGLE D'OR #2, the single enforcement point. No title in this language
  // means the article does not exist in this language — full stop.
  const title = text(doc.title, locale)
  const slug = text(doc.slug, locale)
  if (!title || !slug) return null

  const author = populated(doc.auteurs)
    .map((a) => {
      const name = text(a.title, locale)
      const authorSlug = text(a.slug, locale)
      return name && authorSlug ? { name, slug: authorSlug } : null
    })
    .find((a) => a !== null)

  const tags = populated(doc.tags)
    .map((t) => {
      const ref = refOf(t, locale)
      return ref ? { slug: ref.slug, label: ref.title } : null
    })
    .filter((t): t is { slug: string; label: string } => t !== null)

  const dossier = populated(doc.dossiers)
    .map((d) => refOf(d, locale))
    .find((d) => d !== null)

  const entities: EntityRef[] = []
  for (const { field, kind } of ENTITY_FIELDS) {
    for (const related of populated(doc[field])) {
      const ref = refOf(related, locale)
      if (ref) entities.push({ kind, slug: ref.slug, name: ref.title })
    }
  }

  const body = lexicalToBlocks(pick(doc.body, locale))

  return {
    summary: {
      id: String(doc.id ?? ''),
      slug,
      title,
      excerpt: text(doc.excerpt, locale),
      rubrique: typeof doc.rubrique === 'string' ? doc.rubrique : '',
      sousRubrique: typeof doc.sousRubrique === 'string' ? doc.sousRubrique : undefined,
      format: (typeof doc.format === 'string' ? doc.format : 'actualite') as ArticleSummary['format'],
      publishedAt:
        typeof doc.publishedAt === 'string'
          ? doc.publishedAt
          : typeof doc.createdAt === 'string'
            ? doc.createdAt
            : '',
      author: author ?? undefined,
      image: imageOf(doc.coverImage, locale),
      // Dormant seam (règle d'or #1): whatever is stored, the site treats every
      // article as public. Reading it here would be the first step to a paywall.
      accessLevel: 'public',
      locales: localesOf(doc.title),
    },
    aLaUne: doc.aLaUne === true,
    body,
    authorSlug: author?.slug,
    tagSlugs: tags.map((t) => t.slug),
    tags,
    dossierSlug: dossier?.slug,
    dossier: dossier ?? undefined,
    entities,
  }
}

/**
 * Every published article, resolved into one locale, newest first.
 *
 * ONE QUERY PER RENDER, memoized by React's `cache`: the homepage builds a
 * lead, four secondary slots, a ticker, a most-read column and six rubrique
 * blocks out of a single database round-trip instead of eleven.
 *
 * `limit: 0` means "no limit" in Payload. That is a deliberate choice for a
 * corpus of this size — filtering by a RELATED document's slug (tag, dossier,
 * author) cannot be expressed in the query without resolving that document
 * first, so the filtering happens here, on rows that are already in memory. The
 * day the archive makes this uncomfortable, the split is per-listing queries
 * with `where` clauses on ids; nothing outside this file changes.
 */
const loadRows = cache(async (locale: Locale): Promise<Row[]> => {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'articles',
    where: { _status: { equals: 'published' } },
    locale: 'all',
    depth: 1,
    limit: 0,
    sort: '-publishedAt',
    overrideAccess: true,
  })

  return result.docs
    .map((doc) => rowOf(doc, locale))
    .filter((row): row is Row => row !== null)
})

/* ------------------------------------------------- simple collections */

/**
 * Every document of a collection that has no drafts and no publication date —
 * auteurs, dossiers, tags, the entity hubs. One memoized query each, `locale:
 * 'all'` like everything else here.
 *
 * These collections are small by nature (a newsroom has a dozen bylines, not a
 * dozen thousand) and every page that touches one wants nearly all of it, so
 * loading the collection and filtering in memory is both simpler and fewer
 * round-trips than a `where` clause per page. The reasoning is the same as
 * `loadRows` above, and so is the exit if it ever stops being true.
 */
const loadDocs = cache(async (collection: string): Promise<Record<string, unknown>[]> => {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: collection as Parameters<Awaited<ReturnType<typeof getPayloadClient>>['find']>[0]['collection'],
    locale: 'all',
    depth: 1,
    limit: 0,
    overrideAccess: true,
  })

  // Through `unknown` on purpose, exactly like `rowOf` above: under
  // `locale: 'all'` the localized fields come back as `{ fr, ar }`, which is
  // NOT the shape the generated per-collection types describe.
  return (result.docs as unknown[]).filter(isRecord)
})

/**
 * The same thing for a collection that HAS drafts — podcasts, pages, videos,
 * documents, like the articles.
 *
 * It is a separate function rather than a flag on `loadDocs` because forgetting
 * the filter is the expensive mistake: `payload.find` with `overrideAccess`
 * returns drafts happily, so an unfiltered read publishes, on the public site,
 * a text an editor is still writing. Two names make the omission visible at the
 * call site instead of hiding it in a default argument.
 */
const loadPublished = cache(async (collection: string): Promise<Record<string, unknown>[]> => {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: collection as Parameters<Awaited<ReturnType<typeof getPayloadClient>>['find']>[0]['collection'],
    where: { _status: { equals: 'published' } },
    locale: 'all',
    depth: 1,
    limit: 0,
    overrideAccess: true,
  })

  return (result.docs as unknown[]).filter(isRecord)
})

/** The `seo` group resolved into one locale — it is localized as a whole. */
function seoOf(doc: Record<string, unknown>, locale: Locale): Record<string, unknown> {
  const group = pick<unknown>(doc.seo, locale)
  return isRecord(group) ? group : {}
}

/** Newest first, on the shared `publishedAt`. */
const byDateDesc = (a: { publishedAt: string }, b: { publishedAt: string }): number =>
  b.publishedAt.localeCompare(a.publishedAt)

/** `publishedAt`, falling back to `createdAt` — a date field is never required. */
function dateOf(doc: Record<string, unknown>): string {
  if (typeof doc.publishedAt === 'string') return doc.publishedAt
  return typeof doc.createdAt === 'string' ? doc.createdAt : ''
}

/**
 * The `(locale, slug)` pairs of a simple collection — the shape
 * `generateStaticParams` wants, and the ONLY correct one here.
 *
 * Slugs are localized (CLAUDE.md §5: Arabic documents get Arabic slugs), so the
 * old `locales × slugs` cross-product the pages used to build was wrong twice
 * over: it advertised the Arabic slug under `/fr` and the French one under
 * `/ar`, and half the pairs it produced pointed at nothing. A document
 * contributes one pair per locale it actually exists in.
 */
async function slugParams(collection: string): Promise<{ lang: Locale; slug: string }[]> {
  const docs = await loadDocs(collection)
  const out: { lang: Locale; slug: string }[] = []

  for (const doc of docs) {
    for (const lang of ['fr', 'ar'] as const) {
      const slug = text(doc.slug, lang)
      // A slug with no title is a half-saved document, not a page.
      if (slug && text(doc.title, lang)) out.push({ lang, slug: encodeParam(slug) })
    }
  }
  return out
}

/** Find one document of a simple collection by its slug IN THIS LOCALE. */
async function findBySlug(
  collection: string,
  locale: Locale,
  slug: string,
): Promise<Record<string, unknown> | null> {
  const docs = await loadDocs(collection)
  return docs.find((doc) => text(doc.slug, locale) === slug) ?? null
}

/* ----------------------------------------------------------------- articles */

export interface ArticleFilter {
  rubrique?: string
  sousRubrique?: string
  tag?: string
  dossier?: string
  author?: string
  /** Exclude one article — used to build « À lire aussi » without self-reference. */
  excludeSlug?: string
  limit?: number
}

export async function listArticles(
  locale: Locale,
  filter: ArticleFilter = {},
): Promise<ArticleSummary[]> {
  const rows = await loadRows(locale)

  const matches = rows.filter((row) => {
    if (filter.rubrique && row.summary.rubrique !== filter.rubrique) return false
    if (filter.sousRubrique && row.summary.sousRubrique !== filter.sousRubrique) return false
    if (filter.tag && !row.tagSlugs.includes(filter.tag)) return false
    if (filter.dossier && row.dossierSlug !== filter.dossier) return false
    if (filter.author && row.authorSlug !== filter.author) return false
    if (filter.excludeSlug && row.summary.slug === filter.excludeSlug) return false
    return true
  })

  const out = matches.map((row) => row.summary)
  return filter.limit ? out.slice(0, filter.limit) : out
}

export async function getArticle(locale: Locale, slug: string): Promise<Article | null> {
  const rows = await loadRows(locale)
  const row = rows.find((r) => r.summary.slug === slug)
  if (!row) return null

  return {
    ...row.summary,
    body: row.body,
    entities: row.entities,
    tags: row.tags,
    dossier: row.dossier,
    readingMinutes: readingMinutes(row.body),
  }
}

/**
 * « À lire aussi ».
 *
 * Same dossier first, then same rubrique, then anything recent — the article's
 * own relationships are a better signal than its rubrique, and its rubrique is
 * a better signal than the calendar.
 */
export async function getRelated(
  locale: Locale,
  article: Article,
  limit = 4,
): Promise<ArticleSummary[]> {
  const rows = await loadRows(locale)
  const pool = rows.filter((row) => row.summary.slug !== article.slug)

  const score = (row: Row): number => {
    if (article.dossier && row.dossierSlug === article.dossier.slug) return 0
    if (row.summary.rubrique === article.rubrique) return 1
    return 2
  }

  return [...pool]
    .sort((a, b) => score(a) - score(b))
    .slice(0, limit)
    .map((row) => row.summary)
}

/**
 * The (locale, slug) pairs that genuinely exist — the input to
 * `generateStaticParams` on `/[lang]/article/[slug]`.
 *
 * An AR-only article contributes ONE pair, not two: règle d'or #2 again, and it
 * is what makes the missing translation 404 rather than render in the wrong
 * language.
 *
 * SLUGS ARE PERCENT-ENCODED HERE (`encodeParam`), like every other
 * `generateStaticParams` in the app. The prerender manifest is matched against
 * the RAW request path, so an Arabic slug written literally produces a manifest
 * key that no incoming request can ever equal — the page was built and then
 * never served from the build, falling through to an on-demand render each time
 * the cache was cold. Verified in `.next/prerender-manifest.json`: the article
 * routes read `/ar/article/المعطيات-...` while the `[rubrique]` routes, which
 * already went through `encodeParam`, read `/ar/%D8%A7...`.
 */
export async function articleParams(): Promise<{ lang: Locale; slug: string }[]> {
  const payload = await getPayloadClient()

  const result = await payload.find({
    collection: 'articles',
    where: { _status: { equals: 'published' } },
    locale: 'all',
    depth: 0,
    limit: 0,
    overrideAccess: true,
  })

  const out: { lang: Locale; slug: string }[] = []
  for (const raw of result.docs) {
    if (!isRecord(raw)) continue
    const doc = raw
    for (const lang of ['fr', 'ar'] as const) {
      const slug = text(doc.slug, lang)
      // A slug without a title is a half-saved document, not a page.
      if (slug && text(doc.title, lang)) out.push({ lang, slug: encodeParam(slug) })
    }
  }
  return out
}

/* --------------------------------------------------------------------- home */

export interface HomeContent {
  lead: ArticleSummary | null
  secondary: ArticleSummary[]
  byRubrique: { rubrique: string; articles: ArticleSummary[] }[]
  ticker: TickerItem[]
  mostRead: ArticleSummary[]
  dossiers: DossierSummary[]
}

/**
 * Editorial order of the homepage blocks. Not alphabetical, not the admin's
 * order: it is the client's sense of what the journal leads with.
 */
const HOME_RUBRIQUES: readonly string[] = [
  'actus-juridique',
  'la-startup-marocaine',
  'legaltech-fintech',
  'economie',
  'decryptage-sectoriel',
  'tendances',
]

export async function getHomeContent(locale: Locale): Promise<HomeContent> {
  const rows = await loadRows(locale)
  const sorted = rows.map((row) => row.summary)

  /**
   * « À la une » is a candidacy, not a slot: the most recent FLAGGED article
   * leads, and if nobody has flagged anything the most recent article does. The
   * homepage is never empty because an editor forgot a checkbox.
   */
  const lead = (rows.find((row) => row.aLaUne)?.summary ?? sorted[0]) ?? null
  const rest = sorted.filter((a) => a.slug !== lead?.slug)

  return {
    lead,
    secondary: rest.slice(0, 4),
    byRubrique: HOME_RUBRIQUES.map((rubrique) => ({
      rubrique,
      articles: sorted.filter((a) => a.rubrique === rubrique).slice(0, 5),
    })).filter((group) => group.articles.length > 0),
    ticker: sorted.slice(0, 7).map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      publishedAt: a.publishedAt,
      rubrique: a.rubrique,
    })),
    mostRead: rest.slice(0, 6),
    dossiers: await listDossiers(locale),
  }
}

/* ------------------------------------------------------------------ auteurs */

/**
 * A byline, not an account (CLAUDE.md §6): `Auteurs` and `Users` are different
 * collections, and a contributor can be credited without ever having a login.
 */
function authorSummaryOf(doc: Record<string, unknown>, locale: Locale): AuthorSummary | null {
  const name = text(doc.title, locale)
  const slug = text(doc.slug, locale)
  if (!name || !slug) return null

  return {
    id: String(doc.id ?? ''),
    slug,
    name,
    role: text(doc.fonction, locale) ?? '',
    bio: text(doc.bio, locale) ?? '',
    image: imageOf(doc.photo, locale),
  }
}

export async function listAuthors(locale: Locale): Promise<AuthorSummary[]> {
  const docs = await loadDocs('auteurs')
  return docs
    .map((doc) => authorSummaryOf(doc, locale))
    .filter((a): a is AuthorSummary => a !== null)
    .sort((a, b) => a.name.localeCompare(b.name, locale))
}

export async function getAuthor(locale: Locale, slug: string): Promise<Author | null> {
  const doc = await findBySlug('auteurs', locale, slug)
  const summary = doc && authorSummaryOf(doc, locale)
  if (!doc || !summary) return null

  return {
    ...summary,
    email: typeof doc.email === 'string' && doc.email ? doc.email : undefined,
    articles: await listArticles(locale, { author: slug }),
  }
}

export const authorParams = () => slugParams('auteurs')

/* ----------------------------------------------------------------- dossiers */

function dossierSummaryOf(doc: Record<string, unknown>, locale: Locale): DossierSummary | null {
  const title = text(doc.title, locale)
  const slug = text(doc.slug, locale)
  if (!title || !slug) return null

  return {
    id: String(doc.id ?? ''),
    slug,
    title,
    kicker: text(doc.kicker, locale) ?? '',
    image: imageOf(doc.coverImage, locale),
  }
}

export async function listDossiers(locale: Locale): Promise<DossierSummary[]> {
  const docs = await loadDocs('dossiers')
  return docs
    .map((doc) => dossierSummaryOf(doc, locale))
    .filter((d): d is DossierSummary => d !== null)
}

export async function getDossier(locale: Locale, slug: string): Promise<Dossier | null> {
  const doc = await findBySlug('dossiers', locale, slug)
  const summary = doc && dossierSummaryOf(doc, locale)
  if (!doc || !summary) return null

  return {
    ...summary,
    intro: text(doc.description, locale) ?? '',
    articles: await listArticles(locale, { dossier: slug }),
  }
}

export const dossierParams = () => slugParams('dossiers')

/* --------------------------------------------------------------------- tags */

/**
 * Counts are PER LOCALE, and that is the point: a tag whose only article is
 * FR-only is empty on the Arabic site, so it is not offered there (règle d'or
 * #2 — a tag page listing nothing is a dead end the crawler should not be sent
 * to either; the page itself sets `noindex` when the count is zero).
 */
export async function listTags(locale: Locale): Promise<TagSummary[]> {
  const [docs, articles] = await Promise.all([loadDocs('tags'), loadRows(locale)])

  return docs
    .map((doc) => {
      const label = text(doc.title, locale)
      const slug = text(doc.slug, locale)
      if (!label || !slug) return null
      return {
        slug,
        label,
        count: articles.filter((row) => row.tagSlugs.includes(slug)).length,
      }
    })
    .filter((t): t is TagSummary => t !== null && t.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, locale))
}

export async function getTag(locale: Locale, slug: string): Promise<TagSummary | null> {
  const doc = await findBySlug('tags', locale, slug)
  const label = doc && text(doc.title, locale)
  if (!doc || !label) return null

  const articles = await loadRows(locale)
  return { slug, label, count: articles.filter((row) => row.tagSlugs.includes(slug)).length }
}

export const tagParams = () => slugParams('tags')

/* ------------------------------------------------------------- entity hubs */

/**
 * The hubs are the SEO moat (CLAUDE.md §5), and the rule that makes them one is
 * that their article list is DERIVED: it comes from the articles that point at
 * the entity, never from a curated list on the fiche. Publishing an article
 * that mentions a startup is the only action needed to make it appear here.
 */
const ENTITY_COLLECTION: Record<EntityKind, string> = {
  startups: 'startups',
  entreprises: 'entreprises',
  personnalites: 'personnalites',
  'textes-juridiques': 'textes-juridiques',
}

/** A richText field -> the plain prose the hub's summary paragraph needs. */
function prose(value: unknown, locale: Locale): string {
  return lexicalToBlocks(pick(value, locale))
    .map((block) => (block.type === 'list' ? block.items.join(' ') : block.text))
    .filter((t): t is string => typeof t === 'string' && t.length > 0)
    .join(' ')
}

/**
 * A populated `Fichiers` upload -> the download card's input.
 *
 * `sizeBytes` and `ext` are carried, not inferred at render time: a reader on a
 * Moroccan 3G connection must see what a link costs BEFORE tapping it.
 */
function fileOf(value: unknown): DownloadFile | undefined {
  if (!isRecord(value)) return undefined
  const url = typeof value.url === 'string' ? value.url : undefined
  if (!url) return undefined

  const filename = typeof value.filename === 'string' ? value.filename : ''
  const fromName = filename.includes('.') ? filename.split('.').pop() : undefined
  const mime = typeof value.mimeType === 'string' ? value.mimeType : ''

  return {
    url,
    ext: (fromName ?? mime.split('/').pop() ?? 'pdf').toLowerCase(),
    sizeBytes: typeof value.filesize === 'number' ? value.filesize : 0,
  }
}

/** Push a fact only when there is something to say. Empty rows read as bugs. */
function addFact(facts: EntityFact[], label: string, value?: string): void {
  if (value && value.trim().length > 0) facts.push({ label, value })
}

function entitySummaryOf(
  doc: Record<string, unknown>,
  kind: EntityKind,
  locale: Locale,
): EntitySummary | null {
  const name = text(doc.title, locale)
  const slug = text(doc.slug, locale)
  if (!name || !slug) return null

  /** One line under the name in listings — the most identifying fact there is. */
  const kickerOf = (): string => {
    if (kind === 'startups') return vocabLabel(SECTEURS, doc.secteur, locale) ?? ''
    if (kind === 'entreprises') {
      return (
        vocabLabel(NATURES, doc.nature, locale) ??
        (typeof doc.secteur === 'string' ? doc.secteur : '')
      )
    }
    if (kind === 'personnalites') return text(doc.fonction, locale) ?? ''

    const type = vocabLabel(TYPES_TEXTE, doc.typeTexte, locale)
    const reference = typeof doc.reference === 'string' ? doc.reference : ''
    return [type, reference].filter(Boolean).join(' — ')
  }

  return {
    id: String(doc.id ?? ''),
    kind,
    slug,
    name,
    kicker: kickerOf(),
    // `logo` on organisations, `photo` on people — the collections name the
    // field after what it actually is.
    image: imageOf(doc.logo, locale) ?? imageOf(doc.photo, locale),
    // Only the legal texts carry a file, and that is what makes their hub the
    // second download library (CLAUDE.md §6) without duplicating the corpus.
    file: kind === 'textes-juridiques' ? fileOf(pick(doc.fichier, locale)) : undefined,
  }
}

/** The identity panel — the labelled rows beside the fiche. */
function factsOf(doc: Record<string, unknown>, kind: EntityKind, locale: Locale): EntityFact[] {
  const facts: EntityFact[] = []
  const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined)
  const label = (key: keyof typeof FACT_LABELS) => FACT_LABELS[key][locale]

  if (kind === 'startups') {
    addFact(facts, label('secteur'), vocabLabel(SECTEURS, doc.secteur, locale))
    addFact(facts, label('stade'), vocabLabel(STADES, doc.stade, locale))
    addFact(
      facts,
      label('creation'),
      typeof doc.anneeCreation === 'number' ? String(doc.anneeCreation) : undefined,
    )
    addFact(facts, label('ville'), str(doc.ville))
    addFact(facts, label('siteWeb'), str(doc.siteWeb))

    const fondateurs = populated(doc.fondateurs)
      .map((f) => text(f.title, locale))
      .filter((n): n is string => Boolean(n))
    addFact(facts, label('fondateurs'), fondateurs.join(', '))

    /**
     * « Meilleures levées de fonds » is a client rubrique (CLAUDE.md §7), so
     * the latest round is a headline fact, not a detail buried in an array.
     */
    const levees = populated(doc.levees)
      .filter((l) => typeof l.date === 'string')
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    const last = levees[0]
    if (last) {
      const montant =
        typeof last.montant === 'number'
          ? `${last.montant.toLocaleString(locale === 'ar' ? 'ar-MA' : 'fr-MA')} ${
              str(last.devise) ?? ''
            }`.trim()
          : undefined
      addFact(facts, label('derniereLevee'), [str(last.tour), montant].filter(Boolean).join(' · '))
    }
  } else if (kind === 'entreprises') {
    addFact(facts, label('nature'), vocabLabel(NATURES, doc.nature, locale))
    addFact(facts, label('secteur'), str(doc.secteur))
    addFact(facts, label('siege'), str(doc.siege))
    addFact(facts, label('siteWeb'), str(doc.siteWeb))
  } else if (kind === 'personnalites') {
    addFact(facts, label('fonction'), text(doc.fonction, locale))
    addFact(facts, label('nationalite'), text(doc.nationalite, locale))
    const org = populated(doc.organisation)
      .map((o) => text(o.title, locale))
      .filter((n): n is string => Boolean(n))
    addFact(facts, label('organisation'), org.join(', '))
  } else {
    addFact(facts, label('reference'), str(doc.reference))
    addFact(facts, label('type'), vocabLabel(TYPES_TEXTE, doc.typeTexte, locale))
    addFact(facts, label('statut'), vocabLabel(STATUTS, doc.statut, locale))
    addFact(
      facts,
      label('publicationBO'),
      str(doc.datePublicationBO) ? formatDate(String(doc.datePublicationBO), locale) : undefined,
    )
    addFact(facts, label('numeroBO'), str(doc.numeroBO))
  }

  return facts
}

export async function listEntities(locale: Locale, kind: EntityKind): Promise<EntitySummary[]> {
  const docs = await loadDocs(ENTITY_COLLECTION[kind])
  return docs
    .map((doc) => entitySummaryOf(doc, kind, locale))
    .filter((e): e is EntitySummary => e !== null)
    .sort((a, b) => a.name.localeCompare(b.name, locale))
}

export async function getEntity(
  locale: Locale,
  kind: EntityKind,
  slug: string,
): Promise<Entity | null> {
  const doc = await findBySlug(ENTITY_COLLECTION[kind], locale, slug)
  const summary = doc && entitySummaryOf(doc, kind, locale)
  if (!doc || !summary) return null

  const rows = await loadRows(locale)

  return {
    ...summary,
    // `description` on organisations, `bio` on people, `resume` on legal texts.
    summary: prose(doc.description ?? doc.bio ?? doc.resume, locale),
    facts: factsOf(doc, kind, locale),
    // DERIVED, never hand-curated — the whole point of the hub.
    articles: rows
      .filter((row) => row.entities.some((ref) => ref.kind === kind && ref.slug === slug))
      .map((row) => row.summary),
  }
}

export const entityParams = (kind: EntityKind) => slugParams(ENTITY_COLLECTION[kind])

/* ------------------------------------------------------------------ podcast */

/**
 * An episode exists in a locale when it has a TITLE and a SLUG there — the same
 * rule as every other family in this file, articles included.
 *
 * Deliberately NOT "and notes in that locale": the notes are editorial extra,
 * and an episode whose Arabic notes are not written yet still has an Arabic
 * title, an Arabic page and an audio track that is the same recording either
 * way. Requiring the notes would make `podcastParams` and `getPodcast` disagree
 * — the route would be prerendered and then 404 — which is the class of bug
 * `slugParams` was written to end.
 */
function podcastSummaryOf(doc: Record<string, unknown>, locale: Locale): PodcastSummary | null {
  const title = text(doc.title, locale)
  const slug = text(doc.slug, locale)
  if (!title || !slug) return null

  const notes = lexicalToBlocks(pick(doc.description, locale))

  // The meta description when the editor wrote one, the opening line of the
  // notes otherwise. Both are text the newsroom controls; neither is invented.
  const metaDescription = seoOf(doc, locale).description
  const firstParagraph = notes.find((block) => block.type === 'paragraph')
  const excerpt =
    (typeof metaDescription === 'string' && metaDescription.trim() ? metaDescription.trim() : undefined) ??
    (firstParagraph && firstParagraph.type === 'paragraph' ? firstParagraph.text : '')

  const guests = populated(doc.invites)
    .map((guest) => text(guest.title, locale))
    .filter((name): name is string => Boolean(name))

  return {
    id: String(doc.id ?? ''),
    slug,
    title,
    excerpt,
    episode: typeof doc.numero === 'number' ? doc.numero : undefined,
    publishedAt: dateOf(doc),
    duration: typeof doc.duree === 'number' ? doc.duree : undefined,
    guest: guests.length > 0 ? guests.join(', ') : undefined,
    image: imageOf(doc.coverImage, locale),
    hasAudio: typeof doc.embedUrl === 'string' && doc.embedUrl.trim().length > 0,
  }
}

export async function listPodcasts(locale: Locale): Promise<PodcastSummary[]> {
  const docs = await loadPublished('podcasts')
  return docs
    .map((doc) => podcastSummaryOf(doc, locale))
    .filter((episode): episode is PodcastSummary => episode !== null)
    .sort(byDateDesc)
}

export async function getPodcast(locale: Locale, slug: string): Promise<PodcastEpisode | null> {
  const docs = await loadPublished('podcasts')
  const doc = docs.find((candidate) => text(candidate.slug, locale) === slug)
  const summary = doc && podcastSummaryOf(doc, locale)
  if (!doc || !summary) return null

  const transcript = lexicalToBlocks(pick(doc.transcription, locale))
  const embedUrl = typeof doc.embedUrl === 'string' ? doc.embedUrl.trim() : ''

  return {
    ...summary,
    body: lexicalToBlocks(pick(doc.description, locale)),
    // Shared, not localized: it is one recording, whatever the page's language.
    embedUrl: embedUrl.length > 0 ? embedUrl : undefined,
    transcript: transcript.length > 0 ? transcript : undefined,
    locales: localesOf(doc.title),
  }
}

export async function podcastParams(): Promise<{ lang: Locale; slug: string }[]> {
  const docs = await loadPublished('podcasts')
  const out: { lang: Locale; slug: string }[] = []

  for (const doc of docs) {
    for (const lang of ['fr', 'ar'] as const) {
      const slug = text(doc.slug, lang)
      // A slug with no title is a half-saved document, not a page.
      if (slug && text(doc.title, lang)) out.push({ lang, slug: encodeParam(slug) })
    }
  }
  return out
}

/* ------------------------------------------------------------- static pages */

/**
 * The institutional pages are addressed by `cle`, NOT by slug.
 *
 * Their URLs are localized pathnames (`/qui-sommes-nous` ↔ `/من-نحن`,
 * lib/i18n/routing.ts), so the route that needs one cannot name it by a slug
 * that changes with the language — it names it by a language-independent key,
 * which is exactly what `collections/Pages.ts` declares `cle` to be. The
 * localized `slug` survives for the metadata and as the image key.
 *
 * `pageSlugs()` used to sit beside this and is gone: nothing called it, and with
 * `cle` as the address it could not have been correct anyway.
 */
export async function getPage(locale: Locale, cle: string): Promise<StaticPage | null> {
  const docs = await loadPublished('pages')
  const doc = docs.find((candidate) => candidate.cle === cle)
  if (!doc) return null

  const title = text(doc.title, locale)
  const body = lexicalToBlocks(pick(doc.body, locale))

  // Règle d'or #2: a key with a French page and no Arabic one 404s on /ar
  // rather than serving French prose under an Arabic URL. A title with an empty
  // body is a half-written translation, and counts as absent for the same reason.
  if (!title || body.length === 0) return null

  return {
    slug: text(doc.slug, locale) ?? cle,
    title,
    intro: text(doc.chapeau, locale) ?? '',
    body,
    // Per locale, like the whole SEO group: the editor can keep the French
    // mentions légales out of the index and leave the Arabic one in.
    noindex: seoOf(doc, locale).noindex === true,
  }
}

/* ------------------------------------------------------------------- vidéos */

/**
 * Videos are not localized content in the strict sense — the recording is what
 * it is — but the TITLE is, so règle d'or #2 applies exactly as elsewhere: a
 * video with no Arabic title does not appear on the Arabic side.
 *
 * An unrecognised URL DROPS the video rather than rendering a dead player.
 * `collections/Videos.ts` validates the field at save time with this same
 * function, so the newsroom sees the error in the back-office; this is the
 * second lock, for a row written before that validation or by a script.
 */
function videoSummaryOf(doc: Record<string, unknown>, locale: Locale): VideoSummary | null {
  const title = text(doc.title, locale)
  const parsed = typeof doc.url === 'string' ? parseVideoUrl(doc.url) : null
  if (!title || !parsed) return null

  return {
    id: String(doc.id ?? ''),
    videoId: parsed.videoId,
    provider: parsed.provider,
    title,
    kicker: text(doc.kicker, locale),
    publishedAt: dateOf(doc),
    duration: typeof doc.duree === 'number' ? doc.duree : undefined,
    image: imageOf(doc.coverImage, locale),
  }
}

export async function listVideos(locale: Locale, limit?: number): Promise<VideoSummary[]> {
  const docs = await loadPublished('videos')

  const all = docs
    .map((doc) => videoSummaryOf(doc, locale))
    .filter((video): video is VideoSummary => video !== null)
    .sort(byDateDesc)

  return limit === undefined ? all : all.slice(0, limit)
}

/* ----------------------------------------------------------- téléchargements */

const isDocumentCategory = (value: unknown): value is DocumentCategory =>
  typeof value === 'string' && (DOCUMENT_CATEGORIES as readonly string[]).includes(value)

/**
 * A document exists in a locale when it has a title AND a file there.
 *
 * `Documents.fichier` is localized on purpose: a French contrat type and its
 * Arabic version are two different files, and handing the French PDF to an
 * Arabic reader is precisely the silent fallback règle d'or #2 forbids. So a
 * document translated in its title only is not offered — there would be nothing
 * to download at the end of it.
 */
function documentSummaryOf(doc: Record<string, unknown>, locale: Locale): DocumentSummary | null {
  const title = text(doc.title, locale)
  const slug = text(doc.slug, locale)
  const file = fileOf(pick(doc.fichier, locale))
  if (!title || !slug || !file) return null

  return {
    id: String(doc.id ?? ''),
    slug,
    title,
    description: text(doc.description, locale) ?? '',
    categorie: isDocumentCategory(doc.categorie) ? doc.categorie : 'autre',
    publishedAt: dateOf(doc),
    file,
  }
}

/** The newsroom's own library — contrats, attestations, études, synthèses. */
export async function listDocuments(
  locale: Locale,
  categorie?: DocumentCategory,
): Promise<DocumentSummary[]> {
  const docs = await loadPublished('documents')
  return docs
    .map((doc) => documentSummaryOf(doc, locale))
    .filter((document): document is DocumentSummary => document !== null)
    .filter((document) => categorie === undefined || document.categorie === categorie)
    .sort(byDateDesc)
}

/**
 * Same library, grouped for the page. Empty categories are dropped rather than
 * rendered as an empty heading — with `fallback: false` a whole category can be
 * untranslated, and an Arabic page full of empty French section titles is
 * exactly the failure règle d'or #2 exists to prevent.
 */
export async function documentsByCategory(
  locale: Locale,
): Promise<{ categorie: DocumentCategory; documents: DocumentSummary[] }[]> {
  const all = await listDocuments(locale)
  return DOCUMENT_CATEGORIES.map((categorie) => ({
    categorie,
    documents: all.filter((document) => document.categorie === categorie),
  })).filter((group) => group.documents.length > 0)
}

/**
 * The SECOND library: the official texts. Derived from the entity hub rather
 * than from a collection of its own — one text keeps one URL (CLAUDE.md §6), and
 * a text with no file in this locale simply does not appear in the list.
 */
export async function listTexteDownloads(locale: Locale): Promise<EntitySummary[]> {
  const entities = await listEntities(locale, 'textes-juridiques')
  return entities.filter((entity) => entity.file)
}

export type { SearchDoc } from './content-types'

/**
 * The client-side search island's corpus — now built from real articles.
 *
 * Still the whole corpus in one payload, which is right while it is a few dozen
 * documents (see components/SearchBox). The day it is not, this becomes a
 * server route and the island posts to it.
 */
export async function searchIndex(locale: Locale) {
  const articles = await listArticles(locale)
  return articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt ?? '',
    rubrique: a.rubrique,
    publishedAt: a.publishedAt,
    haystack: `${a.title} ${a.excerpt ?? ''}`.toLowerCase(),
  }))
}
