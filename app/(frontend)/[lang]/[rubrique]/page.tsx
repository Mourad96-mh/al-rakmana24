import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { RUBRIQUES, findRubriqueBySlug } from '@/lib/rubriques'
import { decodeParam, encodeParam } from '@/lib/params'
import { listArticles } from '@/lib/queries'
import { absolute, languageAlternates } from '@/lib/site'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { SubNav } from '@/components/SubNav/SubNav'
import { ArticleGrid } from '@/components/ArticleGrid/ArticleGrid'
import { AdRail } from '@/components/AdSlot/AdSlot'

/**
 * Rubrique listing.
 *
 * This is the DYNAMIC `[rubrique]` segment, so it sits at the same level as the
 * static ones (`article`, `podcast`, `dossiers`…). Next resolves static segments
 * first, so `/fr/podcast` never reaches this file — see lib/i18n/routing.ts.
 *
 * The slug is per-locale (`economie` / `اقتصاد`), resolved through
 * `findRubriqueBySlug`, which is why the two language versions of the same
 * rubrique have genuinely different URLs — and why every param here goes through
 * lib/params.ts: Arabic slugs reach the page percent-encoded.
 */
export async function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    RUBRIQUES.map((rubrique) => ({ lang, rubrique: encodeParam(rubrique.slug[lang]) })),
  )
}

/**
 * `dynamicParams` is deliberately left at its default (true) here, unlike every
 * other route in the app.
 *
 * With `dynamicParams = false`, Next answers `NoFallbackError` → 404 for the
 * Arabic rubrique slugs even though they ARE prerendered and the prerender
 * manifest key matches the request byte for byte: the gate that decides
 * "is this one of the generated params?" does not agree with the manifest on
 * percent-encoded, non-ASCII segments. Verified against 15.5.19.
 *
 * Leaving it true costs nothing: a known slug still serves the prerendered
 * page, and an unknown one falls through to `notFound()` below, which is the
 * same 404 the flag would have produced.
 */

type Params = Promise<{ lang: string; rubrique: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, rubrique: rawSlug } = await params
  if (!hasLocale(routing.locales, lang)) return {}

  const locale = lang as AppLocale
  const rubrique = findRubriqueBySlug(decodeParam(rawSlug), locale)
  if (!rubrique) return {}

  return {
    title: rubrique.label[locale],
    alternates: {
      canonical: absolute(`/${locale}/${encodeParam(rubrique.slug[locale])}`),
      // A rubrique exists in both locales by construction — unlike an article.
      languages: languageAlternates(
        routing.locales,
        (l) => `/${l}/${encodeParam(rubrique.slug[l as AppLocale])}`,
      ),
    },
  }
}

export default async function RubriquePage({ params }: { params: Params }) {
  const { lang, rubrique: rawSlug } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const rubrique = findRubriqueBySlug(decodeParam(rawSlug), locale)
  if (!rubrique) notFound()

  const t = await getTranslations('listing')
  const articles = await listArticles(locale, { rubrique: rubrique.value })

  /* Links are rebuilt from the taxonomy rather than echoed from the incoming
     param, so an Arabic URL is always emitted in one canonical encoded form. */
  const base = `/${locale}/${encodeParam(rubrique.slug[locale])}`

  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[
          { label: locale === 'fr' ? 'Accueil' : 'الرئيسية', href: `/${locale}` },
          { label: rubrique.label[locale] },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader
        kicker={t('latest')}
        title={rubrique.label[locale]}
        intro={
          locale === 'fr'
            ? `Toute l’actualité de la rubrique ${rubrique.label.fr} sur Al-Raqmana24.`
            : `كل مستجدات قسم ${rubrique.label.ar} على الرقمنة 24.`
        }
      >
        <SubNav
          label={locale === 'fr' ? 'Sous-rubriques' : 'الأقسام الفرعية'}
          items={rubrique.sousRubriques.map((sous) => ({
            label: sous.label[locale],
            href: `${base}/${encodeParam(sous.slug[locale])}`,
          }))}
        />
      </PageHeader>

      {/* Espace publicitaire en colonne de droite, le long de la liste. */}
      <div className="page-body with-rail">
        <ArticleGrid articles={articles} locale={locale} emptyLabel={t('empty')} />
        <AdRail locale={locale} />
      </div>
    </main>
  )
}
