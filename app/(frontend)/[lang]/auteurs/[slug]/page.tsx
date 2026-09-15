import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { decodeParam } from '@/lib/params'
import { authorParams, getAuthor } from '@/lib/queries'
import { resolveMedia } from '@/lib/media'
import { absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { articleCount } from '@/lib/plural'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { ArticleGrid } from '@/components/ArticleGrid/ArticleGrid'
import { JsonLd } from '@/components/JsonLd/JsonLd'
import { articleListJsonLd } from '@/lib/jsonld'
import styles from './page.module.css'

export async function generateStaticParams() {
  return await authorParams()
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

  const author = await getAuthor(lang as AppLocale, slug)
  if (!author) return {}

  return {
    title: author.name,
    description: author.bio,
    alternates: {
      canonical: absolute(links.auteur(lang as AppLocale, slug)),
      languages: languageAlternates(routing.locales, (l) => links.auteur(l as AppLocale, slug)),
    },
  }
}

export default async function AuthorPage({ params }: { params: Params }) {
  const { lang, slug: rawSlug } = await params
  const slug = decodeParam(rawSlug)
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const author = await getAuthor(locale, slug)
  if (!author) notFound()

  const t = await getTranslations('listing')
  const image = resolveMedia(author.image, author.slug, 'portrait', locale)

  return (
    <main id="contenu" className="container">
      {/* A byline and everything it signed — CollectionPage + ItemList. */}
      <JsonLd
        data={articleListJsonLd({
          url: absolute(links.auteur(locale, slug)),
          name: author.name,
          description: author.bio,
          locale,
          articles: author.articles,
          // `about` a Person: this is what connects a byline to the articles it
          // signs, which is the whole reason `Auteurs` is a collection and not
          // a free-text field (CLAUDE.md §6).
          about: {
            '@type': 'Person',
            name: author.name,
            jobTitle: author.role || undefined,
            description: author.bio || undefined,
            url: absolute(links.auteur(locale, slug)),
          },
        })}
      />

      <Breadcrumbs
        items={[
          { label: locale === 'fr' ? 'Accueil' : 'الرئيسية', href: links.home(locale) },
          { label: locale === 'fr' ? 'Auteurs' : 'المحررون', href: links.auteurIndex(locale) },
          { label: author.name },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <header className={styles.header}>
        <div className={styles.avatar}>
          <Image
            src={image.src}
            alt=""
            width={image.width}
            height={image.height}
            sizes="160px"
            priority
            className={styles.avatarImage}
          />
        </div>

        <div className={styles.identity}>
          <p className={styles.role}>{author.role}</p>
          <h1 className={styles.name}>{author.name}</h1>
          <p className={styles.bio}>{author.bio}</p>
          {author.email ? (
            <p className={styles.contact}>
              <a href={`mailto:${author.email}`}>{author.email}</a>
            </p>
          ) : null}
        </div>
      </header>

      <div className="page-body">
        <h2 className={styles.articlesTitle}>
          {articleCount(author.articles.length, locale)}
        </h2>
        <ArticleGrid articles={author.articles} locale={locale} emptyLabel={t('empty')} />
      </div>
    </main>
  )
}
