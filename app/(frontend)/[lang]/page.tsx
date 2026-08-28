import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { RUBRIQUES } from '@/lib/rubriques'
import styles from './page.module.css'

/**
 * Lot 1 scaffold home page.
 *
 * Deliberately shows the taxonomy rather than fake articles: its job is to prove
 * that i18n routing, the RTL mirror, the type scales and the token palette all
 * work end to end. Replaced by the real homepage in Lot 3 (Une, top stories,
 * ticker, latest by rubrique).
 */
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const t = await getTranslations('site')
  const tNav = await getTranslations('nav')
  const other: AppLocale = locale === 'fr' ? 'ar' : 'fr'

  return (
    <main className={`container ${styles.page}`}>
      <header className={styles.masthead}>
        <p className={styles.kicker}>{t('name')}</p>
        <h1 className={styles.title}>{t('tagline')}</h1>
        <p className={styles.lede}>{t('description')}</p>
        <a className={styles.switch} href={`/${other}`} hrefLang={other}>
          {tNav('switchToArabic')}
        </a>
      </header>

      <section aria-labelledby="rubriques-heading">
        <h2 id="rubriques-heading" className={styles.sectionTitle}>
          {locale === 'fr' ? 'Rubriques' : 'الأقسام'}
        </h2>

        <ul className={styles.rubriques}>
          {RUBRIQUES.map((rubrique) => (
            <li key={rubrique.value} className={styles.rubrique}>
              <h3 className={styles.rubriqueName}>{rubrique.label[locale]}</h3>
              <p className={styles.slug}>/{rubrique.slug[locale]}</p>
              {rubrique.sousRubriques.length > 0 && (
                <ul className={styles.sousRubriques}>
                  {rubrique.sousRubriques.map((sous) => (
                    <li key={sous.value}>{sous.label[locale]}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.note}>
        {locale === 'fr'
          ? 'Lot 1 — fondations. Le contenu éditorial arrive au Lot 3.'
          : 'المرحلة الأولى — الأسس. المحتوى التحريري يأتي في المرحلة الثالثة.'}
      </p>
    </main>
  )
}
