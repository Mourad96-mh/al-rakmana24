import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { decodeParam } from '@/lib/params'
import { getPodcast, listPodcasts, podcastParams } from '@/lib/queries'
import { resolveMedia } from '@/lib/media'
import { formatDate } from '@/lib/format'
import { SITE_NAME, absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { Prose } from '@/components/Prose/Prose'
import { PodcastCard } from '@/components/PodcastCard/PodcastCard'
import { SectionHeading } from '@/components/SectionHeading/SectionHeading'
import { JsonLd } from '@/components/JsonLd/JsonLd'
import styles from './page.module.css'

export async function generateStaticParams() {
  return await podcastParams()
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

  const episode = await getPodcast(lang as AppLocale, slug)
  if (!episode) return {}

  return {
    title: episode.title,
    description: episode.excerpt,
    alternates: {
      canonical: absolute(links.podcast(lang as AppLocale, slug)),
      // Same rule as articles: only the locales the episode exists in.
      languages: languageAlternates(episode.locales, (l) => links.podcast(l as AppLocale, slug)),
    },
  }
}

export default async function PodcastEpisodePage({ params }: { params: Params }) {
  const { lang, slug: rawSlug } = await params
  const slug = decodeParam(rawSlug)
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const episode = await getPodcast(locale, slug)
  if (!episode) notFound()

  const t = await getTranslations('nav')
  const image = resolveMedia(episode.image, episode.slug, 'feature', locale)
  const others = (await listPodcasts(locale))
    .filter((e) => e.slug !== episode.slug)
    .slice(0, 3)

  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[
          { label: locale === 'fr' ? 'Accueil' : 'الرئيسية', href: links.home(locale) },
          { label: t('podcast'), href: links.podcastIndex(locale) },
          { label: episode.title },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <article className={styles.episode}>
        <header className={styles.header}>
          {episode.episode !== undefined ? (
            <p className={styles.kicker}>
              {locale === 'fr' ? `Épisode ${episode.episode}` : `الحلقة ${episode.episode}`}
            </p>
          ) : null}
          <h1 className={styles.title}>{episode.title}</h1>
          <p className={styles.standfirst}>{episode.excerpt}</p>
          <p className={styles.meta}>
            {episode.guest ? <span>{episode.guest}</span> : null}
            <time dateTime={episode.publishedAt}>{formatDate(episode.publishedAt, locale)}</time>
            {episode.duration !== undefined ? (
              <span>{locale === 'fr' ? `${episode.duration} min` : `${episode.duration} دقيقة`}</span>
            ) : null}
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
        </figure>

        {/* The host's player when the newsroom has entered its URL, an honest
            sentence when it has not. The audio is NEVER served from our origin
            (CLAUDE.md §6): the iframe points at Ausha / Acast, which owns the
            bandwidth, the RSS feed and the download statistics. */}
        {episode.embedUrl ? (
          <iframe
            className={styles.playerFrame}
            src={episode.embedUrl}
            title={
              locale === 'fr'
                ? `Lecteur audio — ${episode.title}`
                : `مشغل الصوت — ${episode.title}`
            }
            loading="lazy"
            allow="clipboard-write; autoplay"
          />
        ) : (
          <p className={styles.player}>
            {locale === 'fr'
              ? 'Lecteur audio à venir : aucun enregistrement n’est encore associé à cet épisode.'
              : 'مشغل الصوت قادم: لا يرتبط بهذه الحلقة أي تسجيل بعد.'}
          </p>
        )}

        <div className={styles.body}>
          <Prose blocks={episode.body} />
        </div>

        {/* Optional, and the only part of an episode a search engine can read —
            the audio is opaque to it. Collapsed so it does not bury the notes. */}
        {episode.transcript ? (
          <details className={styles.transcript}>
            <summary className={styles.transcriptSummary}>
              {locale === 'fr' ? 'Transcription de l’épisode' : 'تفريغ الحلقة'}
            </summary>
            <div className={styles.transcriptBody}>
              <Prose blocks={episode.transcript} />
            </div>
          </details>
        ) : null}
      </article>

      {others.length > 0 ? (
        <section className={styles.others} aria-label={t('podcast')}>
          <SectionHeading
            title={locale === 'fr' ? 'Autres épisodes' : 'حلقات أخرى'}
            href={links.podcastIndex(locale)}
            linkLabel={locale === 'fr' ? 'Tout voir' : 'عرض الكل'}
            accent
          />
          <div className={styles.othersGrid}>
            {others.map((item) => (
              <PodcastCard key={item.id} episode={item} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'PodcastEpisode',
          name: episode.title,
          description: episode.excerpt,
          episodeNumber: episode.episode,
          timeRequired: episode.duration ? `PT${episode.duration}M` : undefined,
          associatedMedia: episode.embedUrl
            ? { '@type': 'MediaObject', embedUrl: episode.embedUrl }
            : undefined,
          datePublished: episode.publishedAt,
          inLanguage: locale,
          partOfSeries: { '@type': 'PodcastSeries', name: `${SITE_NAME} — Podcast` },
        }}
      />

    </main>
  )
}
