import type { Locale } from '@/lib/rubriques'
import styles from './Breadcrumbs.module.css'

export interface Crumb {
  label: string
  /** Absent on the last crumb — the current page is not a link. */
  href?: string
}

/**
 * Trail above every page title. Emits BreadcrumbList JSON-LD alongside the
 * visible list: on an entity-hub site the breadcrumb is what tells the search
 * engine that /startups/x sits under /startups, which is most of the moat.
 *
 * The separator is a CSS pseudo-element rather than a character in the markup,
 * so it flips with `dir` and never lands in the accessible name.
 */
export function Breadcrumbs({
  items,
  locale,
  siteUrl,
}: {
  items: Crumb[]
  locale: Locale
  /** Absolute origin, when known — JSON-LD wants absolute URLs. */
  siteUrl?: string
}) {
  if (items.length === 0) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: siteUrl ? `${siteUrl}${item.href}` : item.href } : {}),
    })),
  }

  return (
    <>
      <nav className={styles.wrap} aria-label={locale === 'fr' ? 'Fil d’Ariane' : 'مسار التصفح'}>
        <ol className={styles.list}>
          {items.map((item) => (
            <li key={item.label} className={styles.item}>
              {item.href ? (
                <a className={styles.link} href={item.href}>
                  {item.label}
                </a>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        // Server-rendered from our own data — no user input reaches this string.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  )
}
