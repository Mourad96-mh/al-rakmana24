import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { decodeParam } from '@/lib/params'
import type { EntityKind } from '@/lib/content-types'
import { entityParams, getEntity } from '@/lib/queries'
import { absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { EntityDetailView } from '@/components/EntityHub/EntityHub'

const KIND: EntityKind = 'textes-juridiques'

export async function generateStaticParams() {
  return await entityParams(KIND)
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

  const entity = await getEntity(lang as AppLocale, KIND, slug)
  if (!entity) return {}

  return {
    title: entity.name,
    description: entity.summary,
    alternates: {
      canonical: absolute(links.entity(lang as AppLocale, KIND, slug)),
      languages: languageAlternates(routing.locales, (l) =>
        links.entity(l as AppLocale, KIND, slug),
      ),
    },
  }
}

export default async function Page({ params }: { params: Params }) {
  const { lang, slug: rawSlug } = await params
  const slug = decodeParam(rawSlug)
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const entity = await getEntity(locale, KIND, slug)
  if (!entity) notFound()

  const t = await getTranslations('listing')

  return (
    <EntityDetailView
      entity={entity}
      locale={locale}
      emptyLabel={t('empty')}
    />
  )
}
