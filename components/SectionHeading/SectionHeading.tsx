import type { ReactNode } from 'react'
import styles from './SectionHeading.module.css'

/**
 * The signature element of the reference layout: a section title sitting on a
 * heavy horizontal rule, with an optional link pushed to the far end. Every
 * block on the homepage is introduced by one of these, which is most of what
 * gives the page its newspaper rhythm.
 */
export function SectionHeading({
  title,
  href,
  linkLabel,
  level = 2,
  accent = false,
}: {
  title: string
  href?: string
  linkLabel?: string
  level?: 2 | 3
  accent?: boolean
}) {
  const Tag: 'h2' | 'h3' = level === 3 ? 'h3' : 'h2'

  return (
    <div className={`${styles.heading} ${accent ? styles.accent : ''}`}>
      <Tag className={styles.title}>{title}</Tag>
      {href && linkLabel ? (
        <a className={styles.link} href={href}>
          {linkLabel}
          <span aria-hidden="true" className={styles.chevron} />
        </a>
      ) : null}
    </div>
  )
}

export function SectionBlock({ children }: { children: ReactNode }) {
  return <section className={styles.block}>{children}</section>
}
