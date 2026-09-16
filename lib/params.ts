/**
 * Dynamic route params arrive PERCENT-ENCODED and are not decoded for us.
 *
 * Verified against Next 15.5.19 + next-intl middleware: a request for
 * `/ar/%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF` reaches the page with
 * `params.rubrique === '%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF'`, NOT `'اقتصاد'`.
 *
 * This is invisible on the French side — every French slug is already ASCII, so
 * the encoded and decoded forms are identical — and it silently 404s the entire
 * Arabic half of the site. CLAUDE.md §5 makes Arabic slugs a deliberate choice
 * ("Arabic articles get Arabic slugs (percent-encoded) — better SERP CTR"), so
 * every dynamic segment must go through here before it is looked up.
 *
 * Apply it to EVERY `[slug]`-style param, not just the ones that are non-ASCII
 * today: decoding an ASCII slug is a no-op, and the next Arabic slug added to
 * the content model must not have to rediscover this.
 */
export function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    // A malformed escape sequence means a hand-mangled URL. Returning the raw
    // value makes it match nothing, which 404s — the correct outcome — instead
    // of throwing a 500 out of a lookup.
    return value
  }
}

/**
 * The mirror image, for `generateStaticParams`.
 *
 * The prerender manifest is matched against the RAW request path, so a param
 * containing non-ASCII has to be pre-encoded here or the prebuilt page is never
 * found (`dynamicParams = false` then answers `NoFallbackError` → 404).
 */
export const encodeParam = (value: string): string => encodeURIComponent(value)

/**
 * May this (decoded) slug be prerendered at build time?
 *
 * EVERYWHERE BUT VERCEL, YES. On Vercel, a page prerendered under a
 * percent-encoded non-ASCII path is served as a 404 — measured on the first
 * deployment (2026-09-16): `/ar/%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF` came back
 * `x-nextjs-prerender: 1`, `x-vercel-cache: HIT`, status 404, while the same
 * build's `.meta` reports 200 under `next start` and the static Arabic
 * pathnames (`/ar/بودكاست`) are fine. Only the prebuilt copy is broken.
 *
 * So on Vercel the Arabic slugs are left out of `generateStaticParams`: with
 * `dynamicParams` true they render on the first request and are then cached by
 * ISR like any other page. On a VPS / `next start` nothing changes.
 */
export const prerenderSlug = (value: string): boolean =>
  !process.env.VERCEL || /^[\x20-\x7e]*$/.test(value)
