import type { TickerItem } from '@/lib/content-types'
import { findRubrique, type Locale } from '@/lib/rubriques'
import { formatTime } from '@/lib/format'
import * as links from '@/lib/links'
import styles from './FilInfo.module.css'

/**
 * "Le fil info" — the timestamped running list from the reference sidebar.
 * Times are formatted server-side from ISO strings so SSG output is stable.
 */
export function FilInfo({ items, locale }: { items: TickerItem[]; locale: Locale }) {
  if (items.length === 0) return null

  return (
    <ol className={styles.list}>
      {items.map((item) => {
        const rubrique = findRubrique(item.rubrique)
        return (
          <li key={item.id} className={styles.item}>
            <time className={styles.time} dateTime={item.publishedAt}>
              {formatTime(item.publishedAt, locale)}
            </time>
            <div className={styles.body}>
              {rubrique ? (
                <span className={styles.rubrique}>{rubrique.label[locale]}</span>
              ) : null}
              <a className={styles.link} href={links.article(locale, item.slug)}>
                {item.title}
              </a>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
