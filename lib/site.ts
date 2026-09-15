/**
 * Site-level constants shared by metadata, JSON-LD and the sitemap.
 *
 * `SITE_URL` has no trailing slash — every caller concatenates a path that
 * starts with one. It is read from the environment so the preview deployment
 * does not advertise the production domain in its canonicals.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://al-raqmana24.ma'
).replace(/\/$/, '')

export const SITE_NAME = 'Al-Raqmana24'

/** Absolute URL for a site-relative path. */
export const absolute = (path: string): string => `${SITE_URL}${path}`

/**
 * `alternates.languages` for a page, built ONLY from the locales in which the
 * document genuinely exists (règle d'or #2). Emitting hreflang for a locale that
 * 404s is worse than emitting none.
 *
 * @param pathFor  maps a locale to that locale's path for this document
 */
export function languageAlternates(
  locales: readonly string[],
  pathFor: (locale: string) => string,
): Record<string, string> {
  return Object.fromEntries(locales.map((l) => [l, absolute(pathFor(l))]))
}
