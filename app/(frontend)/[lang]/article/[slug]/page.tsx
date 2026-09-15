import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { decodeParam } from '@/lib/params'
import * as links from '@/lib/links'
import { findRubrique, findSousRubrique } from '@/lib/rubriques'
import { FORMAT_LABELS, ENTITY_LABELS } from '@/lib/content-types'
import { articleParams, getArticle, getRelated } from '@/lib/queries'
import { resolveMedia, isPlaceholder } from '@/lib/media'
import { formatDate } from '@/lib/format'
import { SITE_NAME, absolute, languageAlternates } from '@/lib/site'
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs/Breadcrumbs'
import { Prose } from '@/components/Prose/Prose'
import { ArticleCard } from '@/components/ArticleCard/ArticleCard'
import { SectionHeading } from '@/components/SectionHeading/SectionHeading'
import { AdRail } from '@/components/AdSlot/AdSlot'
import styles from './page.module.css'

/** Only the (locale, slug) pairs that genuinely exist are built. */
export async function generateStaticParams() {
  return await articleParams()
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

  const article = await getArticle(lang as AppLocale, slug)
  if (!article) return {}

  const path = links.article(lang as AppLocale, slug)
  const image = resolveMedia(article.image, article.slug, 'feature', lang as AppLocale)

  return {
    title: article.title,
    description: article.excerpt,
    alternates: {
      canonical: absolute(path),
      // Only the locales the article actually exists in.
      languages: languageAlternates(article.locales, (l) =>
        links.article(l as AppLocale, slug),
      ),
    },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      url: absolute(path),
      siteName: SITE_NAME,
      locale: lang,
      publishedTime: article.publishedAt,
      images: [{ url: absolute(image.src), width: image.width, height: image.height }],
    },
  }
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { lang, slug: rawSlug } = await params
  const slug = decodeParam(rawSlug)
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const article = await getArticle(locale, slug)
  if (!article) notFound()

  const t = await getTranslations('article')
  const tList = await getTranslations('listing')

  const rubrique = findRubrique(article.rubrique)
  const sous =
    rubrique && article.sousRubrique
      ? findSousRubrique(rubrique, article.sousRubrique)
      : undefined

  const image = resolveMedia(article.image, article.slug, 'feature', locale)
  const related = await getRelated(locale, article, 3)

  const crumbs: Crumb[] = [
    { label: locale === 'fr' ? 'Accueil' : 'الرئيسية', href: links.home(locale) },
    ...(rubrique
      ? [{ label: rubrique.label[locale], href: links.rubrique(locale, rubrique) }]
      : []),
    ...(rubrique && sous
      ? [
          {
            label: sous.label[locale],
            href: links.sousRubrique(locale, rubrique, sous),
          },
        ]
      : []),
    { label: article.title },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    inLanguage: locale,
    image: [absolute(image.src)],
    author: article.author
      ? { '@type': 'Person', name: article.author.name }
      : { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: absolute(links.article(locale, slug)),
    // Free access, always — règle d'or #1.
    isAccessibleForFree: true,
  }

  return (
    <main id="contenu" className="container">
      <Breadcrumbs items={crumbs} locale={locale} siteUrl={absolute('')} />

      {/* Espace publicitaire en colonne de droite, le long de l'article. */}
      <div className="with-rail">
        <article className={styles.article}>
          <header className={styles.header}>
            <p className={styles.format}>
              {FORMAT_LABELS[article.format][locale]}
              {sous ? <span className={styles.sous}>{sous.label[locale]}</span> : null}
            </p>

            <h1 className={styles.title}>{article.title}</h1>

            {article.excerpt ? <p className={styles.standfirst}>{article.excerpt}</p> : null}

            <p className={styles.byline}>
              {article.author ? (
                <>
                  <span className={styles.by}>{t('by')}</span>{' '}
                  <a className={styles.author} href={links.auteur(locale, article.author.slug)}>
                    {article.author.name}
                  </a>
                </>
              ) : null}
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, locale)}</time>
              <span>{t('readingTime', { minutes: article.readingMinutes })}</span>
            </p>
          </header>

          <figure className={styles.figure}>
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(max-width: 1000px) 100vw, 900px"
              priority
              className={styles.image}
            />
            <figcaption className={styles.caption}>
              <span>{image.alt}</span>
              {isPlaceholder(image) ? (
                <span className={styles.credit}>
                  {locale === 'fr' ? 'Image à remplacer' : 'صورة مؤقتة'}
                </span>
              ) : image.credit ? (
                <span className={styles.credit}>
                  {locale === 'fr' ? 'Photo d’illustration' : 'صورة توضيحية'} · {image.credit}
                </span>
              ) : null}
            </figcaption>
          </figure>

          <div className={styles.body}>
            <Prose blocks={article.body} />

            {article.dossier ? (
              <p className={styles.dossier}>
                {locale === 'fr' ? 'Cet article fait partie du dossier' : 'يندرج هذا المقال ضمن ملف'}{' '}
                <a href={links.dossier(locale, article.dossier.slug)}>{article.dossier.title}</a>
              </p>
            ) : null}

            {article.tags.length > 0 ? (
              <div className={styles.tags}>
                <h2 className={styles.asideTitle}>{locale === 'fr' ? 'Mots-clés' : 'الكلمات المفتاحية'}</h2>
                <ul className={styles.tagList}>
                  {article.tags.map((tag) => (
                    <li key={tag.slug}>
                      <a className={styles.tag} href={links.tag(locale, tag.slug)}>
                        {tag.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Entity rail — the SEO moat: every article feeds its hubs (CLAUDE.md §5). */}
          {article.entities.length > 0 ? (
            <aside className={styles.entities} aria-label={t('inThisArticle')}>
              <h2 className={styles.asideTitle}>{t('inThisArticle')}</h2>
              <ul className={styles.entityList}>
                {article.entities.map((entity) => (
                  <li key={`${entity.kind}-${entity.slug}`}>
                    <a
                      className={styles.entity}
                      href={links.entity(locale, entity.kind, entity.slug)}
                    >
                      <span className={styles.entityKind}>{ENTITY_LABELS[entity.kind][locale]}</span>
                      <span className={styles.entityName}>{entity.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
        </article>

        <AdRail locale={locale} />
      </div>

      {related.length > 0 ? (
        <section className={styles.related} aria-label={t('alsoRead')}>
          <SectionHeading title={t('alsoRead')} accent />
          <div className={styles.relatedGrid}>
            {related.map((item) => (
              <ArticleCard key={item.id} article={item} locale={locale} variant="standard" />
            ))}
          </div>
        </section>
      ) : (
        <p className="visually-hidden">{tList('empty')}</p>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  )
}
