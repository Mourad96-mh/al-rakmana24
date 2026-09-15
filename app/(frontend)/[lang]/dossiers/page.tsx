import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { listArticles, listDossiers } from '@/lib/queries'
import { absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { articleCount } from '@/lib/plural'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { DossierCard } from '@/components/DossierCard/DossierCard'
import styles from './page.module.css'

export async function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

/**
 * `dynamicParams` stays at its DEFAULT (true), like the `[rubrique]` routes and
 * unlike the institutional pages.
 *
 * Two reasons, and the second one is fatal on its own:
 *
 *  1. `NoFallbackError`. With `dynamicParams = false` Next 15.5.19 answers 404
 *     for percent-encoded, non-ASCII segments even when the prerender manifest
 *     key matches the request byte for byte — the Arabic half of the site.
 *     Already documented on `[rubrique]` (CLAUDE.md §9); it applies here too.
 *
 *  2. A NEWSROOM PUBLISHES AFTER THE BUILD. An article created at 9am is not in
 *     the build manifest, so with `dynamicParams = false` it could not be
 *     rendered on demand at all — no amount of `revalidatePath` would help,
 *     because the page was never a candidate. The publish-to-live loop
 *     (lib/revalidate.ts) requires this to be true. Verified: with it false,
 *     an edited article kept serving its build-time HTML for ever.
 *
 * Nothing is lost: every page calls `notFound()` when the content does not
 * exist in the requested locale, which is what règle d'or #2 actually needs.
 */
export const dynamicParams = true

type Params = Promise<{ lang: string }>

const TITLE = { fr: 'Séries & enquêtes', ar: 'سلاسل وتحقيقات' } as const

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) return {}

  return {
    title: TITLE[lang as AppLocale],
    alternates: {
      canonical: absolute(links.dossierIndex(lang as AppLocale)),
      languages: languageAlternates(routing.locales, (l) => links.dossierIndex(l as AppLocale)),
    },
  }
}

export default async function DossiersIndex({ params }: { params: Params }) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const t = await getTranslations('listing')
  const dossiers = await listDossiers(locale)

  /**
   * Counted up front rather than inside the JSX: a React element tree cannot
   * await, and one query per card rendered in a loop would be a query per
   * dossier in series.
   */
  const counts = Object.fromEntries(
    await Promise.all(
      dossiers.map(async (d) => [
        d.slug,
        (await listArticles(locale, { dossier: d.slug })).length,
      ]),
    ),
  ) as Record<string, number>

  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[
          { label: locale === 'fr' ? 'Accueil' : 'الرئيسية', href: links.home(locale) },
          { label: TITLE[locale] },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader
        kicker={locale === 'fr' ? 'Au long cours' : 'أعمال طويلة النفس'}
        title={TITLE[locale]}
        intro={
          locale === 'fr'
            ? 'Nos travaux suivis : chaque dossier regroupe des articles publiés dans plusieurs rubriques autour d’une même question.'
            : 'أعمالنا المتتبعة: يجمع كل ملف مقالات منشورة في عدة أقسام حول سؤال واحد.'
        }
      />

      <div className="page-body">
        {dossiers.length === 0 ? (
          <p className={styles.empty}>{t('empty')}</p>
        ) : (
          <div className={styles.grid}>
            {dossiers.map((dossier) => (
              <div key={dossier.id} className={styles.item}>
                <DossierCard dossier={dossier} locale={locale} />
                <p className={styles.count}>
                  {articleCount(counts[dossier.slug] ?? 0, locale)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
