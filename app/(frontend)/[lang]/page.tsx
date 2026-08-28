import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { findRubrique } from '@/lib/rubriques'
import { getHomeContent } from '@/lib/demo-content'
import { ArticleCard } from '@/components/ArticleCard/ArticleCard'
import { DossierCard } from '@/components/DossierCard/DossierCard'
import { FilInfo } from '@/components/FilInfo/FilInfo'
import { SectionHeading, SectionBlock } from '@/components/SectionHeading/SectionHeading'
import styles from './page.module.css'

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const t = await getTranslations('listing')
  const tSite = await getTranslations('site')
  const { lead, secondary, byRubrique, ticker, mostRead, dossiers } = getHomeContent(locale)

  const seeAll = locale === 'fr' ? 'Tout voir' : 'عرض الكل'

  return (
    <main id="contenu">
      {/* ---------- Hero: lead article + secondaries + fil info ---------- */}
      <section className={`container ${styles.hero}`} aria-label={t('topStories')}>
        <div className={styles.heroLead}>
          {lead ? (
            <ArticleCard article={lead} locale={locale} variant="lead" showExcerpt />
          ) : (
            <p className={styles.empty}>{t('empty')}</p>
          )}
        </div>

        <div className={styles.heroSecondary}>
          {secondary.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              locale={locale}
              variant="compact"
            />
          ))}
        </div>

        <aside className={styles.heroAside} aria-label={locale === 'fr' ? 'Le fil info' : 'شريط الأخبار'}>
          <SectionHeading
            title={locale === 'fr' ? 'Le fil info' : 'شريط الأخبار'}
            level={3}
            accent
          />
          <FilInfo items={ticker} locale={locale} />
        </aside>
      </section>

      <div className="container">
        {/* ---------- One river per rubrique ---------- */}
        {byRubrique.map((group) => {
          const rubrique = findRubrique(group.rubrique)
          if (!rubrique) return null
          const [first, ...others] = group.articles

          return (
            <SectionBlock key={group.rubrique}>
              <SectionHeading
                title={rubrique.label[locale]}
                href={`/${locale}/${rubrique.slug[locale]}`}
                linkLabel={seeAll}
                accent
              />

              <div className={styles.river}>
                <div className={styles.riverMain}>
                  <ArticleCard article={first} locale={locale} variant="standard" showExcerpt />
                </div>

                <div className={styles.riverRest}>
                  {others.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      locale={locale}
                      variant="compact"
                    />
                  ))}
                </div>
              </div>
            </SectionBlock>
          )
        })}

        {/* ---------- Dossiers ---------- */}
        {dossiers.length > 0 ? (
          <SectionBlock>
            <SectionHeading
              title={locale === 'fr' ? 'Séries & enquêtes' : 'سلاسل وتحقيقات'}
            />
            <div className={styles.dossiers}>
              {dossiers.map((dossier) => (
                <DossierCard key={dossier.id} dossier={dossier} locale={locale} />
              ))}
            </div>
          </SectionBlock>
        ) : null}

        {/* ---------- Most read ---------- */}
        {mostRead.length > 0 ? (
          <SectionBlock>
            <SectionHeading title={locale === 'fr' ? 'Les plus lus' : 'الأكثر قراءة'} />
            <div className={styles.mostRead}>
              {mostRead.map((article, i) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  locale={locale}
                  variant="numbered"
                  index={i + 1}
                />
              ))}
            </div>
          </SectionBlock>
        ) : null}
      </div>

      <p className="visually-hidden">{tSite('description')}</p>
    </main>
  )
}
