import styles from './SubNav.module.css'

export interface SubNavItem {
  label: string
  href: string
  current?: boolean
}

/**
 * Chip strip under a rubrique title, listing its sous-rubriques. Also reused by
 * the entity hub index to switch between the four hubs, and by /tags.
 */
export function SubNav({ items, label }: { items: SubNavItem[]; label: string }) {
  if (items.length === 0) return null

  return (
    <nav className={styles.nav} aria-label={label}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.href}>
            <a
              className={`${styles.chip} ${item.current ? styles.current : ''}`}
              href={item.href}
              aria-current={item.current ? 'page' : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
