import type { VideoSummary } from '@/lib/content-types'
import type { Locale } from '@/lib/rubriques'
import { resolveMedia } from '@/lib/media'
import { VideoCard } from '@/components/VideoCard/VideoCard'
import styles from './VideoRow.module.css'

/**
 * A row of videos — THREE across on a large screen, which is what the client
 * asked for; two on a tablet, one on a phone.
 *
 * Server component: it resolves the covers through `resolveMedia` and hands each
 * card a ready-made `ImageRef`, so the media layer never crosses into client
 * code and the section stays prerendered.
 */
export function VideoRow({
  videos,
  locale,
  labels,
}: {
  videos: readonly VideoSummary[]
  locale: Locale
  /** `pendingNote` is shown ONCE under the row, not on every thumbnail. */
  labels: { play: string; pending: string; pendingNote?: string }
}) {
  if (videos.length === 0) return null

  const anyPending = videos.some((v) => v.videoId === '')

  return (
    <>
      <div className={styles.row}>
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            image={resolveMedia(video.image, video.id, 'card', locale)}
            locale={locale}
            labels={{ play: labels.play, pending: labels.pending }}
          />
        ))}
      </div>

      {anyPending && labels.pendingNote ? (
        <p className={styles.note}>{labels.pendingNote}</p>
      ) : null}
    </>
  )
}
