import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { findRubrique } from '@/lib/rubriques'
import * as links from '@/lib/links'
import { getHomeContent, listVideos } from '@/lib/queries'
import { ArticleCard } from '@/components/ArticleCard/ArticleCard'
import { DossierCard } from '@/components/DossierCard/DossierCard'
import { FilInfo } from '@/components/FilInfo/FilInfo'
import { AdRail } from '@/components/AdSlot/AdSlot'
import { VideoRow } from '@/components/VideoRow/VideoRow'
import { SectionHeading, SectionBlock } from '@/components/SectionHeading/SectionHeading'
import styles from './page.module.css'

export async function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const t = await getTranslations('listing')
  const tSite = await getTranslations('site')
  const tVideos = await getTranslations('videos')
  const { lead, secondary, byRubrique, ticker, mostRead, dossiers } = await getHomeContent(locale)
  /* Three, in one row on a large screen — the client's own wording. */
  const videos = await listVideos(locale, 3)

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

      {/* ---------- Vidéos : trois par ligne sur grand écran ---------- */}
      {videos.length > 0 ? (
        <div className="container">
          <SectionBlock>
            <SectionHeading title={tVideos('title')} accent />
            <VideoRow
              videos={videos}
              locale={locale}
              labels={{
                play: tVideos('play'),
                pending: tVideos('pending'),
                pendingNote: tVideos('pendingNote'),
              }}
            />
          </SectionBlock>
        </div>
      ) : null}

      {/* Espace publicitaire en colonne de droite, le long des rubriques. */}
      <div className="container with-rail">
        <div className={styles.mainCol}>
          {/* ---------- One river per rubrique ---------- */}
          {byRubrique.map((group) => {
            const rubrique = findRubrique(group.rubrique)
            if (!rubrique) return null
            const [first, ...others] = group.articles

            return (
              <SectionBlock key={group.rubrique}>
                <SectionHeading
                  title={rubrique.label[locale]}
                  href={links.rubrique(locale, rubrique)}
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
                href={links.dossierIndex(locale)}
                linkLabel={seeAll}
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

        <AdRail locale={locale} />
      </div>

      <p className="visually-hidden">{tSite('description')}</p>
    </main>
  )
}
