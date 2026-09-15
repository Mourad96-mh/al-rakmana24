import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { getPage } from '@/lib/queries'
import { absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { StaticPageView } from '@/components/StaticPageView/StaticPageView'

/** Thin route: the shell lives in components/StaticPageView, shared by all five. */
const SLUG = 'nous-contacter'

export async function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

export const dynamicParams = false

type Params = Promise<{ lang: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) return {}

  const page = await getPage(lang as AppLocale, SLUG)
  if (!page) return {}

  return {
    title: page.title,
    description: page.intro,
    // Legal boilerplate and account pages carry no search value and would
    // dilute the index — see StaticPage.noindex in lib/content-types.
    robots: page.noindex ? { index: false, follow: true } : undefined,
    alternates: {
      canonical: absolute(links.nousContacter(lang as AppLocale)),
      languages: languageAlternates(routing.locales, (l) => links.nousContacter(l as AppLocale)),
    },
  }
}

export default async function Page({ params }: { params: Params }) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const page = await getPage(locale, SLUG)
  if (!page) notFound()

  return <StaticPageView page={page} locale={locale} />
}
