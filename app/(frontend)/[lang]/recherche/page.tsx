import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { RUBRIQUES } from '@/lib/rubriques'
import * as links from '@/lib/links'
import { searchIndex } from '@/lib/queries'
import { absolute, languageAlternates } from '@/lib/site'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { SubNav } from '@/components/SubNav/SubNav'
import { SearchBox } from '@/components/SearchBox/SearchBox'

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

  const t = await getTranslations({ locale: lang, namespace: 'nav' })

  return {
    title: t('search'),
    // A search page has nothing of its own to index.
    robots: { index: false, follow: true },
    alternates: {
      canonical: absolute(links.recherche(lang as AppLocale)),
      languages: languageAlternates(routing.locales, (l) => links.recherche(l as AppLocale)),
    },
  }
}

/**
 * Search stays a STATIC page with a client island (règle d'or #4): the whole
 * corpus is serialised into the island, so no query string and no server render
 * are involved. The page below the fold doubles as the site map the header's
 * "Menu" button points at.
 */
export default async function RecherchePage({ params }: { params: Params }) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const t = await getTranslations('nav')
  const docs = await searchIndex(locale)
  const fr = locale === 'fr'

  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[
          { label: fr ? 'Accueil' : 'الرئيسية', href: links.home(locale) },
          { label: t('search') },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader
        kicker={t('menu')}
        title={t('search')}
        intro={
          fr
            ? 'Cherchez dans les articles publiés en français, ou parcourez le site rubrique par rubrique.'
            : 'ابحثوا في المقالات المنشورة بالعربية، أو تصفحوا الموقع قسما بقسم.'
        }
      >
        <SubNav
          label={fr ? 'Rubriques' : 'الأقسام'}
          items={[
            ...RUBRIQUES.map((r) => ({
              label: r.label[locale],
              href: links.rubrique(locale, r),
            })),
            { label: t('podcast'), href: links.podcastIndex(locale) },
            { label: fr ? 'Séries & enquêtes' : 'سلاسل وتحقيقات', href: links.dossierIndex(locale) },
            { label: fr ? 'Mots-clés' : 'الكلمات المفتاحية', href: links.tagIndex(locale) },
            { label: fr ? 'Startups' : 'شركات ناشئة', href: links.entityIndex(locale, 'startups') },
            { label: fr ? 'Entreprises' : 'شركات', href: links.entityIndex(locale, 'entreprises') },
            { label: fr ? 'Personnalités' : 'شخصيات', href: links.entityIndex(locale, 'personnalites') },
            {
              label: fr ? 'Textes juridiques' : 'نصوص قانونية',
              href: links.entityIndex(locale, 'textes-juridiques'),
            },
            { label: fr ? 'Auteurs' : 'المحررون', href: links.auteurIndex(locale) },
          ]}
        />
      </PageHeader>

      <div className="page-body">
        <SearchBox docs={docs} locale={locale} />
      </div>
    </main>
  )
}
