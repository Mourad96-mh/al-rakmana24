import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { RUBRIQUES, type Locale } from '@/lib/rubriques'
import * as links from '@/lib/links'
import { formatDate } from '@/lib/format'
import { MainMenu } from '@/components/MainMenu/MainMenu'
import styles from './Header.module.css'

/**
 * Three-tier masthead, following the reference layout:
 *   1. red utility bar — date, language switch, free-subscribe CTA
 *   2. main bar        — menu and search at the edges, BRAND LOCKUP CENTRED
 *   3. nav strip      — the rubriques, on a heavy rule
 *
 * Server component. The only interactive part is <MainMenu>, a client island that
 * receives ready-made links — nothing viewer-specific is read here, so the pages
 * below stay SSG (règle d'or #4).
 */
export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations('nav')
  const tSite = await getTranslations('site')
  const tNews = await getTranslations('newsletter')
  const tFooter = await getTranslations('footer')
  const tDl = await getTranslations('downloads')
  const other: Locale = locale === 'fr' ? 'ar' : 'fr'
  const today = formatDate(new Date().toISOString(), locale)
  const fr = locale === 'fr'

  /* Menu data is built here rather than in the island: `links.*` walks the
     next-intl pathname map, and the labels come from the request's messages. */
  const menuSections = [
    ...RUBRIQUES.map((rubrique) => ({
      href: links.rubrique(locale, rubrique),
      label: rubrique.label[locale],
      items: rubrique.sousRubriques.map((sous) => ({
        href: links.sousRubrique(locale, rubrique, sous),
        label: sous.label[locale],
      })),
    })),
    { href: links.podcastIndex(locale), label: t('podcast'), items: [] },
  ]

  const menuExplore = [
    { href: links.dossierIndex(locale), label: fr ? 'Séries & enquêtes' : 'سلاسل وتحقيقات' },
    { href: links.entityIndex(locale, 'startups'), label: fr ? 'Startups' : 'شركات ناشئة' },
    { href: links.entityIndex(locale, 'entreprises'), label: fr ? 'Entreprises' : 'شركات' },
    { href: links.entityIndex(locale, 'personnalites'), label: fr ? 'Personnalités' : 'شخصيات' },
    {
      href: links.entityIndex(locale, 'textes-juridiques'),
      label: tDl('legal'),
    },
    { href: links.documents(locale), label: tDl('documents') },
    { href: links.auteurIndex(locale), label: fr ? 'Auteurs' : 'المحررون' },
    { href: links.tagIndex(locale), label: fr ? 'Mots-clés' : 'الكلمات المفتاحية' },
  ]

  const menuJournal = [
    { href: links.quiSommesNous(locale), label: tFooter('about') },
    { href: links.laRedaction(locale), label: tFooter('redaction') },
    { href: links.nousRejoindre(locale), label: tFooter('join') },
    { href: links.nousContacter(locale), label: tFooter('contact') },
  ]

  return (
    <header className={styles.header}>
      <div className={styles.utility}>
        <div className={`container ${styles.utilityInner}`}>
          <p className={styles.date}>{today}</p>

          <div className={styles.utilityActions}>
            <a className={styles.langSwitch} href={`/${other}`} hrefLang={other} lang={other}>
              {t('switchToArabic')}
            </a>
            <a className={styles.subscribe} href={links.newsletter(locale)}>
              {tNews('title')}
            </a>
          </div>
        </div>
      </div>

      <div className={styles.main}>
        <div className={`container ${styles.mainInner}`}>
          <MainMenu
            labels={{
              menu: t('menu'),
              close: t('close'),
              search: t('search'),
              searchPlaceholder: t('searchPlaceholder'),
              rubriques: t('rubriques'),
              explore: t('explore'),
              journal: t('journal'),
              expand: t('expand'),
            }}
            sections={menuSections}
            explore={menuExplore}
            journal={menuJournal}
            searchHref={links.recherche(locale)}
            langSwitch={{ href: `/${other}`, label: t('switchToArabic'), locale: other }}
            subscribe={{ href: links.newsletter(locale), label: tNews('title') }}
          />

          {/* The brand lockup: centred on the white bar, absolutely positioned so
              the menu trigger and the search keep their own edges however wide
              they get. The mark is red-and-green on transparent and needs no
              disc behind it on this ground. */}
          <a className={styles.mainBrand} href={links.home(locale)}>
            <Image
              src="/logo-mark.png"
              alt=""
              width={182}
              height={160}
              className={styles.mainLogo}
              priority
            />
            <span className={styles.wordmark}>
              <span className={styles.wordmarkName}>{tSite('name')}</span>
              <span className={styles.wordmarkTag}>{tSite('tagline')}</span>
            </span>
          </a>

          <a className={styles.searchButton} href={links.recherche(locale)}>
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
                <a className={styles.navLink} href={links.rubrique(locale, rubrique)}>
                  {rubrique.label[locale]}
                </a>
              </li>
            ))}
            <li>
              <a className={styles.navLink} href={links.podcastIndex(locale)}>
                {t('podcast')}
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}
