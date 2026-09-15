import Image from 'next/image'
import type { AuthorSummary } from '@/lib/content-types'
import { resolveMedia } from '@/lib/media'
import type { Locale } from '@/lib/rubriques'
import * as links from '@/lib/links'
import styles from './AuthorCard.module.css'

export function AuthorCard({
  author,
  locale,
  bio,
}: {
  author: AuthorSummary
  locale: Locale
  /** Shown on « La rédaction », omitted in the compact author index. */
  bio?: string
}) {
  const image = resolveMedia(author.image, author.slug, 'portrait', locale)
  const href = links.auteur(locale, author.slug)

  return (
    <article className={styles.card}>
      <a className={styles.media} href={href} tabIndex={-1} aria-hidden="true">
        <Image
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes="128px"
          className={styles.image}
        />
      </a>

      <div className={styles.body}>
        <h3 className={styles.name}>
          <a className={styles.link} href={href}>
            {author.name}
          </a>
        </h3>
        <p className={styles.role}>{author.role}</p>
        {bio ? <p className={styles.bio}>{bio}</p> : null}
      </div>
    </article>
  )
}
