'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ImageRef, VideoSummary } from '@/lib/content-types'
import type { Locale } from '@/lib/rubriques'
import { formatDate, formatDuration } from '@/lib/format'
import styles from './VideoCard.module.css'

/**
 * A video card with a click-to-play FACADE.
 *
 * The iframe is not in the page until the reader asks for it. That is not a
 * micro-optimisation: a YouTube embed pulls ~1 MB of third-party JavaScript and
 * sets cookies before anyone has pressed play. Three of them in a row on the
 * homepage would cost more than the whole rest of the site, and would make a
 * page that is otherwise cookie-free suddenly need a consent banner.
 *
 * This is the ONLY client component in the video path — the cover, the title and
 * the metadata are server-rendered, so the section still prerenders (règle d'or
 * #4) and the text is in the HTML for the crawler.
 */
export function VideoCard({
  video,
  image,
  locale,
  labels,
}: {
  video: VideoSummary
  /** Resolved on the server: a client component must not touch the media layer. */
  image: ImageRef
  locale: Locale
  labels: { play: string; pending: string }
}) {
  const [playing, setPlaying] = useState(false)
  const playable = video.videoId !== ''

  const src =
    video.provider === 'vimeo'
      ? `https://player.vimeo.com/video/${video.videoId}?autoplay=1`
      : // -nocookie is the whole point of the facade: no tracking cookie until play.
        `https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0`

  return (
    <article className={styles.card}>
      <div className={styles.frame}>
        {playing && playable ? (
          <iframe
            className={styles.player}
            src={src}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className={styles.cover}
            onClick={() => setPlaying(true)}
            aria-label={`${labels.play} : ${video.title}`}
            disabled={!playable}
          >
            <Image
              src={image.src}
              alt=""
              width={image.width}
              height={image.height}
              sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 400px"
              className={styles.image}
            />
            <span className={styles.play} aria-hidden="true" />
            {video.duration ? (
              <span className={styles.duration}>{formatDuration(video.duration)}</span>
            ) : null}
            {/* Demo state: no provider id yet, so there is nothing to play. */}
            {!playable ? <span className={styles.pending}>{labels.pending}</span> : null}
          </button>
        )}
      </div>

      <div className={styles.body}>
        {video.kicker ? <p className={styles.kicker}>{video.kicker}</p> : null}
        <h3 className={styles.title}>{video.title}</h3>
        <p className={styles.meta}>
          <time dateTime={video.publishedAt}>{formatDate(video.publishedAt, locale)}</time>
        </p>
      </div>
    </article>
  )
}
