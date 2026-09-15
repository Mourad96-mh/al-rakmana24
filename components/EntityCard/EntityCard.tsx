import Image from 'next/image'
import type { EntitySummary } from '@/lib/content-types'
import { resolveMedia } from '@/lib/media'
import type { Locale } from '@/lib/rubriques'
import * as links from '@/lib/links'
import { articleCount } from '@/lib/plural'
import { DownloadButton } from '@/components/DownloadList/DownloadList'
import styles from './EntityCard.module.css'

/**
 * A row in an entity-hub index. Portrait entities (personnalités) get a round
 * crop, organisations and legal texts a square one — same component, so the four
 * hubs stay visually consistent while still reading as different things.
 */
export function EntityCard({
  entity,
  locale,
  count,
}: {
  entity: EntitySummary
  locale: Locale
  /** How many articles reference this entity — omitted on the detail page. */
  count?: number
}) {
  const isPerson = entity.kind === 'personnalites'
  const image = resolveMedia(
    entity.image,
    entity.slug,
    isPerson ? 'portrait' : 'thumb',
    locale,
  )
  const href = links.entity(locale, entity.kind, entity.slug)

  return (
    <article
      className={[styles.card, isPerson ? styles.person : '', entity.file ? styles.withDownload : '']
        .filter(Boolean)
        .join(' ')}
    >
      <a className={styles.media} href={href} tabIndex={-1} aria-hidden="true">
        <Image
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes="120px"
          className={styles.image}
        />
      </a>

      <div className={styles.body}>
        <h3 className={styles.name}>
          <a className={styles.link} href={href}>
            {entity.name}
          </a>
        </h3>
        <p className={styles.kicker}>{entity.kicker}</p>
        {count !== undefined ? (
          <p className={styles.count}>{articleCount(count, locale)}</p>
        ) : null}
      </div>

      {/* Only the legal texts carry a file — this is what makes their index a
          download library as well as a hub index. */}
      {entity.file ? (
        <div className={styles.download}>
          <DownloadButton file={entity.file} locale={locale} title={entity.name} />
        </div>
      ) : null}
    </article>
  )
}
