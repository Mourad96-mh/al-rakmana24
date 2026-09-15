import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { DOCUMENT_CATEGORY_LABELS } from '@/lib/content-types'
import { documentsByCategory } from '@/lib/queries'
import { absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { SubNav } from '@/components/SubNav/SubNav'
import { SectionHeading, SectionBlock } from '@/components/SectionHeading/SectionHeading'
import { DownloadList, type DownloadItem } from '@/components/DownloadList/DownloadList'
import { AdRail } from '@/components/AdSlot/AdSlot'
import styles from './page.module.css'

/**
 * « Documents & modèles » — the FIRST of the two download libraries.
 *
 * The second one (official legal texts) is deliberately NOT here: the client
 * asked for the two to be separate, and a legal text already has a page of its
 * own on the `textes-juridiques` hub, where the file sits next to the summary,
 * the status and every article we wrote about it. Merging them would give a
 * text two URLs and split its SEO.
 */
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

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) return {}

  const t = await getTranslations({ locale: lang, namespace: 'downloads' })

  return {
    title: t('documents'),
    description: t('documentsIntro'),
    alternates: {
      canonical: absolute(links.documents(lang as AppLocale)),
      languages: languageAlternates(routing.locales, (l) => links.documents(l as AppLocale)),
    },
  }
}

export default async function DocumentsPage({ params }: { params: Params }) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const t = await getTranslations('downloads')
  const groups = await documentsByCategory(locale)

  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[
          { label: locale === 'fr' ? 'Accueil' : 'الرئيسية', href: links.home(locale) },
          { label: t('documents') },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader kicker={t('title')} title={t('documents')} intro={t('documentsIntro')}>
        {/* The two libraries are separate rubriques — and each one says so by
            linking to the other. */}
        <SubNav
          label={t('title')}
          items={[
            { label: t('documents'), href: links.documents(locale), current: true },
            {
              label: t('legal'),
              href: links.entityIndex(locale, 'textes-juridiques'),
            },
          ]}
        />
      </PageHeader>

      <div className="page-body with-rail">
        <div>
          {groups.length === 0 ? (
            <p className={styles.empty}>{t('empty')}</p>
          ) : (
            groups.map((group) => {
              const items: DownloadItem[] = group.documents.map((doc) => ({
                id: doc.id,
                title: doc.title,
                description: doc.description,
                publishedAt: doc.publishedAt,
                file: doc.file,
              }))

              return (
                <SectionBlock key={group.categorie}>
                  <SectionHeading
                    title={DOCUMENT_CATEGORY_LABELS[group.categorie][locale]}
                    accent
                  />
                  <DownloadList items={items} locale={locale} emptyLabel={t('empty')} />
                </SectionBlock>
              )
            })
          )}

          <p className={styles.disclaimer}>{t('disclaimer')}</p>
        </div>

        <AdRail locale={locale} />
      </div>
    </main>
  )
}
