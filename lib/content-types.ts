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
  /** Path or URL. Placeholder today, Payload Media URL after Lot 2. */
  src: string
  alt: string
  width: number
  height: number
  credit?: string
}

export interface AuthorRef {
  name: string
  slug: string
}

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
  image?: ImageRef
  /** Dormant seam — always 'public' until the client asks otherwise (règle d'or #1). */
  accessLevel: 'public' | 'metered' | 'premium'
  /** Locales this article genuinely exists in (règle d'or #2: no silent fallback). */
  locales: readonly Locale[]
}

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
  image?: ImageRef
}

export const FORMAT_LABELS: Record<ArticleFormat, Record<Locale, string>> = {
  actualite: { fr: 'Actualité', ar: 'خبر' },
  analyse: { fr: 'Analyse', ar: 'تحليل' },
  decryptage: { fr: 'Décryptage', ar: 'قراءة' },
  interview: { fr: 'Interview', ar: 'حوار' },
  tribune: { fr: 'Tribune', ar: 'رأي' },
  infographie: { fr: 'Infographie', ar: 'إنفوغرافيك' },
}
