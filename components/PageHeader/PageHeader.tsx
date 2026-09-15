import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

/**
 * The masthead of every non-home page: kicker, title, standfirst, and whatever
 * the page wants to hang under it (a sous-rubrique nav, a fact panel, a form).
 *
 * Sits on the same heavy rule as SectionHeading, which is what keeps a rubrique
 * listing and the homepage looking like the same newspaper.
 */
export function PageHeader({
  kicker,
  title,
  intro,
  children,
}: {
  kicker?: string
  title: string
  intro?: string
  children?: ReactNode
}) {
  return (
    <header className={styles.header}>
      {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
      <h1 className={styles.title}>{title}</h1>
      {intro ? <p className={styles.intro}>{intro}</p> : null}
      {children}
    </header>
  )
}
