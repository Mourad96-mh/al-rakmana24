import Image from 'next/image'
import type { DossierSummary } from '@/lib/content-types'
import { resolveMedia, isPlaceholder } from '@/lib/media'
import type { Locale } from '@/lib/rubriques'
import * as links from '@/lib/links'
import styles from './DossierCard.module.css'

/**
 * The "Séries & Enquêtes" card from the reference: full-bleed cover with the
 * title reversed out over a dark scrim, and a red kicker badge.
 */
export function DossierCard({
  dossier,
  locale,
}: {
  dossier: DossierSummary
  locale: Locale
}) {
  const image = resolveMedia(dossier.image, dossier.slug, 'card', locale)

  return (
    <article className={styles.card}>
      <a className={styles.link} href={links.dossier(locale, dossier.slug)}>
        <Image
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes="(max-width: 900px) 100vw, 380px"
          className={styles.image}
        />
        <span className={styles.scrim} aria-hidden="true" />
        <span className={styles.badge}>{dossier.kicker}</span>
        <h3 className={styles.title}>{dossier.title}</h3>
        {isPlaceholder(image) ? (
          <span className={styles.placeholderTag}>
            {locale === 'fr' ? 'Image à remplacer' : 'صورة مؤقتة'}
          </span>
        ) : null}
      </a>
    </article>
  )
}
