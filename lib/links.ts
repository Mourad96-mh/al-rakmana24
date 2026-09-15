import { getPathname } from './i18n/routing'
import type { AppLocale } from './i18n/routing'
import { encodeParam } from './params'
import { ENTITY_SEGMENT, type EntityKind } from './content-types'
import type { Rubrique, SousRubrique } from './rubriques'

/**
 * Every internal URL in the site is built here. Nothing else concatenates a path.
 *
 * WHY this has to exist: `routing.pathnames` localizes a route's segments, so the
 * Arabic URL of an article is `/ar/مقال/<slug>`, not `/ar/article/<slug>`. The
 * middleware will happily *redirect* the un-localized form — which is what makes
 * a hand-written `/${locale}/article/${slug}` look like it works — but every such
 * link then costs a 307 on the Arabic side, and, worse, the page's own canonical
 * disagrees with the URL the reader and the crawler end up on.
 *
 * Two families of route, and they are not interchangeable:
 *
 *   - LOCALIZED — listed in `routing.pathnames`. Built with next-intl's
 *     `getPathname`, which is the only thing that knows the per-locale segment.
 *   - PLAIN — the index pages that are not in that map (`/dossiers`, `/tags`,
 *     the four hub indexes…). Concatenated directly, because next-intl passes
 *     an unlisted pathname through untouched.
 *
 * Adding an Arabic pathname for one of the plain routes means adding it to
 * `routing.pathnames` AND switching its builder here — never one without the
 * other. The Arabic segments there are still provisional (see routing.ts).
 */

/* ------------------------------------------------------- localized routes */

export const home = (locale: AppLocale): string => `/${locale}`

export const article = (locale: AppLocale, slug: string): string =>
  getPathname({ locale, href: { pathname: '/article/[slug]', params: { slug } } })

export const podcastIndex = (locale: AppLocale): string =>
  getPathname({ locale, href: '/podcast' })

export const podcast = (locale: AppLocale, slug: string): string =>
  getPathname({ locale, href: { pathname: '/podcast/[slug]', params: { slug } } })

export const dossier = (locale: AppLocale, slug: string): string =>
  getPathname({ locale, href: { pathname: '/dossiers/[slug]', params: { slug } } })

export const auteur = (locale: AppLocale, slug: string): string =>
  getPathname({ locale, href: { pathname: '/auteurs/[slug]', params: { slug } } })

export const tag = (locale: AppLocale, slug: string): string =>
  getPathname({ locale, href: { pathname: '/tags/[slug]', params: { slug } } })

export function entity(locale: AppLocale, kind: EntityKind, slug: string): string {
  switch (kind) {
    case 'startups':
      return getPathname({ locale, href: { pathname: '/startups/[slug]', params: { slug } } })
    case 'entreprises':
      return getPathname({ locale, href: { pathname: '/entreprises/[slug]', params: { slug } } })
    case 'personnalites':
      return getPathname({ locale, href: { pathname: '/personnalites/[slug]', params: { slug } } })
    default:
      return getPathname({
        locale,
        href: { pathname: '/textes-juridiques/[slug]', params: { slug } },
      })
  }
}

/** The newsroom's download library. The legal texts are NOT here — they live on
 *  their own hub, `entityIndex(locale, 'textes-juridiques')`. */
export const documents = (locale: AppLocale): string =>
  getPathname({ locale, href: '/documents' })

export const newsletter = (locale: AppLocale): string =>
  getPathname({ locale, href: '/newsletter' })

export const recherche = (locale: AppLocale): string =>
  getPathname({ locale, href: '/recherche' })

export const quiSommesNous = (locale: AppLocale): string =>
  getPathname({ locale, href: '/qui-sommes-nous' })

export const laRedaction = (locale: AppLocale): string =>
  getPathname({ locale, href: '/la-redaction' })

export const nousRejoindre = (locale: AppLocale): string =>
  getPathname({ locale, href: '/nous-rejoindre' })

export const nousContacter = (locale: AppLocale): string =>
  getPathname({ locale, href: '/nous-contacter' })

/* ----------------------------------------------------------- plain routes */

/** Hub indexes: not in `routing.pathnames`, so the segment is the same in both. */
export const entityIndex = (locale: AppLocale, kind: EntityKind): string =>
  `/${locale}/${ENTITY_SEGMENT[kind]}`

export const dossierIndex = (locale: AppLocale): string => `/${locale}/dossiers`
export const auteurIndex = (locale: AppLocale): string => `/${locale}/auteurs`
export const tagIndex = (locale: AppLocale): string => `/${locale}/tags`
export const mentionsLegales = (locale: AppLocale): string => `/${locale}/mentions-legales`
export const confidentialite = (locale: AppLocale): string => `/${locale}/confidentialite`

/* -------------------------------------------------------------- rubriques */

/**
 * Rubriques are dynamic `[rubrique]` segments, not entries in
 * `routing.pathnames` — their per-locale slug lives in lib/rubriques.ts. They
 * are non-ASCII in Arabic, hence `encodeParam` (see lib/params.ts).
 */
export const rubrique = (locale: AppLocale, r: Rubrique): string =>
  `/${locale}/${encodeParam(r.slug[locale])}`

export const sousRubrique = (
  locale: AppLocale,
  r: Rubrique,
  s: SousRubrique,
): string => `${rubrique(locale, r)}/${encodeParam(s.slug[locale])}`
