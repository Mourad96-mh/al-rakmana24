import { getTranslations } from 'next-intl/server'

import type { DownloadFile } from '@/lib/content-types'
import type { Locale } from '@/lib/rubriques'
import { formatDate, formatFileSize } from '@/lib/format'
import styles from './DownloadList.module.css'

export interface DownloadItem {
  id: string
  title: string
  description?: string
  /** Optional page behind the title — the legal texts link to their hub. */
  href?: string
  /** Free-form line under the title: statut, type, référence… */
  meta?: string
  publishedAt?: string
  file: DownloadFile
}

/**
 * The list used by BOTH download libraries — the newsroom's documents and the
 * official legal texts. Same affordance in both places, because a reader who
 * learned where the button is on one page should not have to learn again.
 *
 * The weight and the format are shown ON the button, never after the click: a
 * 12 MB PDF over a mobile connection is a decision the reader makes first.
 */
export async function DownloadList({
  items,
  locale,
  emptyLabel,
}: {
  items: readonly DownloadItem[]
  locale: Locale
  emptyLabel: string
}) {
  if (items.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>
  }

  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          <div className={styles.body}>
            <h3 className={styles.title}>
              {item.href ? (
                <a className={styles.titleLink} href={item.href}>
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </h3>
            {item.description ? <p className={styles.description}>{item.description}</p> : null}
            <p className={styles.meta}>
              {item.meta ? <span>{item.meta}</span> : null}
              {item.publishedAt ? (
                <time dateTime={item.publishedAt}>{formatDate(item.publishedAt, locale)}</time>
              ) : null}
            </p>
          </div>

          <DownloadButton file={item.file} locale={locale} title={item.title} />
        </li>
      ))}
    </ul>
  )
}

/**
 * The download affordance itself, so it is identical everywhere it appears —
 * in the two libraries and in the identity panel of a legal-text hub.
 *
 * Format and weight live ON the button, before the click.
 */
export async function DownloadButton({
  file,
  locale,
  title,
  block = false,
}: {
  file: DownloadFile
  locale: Locale
  /** Only for the accessible name — the visible label is « Télécharger ». */
  title: string
  /** Full-width variant, used in the narrow identity panel. */
  block?: boolean
}) {
  const t = await getTranslations('downloads')

  return (
    /* `download` keeps the file a file: the reader gets it on disk rather than
       in a tab they then have to save from. */
    <a
      className={`${styles.button} ${block ? styles.blockButton : ''}`}
      href={file.url}
      download
      aria-label={`${t('download')} : ${title}`}
    >
      <span className={styles.icon} aria-hidden="true" />
      <span className={styles.buttonText}>
        <span className={styles.buttonLabel}>{t('download')}</span>
        <span className={styles.fileMeta}>
          {file.ext.toUpperCase()} · {formatFileSize(file.sizeBytes, locale)}
        </span>
      </span>
    </a>
  )
}
