import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { ENTITY_LABELS, type EntityKind } from '@/lib/content-types'
import { getEntity, listEntities } from '@/lib/queries'
import { absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { EntityIndexView } from '@/components/EntityHub/EntityHub'

/** Thin route: the whole hub lives in components/EntityHub, shared by the four. */
const KIND: EntityKind = 'personnalites'

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

  return {
    title: ENTITY_LABELS[KIND][lang as AppLocale],
    alternates: {
      canonical: absolute(links.entityIndex(lang as AppLocale, KIND)),
      languages: languageAlternates(routing.locales, (l) =>
        links.entityIndex(l as AppLocale, KIND),
      ),
    },
  }
}

export default async function Page({ params }: { params: Params }) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const t = await getTranslations('listing')
  const entities = await listEntities(locale, KIND)

  // One hub page per entity, so the counts are resolved together rather than
  // one after the other.
  const counts = Object.fromEntries(
    await Promise.all(
      entities.map(async (e) => [
        e.slug,
        (await getEntity(locale, KIND, e.slug))?.articles.length ?? 0,
      ]),
    ),
  )

  return (
    <EntityIndexView
      kind={KIND}
      entities={entities}
      counts={counts}
      locale={locale}
      emptyLabel={t('empty')}
    />
  )
}
