import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { decodeParam } from '@/lib/params'
import { dossierParams, getDossier } from '@/lib/queries'
import { resolveMedia } from '@/lib/media'
import { absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { ArticleGrid } from '@/components/ArticleGrid/ArticleGrid'
import styles from './page.module.css'

export async function generateStaticParams() {
  return await dossierParams()
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

  const dossier = await getDossier(lang as AppLocale, slug)
  if (!dossier) return {}

  return {
    title: dossier.title,
    description: dossier.intro,
    alternates: {
      canonical: absolute(links.dossier(lang as AppLocale, slug)),
      languages: languageAlternates(routing.locales, (l) => links.dossier(l as AppLocale, slug)),
    },
  }
}

export default async function DossierPage({ params }: { params: Params }) {
  const { lang, slug: rawSlug } = await params
  const slug = decodeParam(rawSlug)
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const dossier = await getDossier(locale, slug)
  if (!dossier) notFound()

  const t = await getTranslations('listing')
  const image = resolveMedia(dossier.image, dossier.slug, 'feature', locale)

  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[
          { label: locale === 'fr' ? 'Accueil' : 'الرئيسية', href: links.home(locale) },
          {
            label: locale === 'fr' ? 'Séries & enquêtes' : 'سلاسل وتحقيقات',
            href: links.dossierIndex(locale),
          },
          { label: dossier.title },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader kicker={dossier.kicker} title={dossier.title} intro={dossier.intro} />

      <div className="page-body">
        <figure className={styles.figure}>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes="(max-width: 1000px) 100vw, 1000px"
            priority
            className={styles.image}
          />
        </figure>

        <ArticleGrid articles={dossier.articles} locale={locale} emptyLabel={t('empty')} />
      </div>
    </main>
  )
}
