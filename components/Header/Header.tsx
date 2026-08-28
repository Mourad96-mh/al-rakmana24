import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { RUBRIQUES, type Locale } from '@/lib/rubriques'
import { formatDate } from '@/lib/format'
import styles from './Header.module.css'

/**
 * Three-tier masthead, following the reference layout:
 *   1. slim black utility bar  — date, language switch, free-subscribe CTA
 *   2. main bar                — menu + search at the edges, LOGO CENTRED
 *   3. nav strip               — the rubriques, on a heavy rule
 *
 * Server component: nothing here is interactive yet. The mobile drawer and the
 * search field become client islands in Lot 3 — deliberately not in the layout,
 * so the pages below stay SSG (règle d'or #4).
 */
export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('nav')
  const tSite = await getTranslations('site')
  const tNews = await getTranslations('newsletter')
  const other: Locale = locale === 'fr' ? 'ar' : 'fr'
  const today = formatDate(new Date().toISOString(), locale)

  return (
    <header className={styles.header}>
      <div className={styles.utility}>
        <div className={`container ${styles.utilityInner}`}>
          <p className={styles.date}>{today}</p>

          <div className={styles.utilityActions}>
            <a className={styles.langSwitch} href={`/${other}`} hrefLang={other} lang={other}>
              {t('switchToArabic')}
            </a>
            <a className={styles.subscribe} href={`/${locale}/newsletter`}>
              {tNews('title')}
            </a>
          </div>
        </div>
      </div>

      <div className={styles.main}>
        <div className={`container ${styles.mainInner}`}>
          <a className={styles.menuButton} href={`/${locale}/recherche`}>
            <span className={styles.burger} aria-hidden="true" />
            <span className={styles.menuLabel}>{t('menu')}</span>
          </a>

          <a className={styles.brand} href={`/${locale}`} aria-label={tSite('name')}>
            <Image
              src="/logo-mark.png"
              alt=""
              width={182}
              height={160}
              className={styles.logo}
              priority
            />
            <span className={styles.wordmark}>
              <span className={styles.wordmarkName}>{tSite('name')}</span>
              <span className={styles.wordmarkTag}>{tSite('tagline')}</span>
            </span>
          </a>

          <a className={styles.searchButton} href={`/${locale}/recherche`}>
            <span className={styles.searchIcon} aria-hidden="true" />
            <span className={styles.menuLabel}>{t('search')}</span>
          </a>
        </div>
      </div>

      <nav className={styles.nav} aria-label={t('menu')}>
        <div className={`container ${styles.navInner}`}>
          <ul className={styles.navList}>
            {RUBRIQUES.map((rubrique) => (
              <li key={rubrique.value}>
                <a className={styles.navLink} href={`/${locale}/${rubrique.slug[locale]}`}>
                  {rubrique.label[locale]}
                </a>
              </li>
            ))}
            <li>
              <a className={styles.navLink} href={`/${locale}/podcast`}>
                {t('podcast')}
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
