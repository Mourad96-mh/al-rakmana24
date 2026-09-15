'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import styles from './MainMenu.module.css'

export interface MenuLink {
  href: string
  label: string
}

export interface MenuSection extends MenuLink {
  /** Sous-rubriques. Empty for a rubrique that has none — then no toggle is rendered. */
  items: readonly MenuLink[]
}

export interface MainMenuLabels {
  menu: string
  close: string
  search: string
  searchPlaceholder: string
  rubriques: string
  explore: string
  journal: string
  expand: string
}

export interface MainMenuProps {
  labels: MainMenuLabels
  sections: readonly MenuSection[]
  explore: readonly MenuLink[]
  journal: readonly MenuLink[]
  searchHref: string
  langSwitch: MenuLink & { locale: string }
  subscribe: MenuLink
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'

/**
 * The masthead menu, modelled on the reference site: the burger opens a panel
 * that slides in from the leading edge over a scrim, with the rubriques as
 * accordions and the discovery / institutional links below.
 *
 * A CLIENT ISLAND, deliberately not mounted by the layout itself (règle d'or #4):
 * it renders no viewer-specific data, so every page that shows it stays SSG. The
 * whole panel ships in the server-rendered HTML — hidden, `inert`, and out of the
 * a11y tree until opened — so its links are crawlable and the first click is instant.
 *
 * RTL: the panel is anchored with `inset-inline-start`, so it enters from the right
 * on /ar for free; only the `translateX` sign needs mirroring (règle d'or #3).
 */
export function MainMenu({
  labels,
  sections,
  explore,
  journal,
  searchHref,
  langSwitch,
  subscribe,
}: MainMenuProps) {
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, [])

  /* Scroll lock. `overflow: hidden` removes the scrollbar, which shifts the page
     under the scrim — padding the gutter back keeps it still. In RTL the scrollbar
     sits on the left, i.e. still the inline END edge. */
  useEffect(() => {
    if (!open) return

    const { body, documentElement } = document
    const gutter = window.innerWidth - documentElement.clientWidth
    const prevOverflow = body.style.overflow
    const prevPadding = body.style.paddingInlineEnd

    body.style.overflow = 'hidden'
    if (gutter > 0) body.style.paddingInlineEnd = `${gutter}px`

    return () => {
      body.style.overflow = prevOverflow
      body.style.paddingInlineEnd = prevPadding
    }
  }, [open])

  /* Escape closes; Tab cycles inside the panel. */
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }

      if (event.key !== 'Tab' || !panelRef.current) return

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`${styles.burger} ${open ? styles.burgerOpen : ''}`} aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className={styles.triggerLabel}>{open ? labels.close : labels.menu}</span>
      </button>

      <div className={styles.overlay} data-open={open || undefined} inert={!open}>
        <button
          type="button"
          className={styles.scrim}
          tabIndex={-1}
          aria-hidden="true"
          onClick={close}
        />

        <div
          ref={panelRef}
          id={panelId}
          className={styles.panel}
          role="dialog"
          aria-modal="true"
          aria-label={labels.menu}
        >
          <div className={styles.panelHead}>
            <button ref={closeRef} type="button" className={styles.close} onClick={close}>
              <span className={styles.closeIcon} aria-hidden="true" />
              <span>{labels.close}</span>
            </button>
            <a
              className={styles.lang}
              href={langSwitch.href}
              hrefLang={langSwitch.locale}
              lang={langSwitch.locale}
            >
              {langSwitch.label}
            </a>
          </div>

          {/* A plain GET form: it works without JS and lands on the static
              /recherche page, which picks `q` up on mount. */}
          <form className={styles.search} action={searchHref} method="get" role="search">
            <label className={styles.srOnly} htmlFor={`${panelId}-q`}>
              {labels.search}
            </label>
            <input
              id={`${panelId}-q`}
              className={styles.searchInput}
              type="search"
              name="q"
              autoComplete="off"
              placeholder={labels.searchPlaceholder}
            />
            <button type="submit" className={styles.searchSubmit}>
              {labels.search}
            </button>
          </form>

          <nav className={styles.sections} aria-label={labels.rubriques}>
            <ul className={styles.sectionList}>
              {sections.map((section) => {
                const isOpen = expanded === section.href
                const subId = `${panelId}-${section.href}`
                return (
                  <li key={section.href} className={styles.section}>
                    <div className={styles.sectionRow}>
                      <a className={styles.sectionLink} href={section.href}>
                        {section.label}
                      </a>
                      {section.items.length > 0 ? (
                        <button
                          type="button"
                          className={styles.sectionToggle}
                          aria-expanded={isOpen}
                          aria-controls={subId}
                          aria-label={`${labels.expand} — ${section.label}`}
                          onClick={() => setExpanded(isOpen ? null : section.href)}
                        >
                          <span
                            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
                            aria-hidden="true"
                          />
                        </button>
                      ) : null}
                    </div>

                    {section.items.length > 0 ? (
                      <ul id={subId} className={styles.subList} hidden={!isOpen}>
                        {section.items.map((item) => (
                          <li key={item.href}>
                            <a className={styles.subLink} href={item.href}>
                              {item.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className={styles.columns}>
            <nav className={styles.column} aria-label={labels.explore}>
              <h2 className={styles.columnTitle}>{labels.explore}</h2>
              <ul className={styles.columnList}>
                {explore.map((item) => (
                  <li key={item.href}>
                    <a className={styles.columnLink} href={item.href}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav className={styles.column} aria-label={labels.journal}>
              <h2 className={styles.columnTitle}>{labels.journal}</h2>
              <ul className={styles.columnList}>
                {journal.map((item) => (
                  <li key={item.href}>
                    <a className={styles.columnLink} href={item.href}>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <a className={styles.cta} href={subscribe.href}>
            {subscribe.label}
          </a>
        </div>
      </div>
    </>
  )
}
