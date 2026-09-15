import Image from 'next/image'
import type { ArticleSummary } from '@/lib/content-types'
import { FORMAT_LABELS } from '@/lib/content-types'
import { findRubrique, findSousRubrique, type Locale } from '@/lib/rubriques'
import { resolveMedia, isPlaceholder } from '@/lib/media'
import * as links from '@/lib/links'
import { formatDayMonth } from '@/lib/format'
import styles from './ArticleCard.module.css'

export type CardVariant = 'lead' | 'standard' | 'compact' | 'numbered'

const SIZES: Record<CardVariant, 'feature' | 'card' | 'thumb'> = {
  lead: 'feature',
  standard: 'card',
  compact: 'thumb',
  numbered: 'thumb',
}

/** Rubrique › sous-rubrique kicker, in the reader's locale. */
function kickerFor(article: ArticleSummary, locale: Locale): string {
  const rubrique = findRubrique(article.rubrique)
  if (!rubrique) return FORMAT_LABELS[article.format][locale]

  const sous = article.sousRubrique
    ? findSousRubrique(rubrique, article.sousRubrique)
    : undefined

  return sous ? sous.label[locale] : rubrique.label[locale]
}

export function ArticleCard({
  article,
  locale,
  variant = 'standard',
  index,
  showExcerpt,
}: {
  article: ArticleSummary
  locale: Locale
  variant?: CardVariant
  /** 1-based rank, rendered only by the `numbered` variant. */
  index?: number
  showExcerpt?: boolean
}) {
  const withImage = variant === 'lead' || variant === 'standard'
  const image = withImage ? resolveMedia(article.image, article.slug, SIZES[variant], locale) : null
  const href = links.article(locale, article.slug)
  const excerpt = (showExcerpt ?? variant === 'lead') ? article.excerpt : undefined

  return (
    <article className={`${styles.card} ${styles[variant]}`}>
      {image ? (
        <a className={styles.media} href={href} tabIndex={-1} aria-hidden="true">
          <Image
            src={image.src}
            alt=""
            width={image.width}
            height={image.height}
            sizes={variant === 'lead' ? '(max-width: 900px) 100vw, 760px' : '(max-width: 900px) 100vw, 380px'}
            priority={variant === 'lead'}
            className={styles.image}
          />
          {isPlaceholder(image) ? (
            <span className={styles.placeholderTag}>
              {locale === 'fr' ? 'Image à remplacer' : 'صورة مؤقتة'}
            </span>
          ) : null}
        </a>
      ) : null}

      <div className={styles.body}>
        {variant === 'numbered' && index ? (
          <span className={styles.rank} aria-hidden="true">
            {index}
          </span>
        ) : null}

        <div className={styles.text}>
          <p className={styles.kicker}>{kickerFor(article, locale)}</p>

          <h3 className={styles.title}>
            <a className={styles.titleLink} href={href}>
              {article.title}
            </a>
          </h3>

          {excerpt ? <p className={styles.excerpt}>{excerpt}</p> : null}

          <p className={styles.meta}>
            {article.author ? <span className={styles.author}>{article.author.name}</span> : null}
            <time dateTime={article.publishedAt}>
              {formatDayMonth(article.publishedAt, locale)}
            </time>
          </p>
        </div>
      </div>
    </article>
  )
}
