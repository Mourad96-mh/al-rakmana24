import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { RUBRIQUES, type Locale } from '@/lib/rubriques'
import styles from './Footer.module.css'

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations('footer')
  const tSite = await getTranslations('site')
  const tNews = await getTranslations('newsletter')
  const year = new Date().getFullYear()

  const institutional = [
    { href: `/${locale}/qui-sommes-nous`, label: t('about') },
    { href: `/${locale}/la-redaction`, label: t('redaction') },
    { href: `/${locale}/nous-rejoindre`, label: t('join') },
    { href: `/${locale}/nous-contacter`, label: t('contact') },
  ]

  return (
    <footer className={styles.footer}>
      {/* Newsletter band — the free subscription is the whole business model
          (règle d'or #1). Becomes a working form in Lot 6. */}
      <div className={styles.newsletter}>
        <div className={`container ${styles.newsletterInner}`}>
          <div>
            <h2 className={styles.newsletterTitle}>{tNews('title')}</h2>
            <p className={styles.newsletterIntro}>{tNews('intro')}</p>
          </div>
          <a className={styles.newsletterCta} href={`/${locale}/newsletter`}>
            {tNews('submit')}
          </a>
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

        <nav className={styles.col} aria-label={tSite('name')}>
          <h3 className={styles.colTitle}>{locale === 'fr' ? 'Rubriques' : 'الأقسام'}</h3>
          <ul className={styles.list}>
            {RUBRIQUES.map((r) => (
              <li key={r.value}>
                <a className={styles.link} href={`/${locale}/${r.slug[locale]}`}>
                  {r.label[locale]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav className={styles.col} aria-label={t('about')}>
          <h3 className={styles.colTitle}>{locale === 'fr' ? 'Le journal' : 'الجريدة'}</h3>
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
              <a className={styles.legalLink} href={`/${locale}/mentions-legales`}>
                {t('legal')}
              </a>
            </li>
            <li>
              <a className={styles.legalLink} href={`/${locale}/confidentialite`}>
                {t('privacy')}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
