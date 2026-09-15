import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { RUBRIQUES, type Locale } from '@/lib/rubriques'
import * as links from '@/lib/links'
import { NewsletterForm } from '@/components/NewsletterForm/NewsletterForm'
import styles from './Footer.module.css'

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations('footer')
  const tSite = await getTranslations('site')
  const tNav = await getTranslations('nav')
  const tNews = await getTranslations('newsletter')
  const tDl = await getTranslations('downloads')
  const year = new Date().getFullYear()
  const fr = locale === 'fr'

  const institutional = [
    { href: links.quiSommesNous(locale), label: t('about') },
    { href: links.laRedaction(locale), label: t('redaction') },
    { href: links.nousRejoindre(locale), label: t('join') },
    { href: links.nousContacter(locale), label: t('contact') },
  ]

  /* Discovery surfaces that are not rubriques: the entity hubs and the series.
     They exist mostly for search engines and returning readers, which is why
     they live here rather than in the masthead nav. */
  const explore = [
    { href: links.podcastIndex(locale), label: tNav('podcast') },
    { href: links.dossierIndex(locale), label: fr ? 'Séries & enquêtes' : 'سلاسل وتحقيقات' },
    { href: links.entityIndex(locale, 'startups'), label: fr ? 'Startups' : 'شركات ناشئة' },
    { href: links.entityIndex(locale, 'entreprises'), label: fr ? 'Entreprises' : 'شركات' },
    { href: links.entityIndex(locale, 'personnalites'), label: fr ? 'Personnalités' : 'شخصيات' },
    { href: links.entityIndex(locale, 'textes-juridiques'), label: tDl('legal') },
    { href: links.documents(locale), label: tDl('documents') },
    { href: links.auteurIndex(locale), label: fr ? 'Auteurs' : 'المحررون' },
    { href: links.tagIndex(locale), label: fr ? 'Mots-clés' : 'الكلمات المفتاحية' },
  ]

  return (
    <footer className={styles.footer}>
      {/* Newsletter band — the free subscription is the whole business model
          (règle d'or #1). The form itself is a client island, so the pages that
          render this footer stay static. */}
      <div className={styles.newsletter}>
        <div className={`container ${styles.newsletterInner}`}>
          <div>
            <h2 className={styles.newsletterTitle}>{tNews('title')}</h2>
            <p className={styles.newsletterIntro}>{tNews('intro')}</p>
          </div>
          <div className={styles.newsletterForm}>
            <NewsletterForm locale={locale} compact />
          </div>
        </div>
      </div>

      <div className={`container ${styles.main}`}>
        <div className={styles.brandCol}>
          <Image
            src="/logo-mark.png"
            alt=""
            width={182}
            height={160}
            className={styles.logo}
          />
          <p className={styles.brandName}>{tSite('name')}</p>
          <p className={styles.brandTag}>{tSite('tagline')}</p>
        </div>

        <nav className={styles.col} aria-label={fr ? 'Rubriques' : 'الأقسام'}>
          <h3 className={styles.colTitle}>{fr ? 'Rubriques' : 'الأقسام'}</h3>
          <ul className={styles.list}>
            {RUBRIQUES.map((r) => (
              <li key={r.value}>
                <a className={styles.link} href={links.rubrique(locale, r)}>
                  {r.label[locale]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={styles.col} aria-label={fr ? 'Explorer' : 'استكشاف'}>
          <h3 className={styles.colTitle}>{fr ? 'Explorer' : 'استكشاف'}</h3>
          <ul className={styles.list}>
            {explore.map((item) => (
              <li key={item.href}>
                <a className={styles.link} href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={styles.col} aria-label={t('about')}>
          <h3 className={styles.colTitle}>{fr ? 'Le journal' : 'الجريدة'}</h3>
          <ul className={styles.list}>
            {institutional.map((item) => (
              <li key={item.href}>
                <a className={styles.link} href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={styles.legal}>
        <div className={`container ${styles.legalInner}`}>
          <p className={styles.copy}>
            © {year} {tSite('name')}. {t('rights')}
          </p>
          <ul className={styles.legalList}>
            <li>
              <a className={styles.legalLink} href={links.mentionsLegales(locale)}>
                {t('legal')}
              </a>
            </li>
            <li>
              <a className={styles.legalLink} href={links.confidentialite(locale)}>
                {t('privacy')}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
