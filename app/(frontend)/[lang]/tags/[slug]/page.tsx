import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { decodeParam } from '@/lib/params'
import { getTag, listArticles, tagParams } from '@/lib/queries'
import { absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { articleCount } from '@/lib/plural'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { ArticleGrid } from '@/components/ArticleGrid/ArticleGrid'
import { JsonLd } from '@/components/JsonLd/JsonLd'
import { articleListJsonLd } from '@/lib/jsonld'

export async function generateStaticParams() {
  return await tagParams()
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

type Params = Promise<{ lang: string; slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, slug: rawSlug } = await params
  const slug = decodeParam(rawSlug)
  if (!hasLocale(routing.locales, lang)) return {}

  const tag = await getTag(lang as AppLocale, slug)
  if (!tag) return {}

  return {
    title: tag.label,
    // A tag page with nothing in it in this locale has no business in the index.
    robots: tag.count === 0 ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: absolute(links.tag(lang as AppLocale, slug)),
      languages: languageAlternates(routing.locales, (l) => links.tag(l as AppLocale, slug)),
    },
  }
}

export default async function TagPage({ params }: { params: Params }) {
  const { lang, slug: rawSlug } = await params
  const slug = decodeParam(rawSlug)
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const tag = await getTag(locale, slug)
  if (!tag) notFound()

  const t = await getTranslations('listing')
  const articles = await listArticles(locale, { tag: slug })

  return (
    <main id="contenu" className="container">
      {/* Everything filed under one keyword — CollectionPage + ItemList. */}
      <JsonLd
        data={articleListJsonLd({
          url: absolute(links.tag(locale, slug)),
          name: tag.label,
          locale,
          articles,
        })}
      />

      <Breadcrumbs
        items={[
          { label: locale === 'fr' ? 'Accueil' : 'الرئيسية', href: links.home(locale) },
          {
            label: locale === 'fr' ? 'Mots-clés' : 'الكلمات المفتاحية',
            href: links.tagIndex(locale),
          },
          { label: tag.label },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader
        kicker={locale === 'fr' ? 'Mot-clé' : 'كلمة مفتاحية'}
        title={tag.label}
        intro={
          locale === 'fr'
            ? `${articleCount(articles.length, locale)} publié${articles.length > 1 ? 's' : ''} sous ce mot-clé.`
            : `${articleCount(articles.length, locale)} تحت هذه الكلمة المفتاحية.`
        }
      />

      <div className="page-body">
        <ArticleGrid articles={articles} locale={locale} emptyLabel={t('empty')} />
      </div>
    </main>
  )
}
