'use client'

import { useId, useMemo, useState, useSyncExternalStore } from 'react'
import type { SearchDoc } from '@/lib/queries'
import { findRubrique, type Locale } from '@/lib/rubriques'
import { formatDayMonth } from '@/lib/format'
import * as links from '@/lib/links'
import { articleCount, resultCount } from '@/lib/plural'
import styles from './SearchBox.module.css'

/**
 * Client-side search over a prebuilt index.
 *
 * A CLIENT ISLAND on a static page (règle d'or #4): the corpus is a few dozen
 * documents, so shipping it beats a round-trip, and /recherche stays prerendered.
 * When the corpus outgrows that — a few hundred articles — this island posts to
 * a server route instead and the page does not otherwise change.
 */
/* The masthead menu's search field is a plain GET form pointing here, so `?q=`
   has to seed the box. The page is PRERENDERED without a query string, hence
   useSyncExternalStore rather than reading `location` during render: the server
   snapshot is empty, hydration matches, and the URL's value lands right after. */
const subscribeToLocation = (onChange: () => void) => {
  window.addEventListener('popstate', onChange)
  return () => window.removeEventListener('popstate', onChange)
}

const readQueryFromLocation = () =>
  new URLSearchParams(window.location.search).get('q') ?? ''

const noQueryOnServer = () => ''

export function SearchBox({ docs, locale }: { docs: SearchDoc[]; locale: Locale }) {
  const id = useId()
  const urlQuery = useSyncExternalStore(
    subscribeToLocation,
    readQueryFromLocation,
    noQueryOnServer,
  )
  /* null = the reader has not typed yet, so the URL still owns the field. */
  const [typed, setTyped] = useState<string | null>(null)
  const query = typed ?? urlQuery
  const setQuery = setTyped

  const trimmed = query.trim().toLowerCase()

  const results = useMemo(() => {
    if (trimmed.length < 2) return []
    const terms = trimmed.split(/\s+/)
    return docs.filter((doc) => terms.every((term) => doc.haystack.includes(term)))
  }, [docs, trimmed])

  const fr = locale === 'fr'

  return (
    <div className={styles.wrap}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={id}>
          {fr ? 'Rechercher un article' : 'ابحث عن مقال'}
        </label>
        <input
          id={id}
          className={styles.input}
          type="search"
          autoComplete="off"
          placeholder={fr ? 'Ex. : données personnelles, levée de fonds…' : 'مثال: المعطيات الشخصية، جولة تمويل…'}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <p className={styles.status} role="status">
        {trimmed.length < 2
          ? fr
            ? `${articleCount(docs.length, locale)} publiés dans cette langue.`
            : `${articleCount(docs.length, locale)} منشورة بهذه اللغة.`
          : fr
            ? `${resultCount(results.length, locale)} pour « ${query.trim()} »`
            : `${resultCount(results.length, locale)} عن «${query.trim()}»`}
      </p>

      {trimmed.length >= 2 ? (
        <ol className={styles.results}>
          {results.map((doc) => {
            const rubrique = findRubrique(doc.rubrique)
            return (
              <li key={doc.slug} className={styles.result}>
                <p className={styles.kicker}>
                  {rubrique ? rubrique.label[locale] : ''}
                  <time dateTime={doc.publishedAt}>{formatDayMonth(doc.publishedAt, locale)}</time>
                </p>
                <h2 className={styles.title}>
                  <a className={styles.link} href={links.article(locale, doc.slug)}>
                    {doc.title}
                  </a>
                </h2>
                {doc.excerpt ? <p className={styles.excerpt}>{doc.excerpt}</p> : null}
              </li>
            )
          })}
        </ol>
      ) : null}

      {trimmed.length >= 2 && results.length === 0 ? (
        <p className={styles.empty}>
          {fr
            ? 'Aucun article ne correspond. Essayez un terme plus court, ou parcourez les rubriques.'
            : 'لا يوجد مقال مطابق. جربوا كلمة أقصر أو تصفحوا الأقسام.'}
        </p>
      ) : null}
    </div>
  )
}
