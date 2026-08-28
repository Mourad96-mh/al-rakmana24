import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Inter, Source_Serif_4, IBM_Plex_Sans_Arabic } from 'next/font/google'

import { routing, dirOf } from '@/lib/i18n/routing'
import '../../globals.css'

/* Latin: serif for headlines, sans for UI and body. */
const sourceSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-source-serif',
})

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
})

/* Arabic: one family for both headings and body — mixing two Arabic faces at
   this scale reads as a mistake rather than a hierarchy. */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-plex-arabic',
})

/** Both locales are prerendered — this is what keeps the site SSG (règle d'or #4). */
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) return {}

  const t = await getTranslations({ locale: lang, namespace: 'site' })

  return {
    title: {
      default: `${t('name')} — ${t('tagline')}`,
      template: `%s · ${t('name')}`,
    },
    description: t('description'),
  }
}

export default async function FrontendLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()

  // Required for static rendering: without it every page below opts into
  // dynamic rendering the first time it touches a translation.
  setRequestLocale(lang)

  return (
    <html
      lang={lang}
      dir={dirOf(lang)}
      className={`${sourceSerif.variable} ${inter.variable} ${plexArabic.variable}`}
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning: browser extensions inject attributes on <body>. */}
      <body suppressHydrationWarning>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
