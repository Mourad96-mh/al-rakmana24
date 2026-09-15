import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeDeleteHook,
} from 'payload'

/**
 * « Publier » → en ligne. The hook that closes the loop.
 *
 * Imported RELATIVELY by `collections/*` (règle d'or #5).
 *
 * Every public route is SSG/ISR (règle d'or #4) — that is the whole performance
 * argument of this site. The flip side is that a freshly published article does
 * not appear until something tells Next the cache is stale. This is that
 * something.
 *
 *
 * WHAT IS REVALIDATED, AND WHY IT IS BOTH
 *
 * Two mechanisms, because ONE WAS MEASURED NOT TO BE ENOUGH:
 *
 *  1. `revalidatePath('/[lang]', 'layout')` — the whole frontend tree, one
 *     call, no path construction. It is the safety net for every page that has
 *     no exact entry below.
 *  2. The CONCRETE paths: `/fr`, `/ar`, and the edited article's own URLs.
 *
 * The honest reason for (2): on 15.5.19, the layout sweep alone did not refresh
 * a prerendered page. Smoke-tested against `next start` — publish an edit, the
 * homepage stayed on its build-time HTML. With the concrete paths it updates.
 * The sweep stays because it costs nothing and covers what the list forgets.
 *
 * THIS ONLY WORKS BECAUSE `dynamicParams` IS TRUE on the content routes. With
 * it false, an edited article served its build-time HTML for ever and a
 * NEWLY published one could not be rendered at all — it is not in the build
 * manifest, so no cache call could conjure it. That is the single most
 * important fact in this file: a newsroom publishes after the build.
 *
 * The cost of the sweep is NOT "the whole site re-renders". ISR serves the
 * stale page and regenerates per URL, ON REQUEST — so the real cost is
 * proportional to traffic, not to the size of the archive. A publish does not
 * touch a page nobody visits.
 *
 * When to make it finer-grained: when the logs show regeneration is a
 * measurable share of the database load. The upgrade is `unstable_cache` with a
 * per-document tag in `lib/queries.ts` plus `revalidateTag` here — a real
 * change, and one that needs traffic numbers to justify. Not before.
 *
 *
 * WHY THE IMPORT IS DYNAMIC
 *
 * `payload.config.ts` is loaded by the Payload CLI too (`pnpm seed`,
 * `generate:types`, `create-admin`), in a plain Node process with no Next
 * runtime. A top-level `import 'next/cache'` puts a Next server module into
 * that graph for no reason. Imported inside the function, the CLI never
 * touches it.
 */

/** The `(frontend)` route group is not part of the URL: the pattern is `/[lang]`. */
const FRONTEND_TREE = '/[lang]'

/**
 * Sitemaps and robots live at the ROOT of `app/`, OUTSIDE `(frontend)` — so
 * they sit outside the tree above and would need their own calls.
 *
 * They do not exist yet (Lot 7). Add their paths here the day they do, or a
 * published article will be missing from the news sitemap, which for a journal
 * is the difference between being in Google News within minutes and not at all.
 */
const ROOT_PATHS: readonly string[] = []

type MaybeDoc = { id?: unknown; _status?: unknown } | null | undefined

type HookReq = {
  context?: Record<string, unknown>
  query?: Record<string, unknown>
  locale?: string
  payload?: { logger?: { info?: (msg: string) => void; warn?: (msg: string) => void } }
}

/**
 * Does this write target a DRAFT VERSION rather than the live document?
 *
 * THE HALF OF THE AUTOSAVE GUARD THAT `_status` CANNOT PROVIDE, and a smoke
 * test caught its absence. Editing an ALREADY-PUBLISHED article autosaves into
 * a draft version: the hook then sees `doc._status === 'draft'` and
 * `previousDoc._status === 'published'` — which is byte-for-byte what
 * UNPUBLISHING looks like. One must be ignored, the other must revalidate, and
 * the documents alone cannot tell them apart.
 *
 * The request can. Payload's admin sends autosaves to `?draft=true`
 * (`&autosave=true`), while publishing and unpublishing are ordinary updates
 * with no `draft` flag. So a `draft=true` write never touches what a reader
 * sees, whatever the two `_status` values say.
 *
 * Without this, a journalist editing a published article would invalidate the
 * entire site every 800 ms — the exact failure the `_status` check was written
 * to prevent, arriving through the one door it does not cover.
 */
const isDraftWrite = (req?: HookReq): boolean => {
  const draft = req?.query?.draft
  return draft === true || draft === 'true'
}

/**
 * Does this write change anything a reader could see?
 *
 * THE LOAD-BEARING CASE IS AUTOSAVE. `Articles` (and Podcasts, Videos,
 * Documents, Pages) autosave every 800 ms, and every autosave fires
 * `afterChange`. Without this guard, a journalist typing a paragraph would
 * invalidate the entire site several times a minute.
 *
 * So: for a collection WITH drafts, only a document that is published now, or
 * was published a moment ago, can affect the public site. Editing an
 * already-published article autosaves into a DRAFT version and leaves the
 * published one alone — `_status` stays `draft`, nothing is revalidated, and
 * the live page correctly keeps the last published text until someone presses
 * « Publier ». Unpublishing is caught by the `previousDoc` half.
 *
 * For a collection WITHOUT drafts (the entity hubs, tags, auteurs) every write
 * is live by definition, so every write revalidates.
 */
function affectsPublicSite(doc: MaybeDoc, previousDoc?: MaybeDoc): boolean {
  if (!doc || !('_status' in doc)) return true
  return doc._status === 'published' || previousDoc?._status === 'published'
}

/**
 * Marks the frontend stale. Never throws.
 *
 * A failure here must not fail the save: the editor's work is already in the
 * database, and refusing their click because a cache call misbehaved would be a
 * far worse newsroom experience than a page that lags. It is logged, loudly
 * enough to be found, and the write stands.
 */
async function revalidateFrontend(
  label: string,
  req?: HookReq,
  extra: readonly string[] = [],
): Promise<void> {
  try {
    const { revalidatePath } = await import('next/cache')

    // The layout-wide sweep. Measured: it alone did NOT refresh a prerendered
    // page — hence the concrete paths below. Kept because it does reach the
    // pages that have no entry here, and costs nothing.
    revalidatePath(FRONTEND_TREE, 'layout')

    // Concrete paths. THESE are the ones that were observed to work.
    const paths = ['/fr', '/ar', ...extra, ...ROOT_PATHS]
    for (const path of paths) revalidatePath(path)
    // The paths are logged in full on purpose: when a page does not refresh,
    // the first question is always "was its path in this list?".
    req?.payload?.logger?.info?.(`[revalidate] ${label} → ${paths.join(' ')}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    req?.payload?.logger?.warn?.(
      `[revalidate] ${label} a échoué — le contenu est enregistré, mais les pages ` +
        `publiques resteront en cache jusqu'au prochain build. Cause : ${message}`,
    )
  }
}

/**
 * The URLs of one article, for every locale it exists in.
 *
 * BOTH SPELLINGS of the Arabic one, deliberately. `routing.pathnames` localizes
 * the segment, so the public URL is `/ar/مقال/<slug>` while the internal route
 * is `/ar/article/<slug>`, and the middleware rewrites one onto the other.
 * Which of the two Next keys its cache under is not something this file should
 * claim to know — revalidating a path that does not exist costs nothing, and
 * guessing wrong costs the Arabic half of the site its refresh.
 *
 * The segment is hardcoded rather than imported from `lib/links.ts`: that
 * module pulls in next-intl, and this one is loaded by the Payload CLI where
 * there is no Next runtime (règle d'or #5's neighbourhood). The cost is that a
 * change to the Arabic pathname in `lib/i18n/routing.ts` must be echoed here.
 */
const AR_ARTICLE_SEGMENT = 'مقال'

function pathsForSlug(locale: 'fr' | 'ar', slug: string): string[] {
  const paths = [`/${locale}/article/${encodeURIComponent(slug)}`]
  if (locale === 'ar') {
    paths.push(`/ar/${encodeURIComponent(AR_ARTICLE_SEGMENT)}/${encodeURIComponent(slug)}`)
  }
  return paths
}

/**
 * Where `beforeDelete` leaves the article's URLs for `afterDelete` to find.
 *
 * WHY THE PATHS CANNOT SIMPLY BE READ OFF THE DELETED DOCUMENT — measured, and
 * the first two attempts at this were both wrong:
 *
 * `afterDelete` receives a document whose LOCALIZED fields are all `undefined`.
 * Not resolved into the request's locale, not shaped as `{ fr, ar }` — gone.
 * Only the shared fields survive:
 *
 *     [DEBUG] delete title=undefined slug=undefined rubrique="economie"
 *             status="published" reqLocale=fr fallbackLocale=false
 *
 * So the slug has to be read while the row still exists, which is what
 * `beforeDelete` is for. It reads the document with `locale: 'all'` and leaves
 * the finished paths here, keyed BY ID because one `delete({ where })` call
 * fires the pair once per matching document and they share a request.
 *
 * What the bug cost while it was live: a deleted article kept serving its
 * cached HTML at its own URL — `[revalidate] articles supprimé → /fr /ar`, no
 * article path — so a piece withdrawn for a legal reason stayed readable at the
 * address people had already been given, until the next build.
 */
const DELETED_PATHS = '__revalidateDeletedArticlePaths'

type PathsByID = Record<string, string[]>

function stash(req: HookReq | undefined, id: unknown, paths: string[]): void {
  if (!req || id === undefined || id === null) return
  const context = (req.context ??= {})
  const store = (context[DELETED_PATHS] ??= {}) as PathsByID
  store[String(id)] = paths
}

function unstash(req: HookReq | undefined, id: unknown): string[] {
  const store = req?.context?.[DELETED_PATHS] as PathsByID | undefined
  if (!store || id === undefined || id === null) return []
  const key = String(id)
  const paths = store[key] ?? []
  delete store[key]
  return paths
}

async function articlePaths(
  id: unknown,
  req?: HookReq & { payload?: { findByID?: (args: Record<string, unknown>) => Promise<unknown> } },
): Promise<string[]> {
  const findByID = req?.payload?.findByID
  if (!findByID || id === undefined || id === null) return []

  try {
    /**
     * `req` IS PASSED ON PURPOSE, and a smoke test paid for the lesson.
     *
     * `afterChange` runs inside Payload's transaction. A read that does not
     * carry `req` opens its own session and therefore cannot see the
     * uncommitted document — so on CREATE this returned nothing, the new
     * article's own URL was never revalidated, and the page 404ed until the
     * next build while the homepage happily listed it.
     *
     * On UPDATE the bug was invisible: the previous, committed version had the
     * same slug, so the paths came out right by luck.
     */
    const doc = (await findByID({
      collection: 'articles',
      id,
      locale: 'all',
      depth: 0,
      overrideAccess: true,
      req,
    })) as { slug?: Record<string, string | undefined> } | null

    const slugs = doc?.slug
    if (!slugs || typeof slugs !== 'object') return []

    const paths: string[] = []
    for (const locale of ['fr', 'ar'] as const) {
      const slug = slugs[locale]
      if (slug) paths.push(...pathsForSlug(locale, slug))
    }
    return paths
  } catch {
    // The sweep above still runs; a missing exact path is a slower refresh,
    // not a wrong one.
    return []
  }
}

/**
 * Opt-out, for writes that are not an editorial act.
 *
 * `pnpm seed` creates a hundred documents in a plain Node process where
 * `revalidatePath` has no request to attach to. Without this it would log a
 * hundred warnings and slow the script down for nothing.
 */
const isDisabled = (req?: HookReq): boolean => Boolean(req?.context?.disableRevalidate)

export const revalidateAfterChange: CollectionAfterChangeHook = async ({
  collection,
  doc,
  previousDoc,
  req,
}) => {
  const request = req as HookReq | undefined
  if (isDisabled(request)) return doc
  if (isDraftWrite(request)) return doc
  if (!affectsPublicSite(doc as MaybeDoc, previousDoc as MaybeDoc)) return doc

  const id = (doc as MaybeDoc)?.id
  const extra = collection.slug === 'articles' ? await articlePaths(id, request) : []

  await revalidateFrontend(`${collection.slug} ${String(id ?? '?')}`, request, extra)
  return doc
}

/**
 * Reads the article's URLs WHILE THE ROW STILL EXISTS and leaves them for
 * `afterDelete` (see `DELETED_PATHS` above for why this cannot wait).
 *
 * It is spread into every collection but only does work for `articles`: the
 * other collections have no per-document public URL that the layout sweep does
 * not already cover.
 */
export const revalidateBeforeDelete: CollectionBeforeDeleteHook = async ({
  collection,
  id,
  req,
}) => {
  const request = req as HookReq | undefined
  if (isDisabled(request)) return
  if (collection.slug !== 'articles') return

  stash(request, id, await articlePaths(id, request))
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({
  collection,
  doc,
  id,
  req,
}) => {
  const request = req as HookReq | undefined
  if (isDisabled(request)) return doc
  // A deleted DRAFT was never on the site, so there is nothing to refresh.
  // `_status` is NOT localized, so it is one of the few fields that survives
  // into this hook — which is exactly why this check still works here.
  if (!affectsPublicSite(doc as MaybeDoc)) return doc

  const extra = unstash(request, id)

  await revalidateFrontend(`${collection.slug} supprimé`, request, extra)
  return doc
}

/**
 * The set, ready to spread into a collection's `hooks`.
 *
 *     hooks: { ...editorialHooks, ...revalidationHooks }
 *
 * `beforeDelete` is part of it and is not optional: `afterDelete` alone cannot
 * name the pages it has to refresh.
 */
export const revalidationHooks = {
  afterChange: [revalidateAfterChange],
  beforeDelete: [revalidateBeforeDelete],
  afterDelete: [revalidateAfterDelete],
}
