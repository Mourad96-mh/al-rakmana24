import Image from 'next/image'
import type { PodcastSummary } from '@/lib/content-types'
import { resolveMedia } from '@/lib/media'
import { formatDate } from '@/lib/format'
import type { Locale } from '@/lib/rubriques'
import * as links from '@/lib/links'
import styles from './PodcastCard.module.css'

export function PodcastCard({
  episode,
  locale,
}: {
  episode: PodcastSummary
  locale: Locale
}) {
  const image = resolveMedia(episode.image, episode.slug, 'card', locale)
  const href = links.podcast(locale, episode.slug)

  return (
    <article className={styles.card}>
      <a className={styles.media} href={href} tabIndex={-1} aria-hidden="true">
        <Image
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes="(max-width: 900px) 100vw, 340px"
          className={styles.image}
        />
        {/* `numero` is optional in the CMS — a pilot or a bonus has no number,
            and « Épisode undefined » is worse than no badge at all. */}
        {episode.episode !== undefined ? (
          <span className={styles.episode}>
            {locale === 'fr' ? `Épisode ${episode.episode}` : `الحلقة ${episode.episode}`}
          </span>
        ) : null}
      </a>

      <div className={styles.body}>
        <h3 className={styles.title}>
          <a className={styles.link} href={href}>
            {episode.title}
          </a>
        </h3>
        <p className={styles.excerpt}>{episode.excerpt}</p>
        <p className={styles.meta}>
          {episode.guest ? <span>{episode.guest}</span> : null}
          <time dateTime={episode.publishedAt}>{formatDate(episode.publishedAt, locale)}</time>
          {episode.duration !== undefined ? (
            <span>
              {locale === 'fr' ? `${episode.duration} min` : `${episode.duration} دقيقة`}
            </span>
          ) : null}
        </p>
      </div>
    </article>
  )
}
