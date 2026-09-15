import type { ServerProps, Where } from 'payload'
import { isContributeur, type Role } from '../../../lib/payload-access'
import {
  DashboardView,
  type DashboardCounts,
  type DraftItem,
  type Lang,
  type TranslationGap,
} from './DashboardView'

/**
 * The newsroom's landing screen, mounted above Payload's default dashboard.
 *
 * Payload's own dashboard is a flat list of every collection, alphabetical
 * inside its group. That is a map of the DATABASE, not of the job: an editor
 * arriving at 7am wants to publish, not to browse seventeen collections.
 *
 * This half is DATA ONLY — the markup lives in `DashboardView`, which imports
 * nothing from Payload so the layout can be previewed without a database (see
 * `app/(preview)/apercu-admin`). Server component: it runs inside the admin,
 * where the connection already exists, so the numbers are real.
 *
 * EVERY query here is wrapped. A dashboard that throws would lock the editors
 * out of the whole back-office over a number nobody needs, so a failure
 * degrades to `null` / `undefined` and the view renders the missing state.
 */

/** How many rows each worklist shows before deferring to the collection list. */
const LIST_SIZE = 5

/**
 * How many published articles we inspect for translation gaps.
 *
 * A ceiling, not a page size: this runs on every dashboard load, and scanning a
 * five-year archive to fill a five-row panel would be a tax on every editor,
 * every morning. The newest slice is also the useful one — a 2027 piece nobody
 * has translated is a decision, a piece from this week is an oversight.
 */
const GAP_SCAN = 100

export async function Welcome({ payload, user, i18n }: ServerProps) {
  const lang: Lang = i18n?.language === 'ar' ? 'ar' : 'fr'

  /** ServerProps types `user` loosely; these are the three fields we read. */
  const viewer = user as { nom?: string; id?: string | number; role?: Role | null } | undefined
  const viewerId = viewer?.id

  /**
   * A contributeur sees their OWN pipeline, not the newsroom's.
   *
   * `canUpdateContent` confines them to documents they created and have not
   * published, so every other draft on this screen was a link they could open
   * and not edit — and a colleague's unfinished headline they had no reason to
   * read. The count and the alert use the same clause as the list, so the
   * figures cannot disagree with the rows underneath them.
   *
   * `viewerId` is checked because a `creePar` filter on `undefined` would match
   * documents with no creator — the seed's, among others — which is the one
   * outcome worse than showing everything.
   */
  const scopeToOwnDrafts = isContributeur(viewer) && viewerId !== undefined

  const draftWhere: Where = scopeToOwnDrafts
    ? { and: [{ _status: { equals: 'draft' } }, { creePar: { equals: viewerId } }] }
    : { _status: { equals: 'draft' } }

  /** A count that can never break the dashboard. `null` = failed, not zero. */
  const count = async (
    collection: Parameters<typeof payload.count>[0]['collection'],
    where?: Where,
  ): Promise<number | null> => {
    try {
      const result = await payload.count({ collection, where, overrideAccess: true })
      return result.totalDocs
    } catch {
      return null
    }
  }

  /**
   * Published articles that exist in one locale only.
   *
   * `locale: 'all'` is what makes this possible in a single query: Payload
   * returns every localized field as `{ fr, ar }` instead of resolving one
   * language, so the comparison happens here rather than in two queries that
   * would then have to be diffed by id.
   *
   * Returns `undefined` on failure — distinct from an empty list, because
   * "we could not check" must never render as "everything is translated".
   */
  const findGaps = async (): Promise<{ items: TranslationGap[]; total: number } | undefined> => {
    try {
      const result = await payload.find({
        collection: 'articles',
        where: { _status: { equals: 'published' } },
        locale: 'all',
        depth: 0,
        limit: GAP_SCAN,
        sort: '-publishedAt',
        overrideAccess: true,
      })

      const items: TranslationGap[] = []

      for (const doc of result.docs) {
        // Under `locale: 'all'` a localized field is an object keyed by locale.
        // The generated types describe the single-locale shape, hence the cast.
        const title = (doc as unknown as { title?: Partial<Record<Lang, string>> }).title ?? {}
        const fr = title.fr?.trim()
        const ar = title.ar?.trim()

        // Both present, or both absent (an empty shell — not a translation gap).
        if (Boolean(fr) === Boolean(ar)) continue

        items.push({
          id: String(doc.id),
          title: (fr || ar) as string,
          missing: fr ? 'ar' : 'fr',
        })
      }

      return { items: items.slice(0, LIST_SIZE), total: items.length }
    } catch {
      return undefined
    }
  }

  /** The most recently touched drafts, titled in whichever locale has one. */
  const findDrafts = async (): Promise<DraftItem[] | undefined> => {
    try {
      const result = await payload.find({
        collection: 'articles',
        where: draftWhere,
        locale: 'all',
        depth: 0,
        limit: LIST_SIZE,
        sort: '-updatedAt',
        overrideAccess: true,
      })

      const dateFormat = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-MA' : 'fr-MA', {
        day: 'numeric',
        month: 'short',
      })

      return result.docs.map((doc) => {
        const title = (doc as unknown as { title?: Partial<Record<Lang, string>> }).title ?? {}
        const updatedAt = (doc as unknown as { updatedAt?: string }).updatedAt

        return {
          id: String(doc.id),
          title: (title.fr?.trim() || title.ar?.trim() || '') as string,
          updated: updatedAt ? dateFormat.format(new Date(updatedAt)) : '',
        }
      })
    } catch {
      return undefined
    }
  }

  const [
    publishedArticles,
    draftArticles,
    videos,
    documents,
    textes,
    activeAds,
    gaps,
    drafts,
  ] = await Promise.all([
    count('articles', { _status: { equals: 'published' } }),
    count('articles', draftWhere),
    count('videos'),
    count('documents'),
    count('textes-juridiques'),
    count('publicites', { actif: { equals: true } }),
    findGaps(),
    findDrafts(),
  ])

  const counts: DashboardCounts = {
    publishedArticles,
    draftArticles,
    videos,
    documents,
    textes,
    activeAds,
  }

  return (
    <DashboardView
      lang={lang}
      name={viewer?.nom ?? ''}
      adminRoute={payload.config.routes.admin ?? '/admin'}
      counts={counts}
      gaps={gaps}
      drafts={drafts}
      ownDraftsOnly={scopeToOwnDrafts}
    />
  )
}
