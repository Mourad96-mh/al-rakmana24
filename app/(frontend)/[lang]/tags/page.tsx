import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { listTags } from '@/lib/queries'
import { absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
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

const TITLE = { fr: 'Mots-clés', ar: 'الكلمات المفتاحية' } as const

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) return {}

  return {
    title: TITLE[lang as AppLocale],
    alternates: {
      canonical: absolute(links.tagIndex(lang as AppLocale)),
      languages: languageAlternates(routing.locales, (l) => links.tagIndex(l as AppLocale)),
    },
  }
}

export default async function TagsIndex({ params }: { params: Params }) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  // Counts are per-locale, so a tag with no article in this language is absent.
  const tags = await listTags(locale)

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
        kicker={locale === 'fr' ? 'Explorer' : 'استكشاف'}
        title={TITLE[locale]}
        intro={
          locale === 'fr'
            ? 'Les mots-clés transversaux aux rubriques. Ils complètent la navigation par rubrique, ils ne la remplacent pas.'
            : 'الكلمات المفتاحية العابرة للأقسام. تكمل التصفح حسب القسم ولا تعوضه.'
        }
      />

      <ul className={`page-body ${styles.list}`}>
        {tags.map((tag) => (
          <li key={tag.slug}>
            <a className={styles.tag} href={links.tag(locale, tag.slug)}>
              {tag.label}
              <span className={styles.count}>{tag.count}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
