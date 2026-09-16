import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { RUBRIQUES, findRubriqueBySlug, findSousRubriqueBySlug } from '@/lib/rubriques'
import { decodeParam, encodeParam, prerenderSlug } from '@/lib/params'
import { listArticles } from '@/lib/queries'
import { absolute, languageAlternates } from '@/lib/site'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { SubNav } from '@/components/SubNav/SubNav'
import { ArticleGrid } from '@/components/ArticleGrid/ArticleGrid'
import { AdRail } from '@/components/AdSlot/AdSlot'

/** Both segments are per-locale slugs, and both are Arabic on the /ar side. */
export async function generateStaticParams() {
  return routing.locales.flatMap((lang) =>
    RUBRIQUES.flatMap((rubrique) =>
      rubrique.sousRubriques
        .filter((sous) => prerenderSlug(rubrique.slug[lang]) && prerenderSlug(sous.slug[lang]))
        .map((sous) => ({
          lang,
          rubrique: encodeParam(rubrique.slug[lang]),
          sousRubrique: encodeParam(sous.slug[lang]),
        })),
    ),
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

type Params = Promise<{ lang: string; rubrique: string; sousRubrique: string }>

/** Resolve both segments at once — neither is meaningful without the other. */
function resolve(locale: AppLocale, rawRubrique: string, rawSous: string) {
  const rubrique = findRubriqueBySlug(decodeParam(rawRubrique), locale)
  if (!rubrique) return null
  const sous = findSousRubriqueBySlug(rubrique, decodeParam(rawSous), locale)
  if (!sous) return null
  return { rubrique, sous }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang, rubrique: rawRubrique, sousRubrique: rawSous } = await params
  if (!hasLocale(routing.locales, lang)) return {}

  const locale = lang as AppLocale
  const found = resolve(locale, rawRubrique, rawSous)
  if (!found) return {}

  const { rubrique, sous } = found
  const pathFor = (l: string) =>
    `/${l}/${encodeParam(rubrique.slug[l as AppLocale])}/${encodeParam(sous.slug[l as AppLocale])}`

  return {
    title: `${sous.label[locale]} — ${rubrique.label[locale]}`,
    alternates: {
      canonical: absolute(pathFor(locale)),
      languages: languageAlternates(routing.locales, pathFor),
    },
  }
}

export default async function SousRubriquePage({ params }: { params: Params }) {
  const { lang, rubrique: rawRubrique, sousRubrique: rawSous } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const found = resolve(locale, rawRubrique, rawSous)
  if (!found) notFound()

  const { rubrique, sous } = found
  const t = await getTranslations('listing')
  const articles = await listArticles(locale, {
    rubrique: rubrique.value,
    sousRubrique: sous.value,
  })

  const base = `/${locale}/${encodeParam(rubrique.slug[locale])}`

  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[
          { label: locale === 'fr' ? 'Accueil' : 'الرئيسية', href: `/${locale}` },
          { label: rubrique.label[locale], href: base },
          { label: sous.label[locale] },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader kicker={rubrique.label[locale]} title={sous.label[locale]}>
        {/* Siblings stay reachable: a reader landing here from search should be
            able to move sideways without going back up to the rubrique. */}
        <SubNav
          label={locale === 'fr' ? 'Sous-rubriques' : 'الأقسام الفرعية'}
          items={rubrique.sousRubriques.map((item) => ({
            label: item.label[locale],
            href: `${base}/${encodeParam(item.slug[locale])}`,
            current: item.value === sous.value,
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
