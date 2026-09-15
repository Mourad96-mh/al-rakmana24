import type { Locale } from './rubriques'

/**
 * The shape the UI consumes.
 *
 * Deliberately decoupled from Payload's generated `payload-types.ts`: components
 * bind to THIS, and Lot 3 adds mappers that turn Payload documents into these
 * objects. That is what lets the design ship and be reviewed before the database
 * exists, and lets the CMS schema evolve without a component rewrite.
 */

export type ArticleFormat =
  | 'actualite'
  | 'analyse'
  | 'decryptage'
  | 'interview'
  | 'tribune'
  | 'infographie'

export interface ImageRef {
  /** Path or URL. Resolved from public/photos today, a Payload Media URL later. */
  src: string
  alt: string
  width: number
  height: number
  credit?: string
}

/**
 * What CONTENT declares: `src` is a real upload (a Payload Media URL), the rest
 * are overrides. Resolved by `resolveMedia()`, which falls back to the on-brand
 * placeholder when there is no `src`.
 */
export interface ImageInput {
  src?: string
  alt?: string
  width?: number
  height?: number
  credit?: string
}

export interface AuthorRef {
  name: string
  slug: string
}

/* ------------------------------------------------------------------ articles */

export interface ArticleSummary {
  id: string
  slug: string
  title: string
  excerpt?: string
  /** Rubrique `value` from lib/rubriques.ts — not a label. */
  rubrique: string
  sousRubrique?: string
  format: ArticleFormat
  publishedAt: string
  author?: AuthorRef
  image?: ImageInput
  /** Dormant seam — always 'public' until the client asks otherwise (règle d'or #1). */
  accessLevel: 'public' | 'metered' | 'premium'
  /** Locales this article genuinely exists in (règle d'or #2: no silent fallback). */
  locales: readonly Locale[]
}

/**
 * A rich-text body, kept deliberately small: paragraph / heading / quote / list
 * / callout is everything the demo articles need, and it maps cleanly onto the
 * Lexical nodes Payload will produce in Lot 3.
 */
export type BodyBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'list'; items: readonly string[] }
  | { type: 'callout'; title: string; text: string }

export interface EntityRef {
  /** Which hub collection this points at — decides the URL segment. */
  kind: EntityKind
  slug: string
  name: string
}

export interface Article extends ArticleSummary {
  body: readonly BodyBlock[]
  /** Entity hubs mentioned by this article — the SEO moat is built from these. */
  entities: readonly EntityRef[]
  tags: readonly { slug: string; label: string }[]
  dossier?: { slug: string; title: string }
  /** Minutes, computed from the body at build time. */
  readingMinutes: number
}

/* ------------------------------------------------------------------- listings */

export interface TickerItem {
  id: string
  slug: string
  title: string
  publishedAt: string
  rubrique: string
}

export interface DossierSummary {
  id: string
  slug: string
  title: string
  kicker: string
  image?: ImageInput
}

export interface Dossier extends DossierSummary {
  intro: string
  articles: readonly ArticleSummary[]
}

export interface AuthorSummary {
  id: string
  slug: string
  name: string
  role: string
  /**
   * Carried on the SUMMARY, not only on the full author: « La rédaction »
   * lists every byline with its bio, and pulling one document per author to
   * get it would be a dozen round-trips for a page that already has them all.
   */
  bio: string
  image?: ImageInput
}

export interface Author extends AuthorSummary {
  email?: string
  articles: readonly ArticleSummary[]
}

export interface PodcastSummary {
  id: string
  slug: string
  title: string
  excerpt: string
  /**
   * Episode number, shown as the kicker. OPTIONAL because `numero` is optional
   * in `collections/Podcasts.ts` — a bonus episode or a pilot has no number,
   * and rendering « Épisode undefined » is worse than rendering no kicker.
   */
  episode?: number
  publishedAt: string
  /** Runtime in minutes. Optional for the same reason as `episode`. */
  duration?: number
  guest?: string
  image?: ImageInput
  /**
   * Whether this episode has a player at all. On the SUMMARY so the index can
   * say « aucun enregistrement n'est encore disponible » only while it is true
   * — the notice corrects itself the day the client chooses an audio host,
   * instead of staying on the page as a lie.
   */
  hasAudio: boolean
}

export interface PodcastEpisode extends PodcastSummary {
  body: readonly BodyBlock[]
  /**
   * The audio host's embed URL (Ausha / Acast). The audio is NEVER served from
   * our origin — CLAUDE.md §6 and collections/Podcasts.ts. Absent while the
   * client has not chosen a host, and the page says so rather than rendering a
   * dead player.
   */
  embedUrl?: string
  /**
   * Optional, and the only part of an episode a search engine can read — the
   * audio is opaque to it. Rendered under the episode notes when present.
   */
  transcript?: readonly BodyBlock[]
  locales: readonly Locale[]
}

/* -------------------------------------------------------------------- vidéos */

/**
 * Video is EMBEDDED, never hosted here — same reasoning as the podcast audio
 * (collections/Podcasts.ts): a KVM VPS cannot serve video, and one popular clip
 * would eat the month's bandwidth. We keep the provider id and the editorial
 * material around it.
 */
export type VideoProvider = 'youtube' | 'vimeo'

export interface VideoSummary {
  id: string
  /** Provider id, not a full URL: `dQw4w9WgXcQ`, `76979871`. */
  videoId: string
  provider: VideoProvider
  title: string
  /** Small label above the title — rubrique, série, format. */
  kicker?: string
  publishedAt: string
  /** Runtime in seconds; shown as m:ss on the thumbnail. */
  duration?: number
  /** Cover frame. Falls back to the on-brand placeholder like everything else. */
  image?: ImageInput
}

/* --------------------------------------------------------- téléchargements */

/**
 * A downloadable file. `sizeBytes` and `ext` are stored, not inferred at render
 * time: the reader must be able to see what a link will cost BEFORE clicking it
 * (a 12 MB PDF on a Moroccan 3G connection is a decision, not a detail).
 */
export interface DownloadFile {
  url: string
  /** Lowercase, no dot: pdf, docx, xlsx, zip. */
  ext: string
  sizeBytes: number
}

/**
 * Two download libraries, kept SEPARATE at the client's request:
 *
 *   1. `DocumentSummary` — the practical library: contrats types, attestations,
 *      études, synthèses. Our own material, drafted by the newsroom.
 *   2. the legal texts — official texts (loi, décret, arrêté…), which are NOT a
 *      second corpus: they hang off the existing `textes-juridiques` entity hub,
 *      via `EntitySummary.file`. One text, one URL, one page, whether the reader
 *      arrives to read the summary or to download the PDF.
 */
export type DocumentCategory = 'contrat' | 'attestation' | 'etude' | 'synthese' | 'autre'

/** Display order of the sections on the documents page. */
export const DOCUMENT_CATEGORIES: readonly DocumentCategory[] = [
  'contrat',
  'attestation',
  'etude',
  'synthese',
  'autre',
]

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, Record<Locale, string>> = {
  contrat: { fr: 'Contrats types', ar: 'عقود نموذجية' },
  attestation: { fr: 'Attestations & formulaires', ar: 'شهادات ونماذج' },
  etude: { fr: 'Études', ar: 'دراسات' },
  synthese: { fr: 'Synthèses', ar: 'خلاصات' },
  autre: { fr: 'Autres documents', ar: 'وثائق أخرى' },
}

export interface DocumentSummary {
  id: string
  slug: string
  title: string
  description: string
  categorie: DocumentCategory
  publishedAt: string
  file: DownloadFile
}

export interface TagSummary {
  slug: string
  label: string
  count: number
}

/* -------------------------------------------------------------------- search */

/** One row of the client-side search island's corpus (components/SearchBox). */
export interface SearchDoc {
  slug: string
  title: string
  excerpt: string
  rubrique: string
  publishedAt: string
  /** Pre-lowercased haystack, so the client filter does no work per keystroke. */
  haystack: string
}

/* --------------------------------------------------------------- entity hubs */

export type EntityKind = 'startups' | 'entreprises' | 'personnalites' | 'textes-juridiques'

/** URL segment per hub — one place, so a rename cannot drift between pages. */
export const ENTITY_SEGMENT: Record<EntityKind, string> = {
  startups: 'startups',
  entreprises: 'entreprises',
  personnalites: 'personnalites',
  'textes-juridiques': 'textes-juridiques',
}

export const ENTITY_LABELS: Record<EntityKind, Record<Locale, string>> = {
  startups: { fr: 'Startups', ar: 'شركات ناشئة' },
  entreprises: { fr: 'Entreprises', ar: 'شركات' },
  personnalites: { fr: 'Personnalités', ar: 'شخصيات' },
  // « Textes légaux » is the client's wording; the slug stays `textes-juridiques`.
  'textes-juridiques': { fr: 'Textes légaux', ar: 'نصوص قانونية' },
}

/** A labelled row in the hub's identity panel — "Siège", "Secteur", "Adopté le"… */
export interface EntityFact {
  label: string
  value: string
  /** Renders as a link when the value is a URL the reader should be able to open. */
  href?: string
}

/** One announced funding round. « Meilleures levées de fonds » is built on these. */
export interface Levee {
  /** ISO date of the announcement. */
  date?: string
  /** Vocabulary VALUE (`serie-a`), not a label — see lib/entity-vocab TOURS. */
  tour?: string
  montant?: number
  devise?: string
  investisseurs?: string
  /** « Un montant sans source ne se publie pas » (collections/Startups.ts). */
  source?: string
}

/**
 * The entity's identity as DATA, before it is turned into display strings.
 *
 * `facts` above is this same information formatted for a human, in one locale,
 * with the vocabularies resolved to labels. This is the machine-readable twin:
 * raw vocabulary values and ISO dates, which is what schema.org wants
 * (`foundingDate`, `legislationIdentifier`…) and what a label would destroy.
 *
 * Both are derived from this one object in `lib/queries.ts`, so a renamed CMS
 * field cannot make the panel and the JSON-LD disagree.
 */
export type EntityData =
  | {
      kind: 'startups'
      secteur?: string
      stade?: string
      anneeCreation?: number
      ville?: string
      siteWeb?: string
      fondateurs: readonly string[]
      /** Newest first. */
      levees: readonly Levee[]
    }
  | {
      kind: 'entreprises'
      nature?: string
      secteur?: string
      siege?: string
      siteWeb?: string
    }
  | {
      kind: 'personnalites'
      fonction?: string
      nationalite?: string
      organisations: readonly string[]
      linkedin?: string
      x?: string
    }
  | {
      kind: 'textes-juridiques'
      reference?: string
      typeTexte?: string
      statut?: string
      dateStatut?: string
      datePublicationBO?: string
      numeroBO?: string
      /** The text on the SGG / Bulletin officiel site — `sameAs` in JSON-LD. */
      lienOfficiel?: string
    }

export interface EntitySummary {
  id: string
  kind: EntityKind
  slug: string
  name: string
  /** One line under the name in listings. */
  kicker: string
  image?: ImageInput
  /**
   * The official text, downloadable. Only `textes-juridiques` populates this —
   * it is what makes the legal-text hub a download library as well as a hub.
   */
  file?: DownloadFile
}

export interface Entity extends EntitySummary {
  summary: string
  /** Display rows for the identity panel — derived from `data`. */
  facts: readonly EntityFact[]
  /** The same identity as machine-readable data, for the JSON-LD. */
  data: EntityData
  /** Populated from article relationships — never hand-curated (CLAUDE.md §5). */
  articles: readonly ArticleSummary[]
}

/* ------------------------------------------------------------- static pages */

export interface StaticPage {
  slug: string
  title: string
  intro: string
  image?: ImageInput
  body: readonly BodyBlock[]
  /** Kept out of the index when the page is legal boilerplate or an account form. */
  noindex?: boolean
}

/* ---------------------------------------------------------------- constants */

export const FORMAT_LABELS: Record<ArticleFormat, Record<Locale, string>> = {
  actualite: { fr: 'Actualité', ar: 'خبر' },
  analyse: { fr: 'Analyse', ar: 'تحليل' },
  decryptage: { fr: 'Décryptage', ar: 'قراءة' },
  interview: { fr: 'Interview', ar: 'حوار' },
  tribune: { fr: 'Tribune', ar: 'رأي' },
  infographie: { fr: 'Infographie', ar: 'إنفوغرافيك' },
}
