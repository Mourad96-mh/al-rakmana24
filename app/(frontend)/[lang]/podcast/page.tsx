import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { listPodcasts } from '@/lib/queries'
import { absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { PodcastCard } from '@/components/PodcastCard/PodcastCard'
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

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) return {}

  const t = await getTranslations({ locale: lang, namespace: 'nav' })

  return {
    title: t('podcast'),
    alternates: {
      canonical: absolute(links.podcastIndex(lang as AppLocale)),
      languages: languageAlternates(routing.locales, (l) => links.podcastIndex(l as AppLocale)),
    },
  }
}

export default async function PodcastIndex({ params }: { params: Params }) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const t = await getTranslations('nav')
  const tList = await getTranslations('listing')
  const episodes = await listPodcasts(locale)

  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[
          { label: locale === 'fr' ? 'Accueil' : 'الرئيسية', href: links.home(locale) },
          { label: t('podcast') },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader
        kicker={locale === 'fr' ? 'Le podcast' : 'البودكاست'}
        title={t('podcast')}
        intro={
          locale === 'fr'
            ? 'Un entretien par quinzaine avec celles et ceux qui font le numérique marocain : juristes, fondateurs, investisseurs.'
            : 'حوار كل أسبوعين مع من يصنعون الرقمنة بالمغرب: حقوقيون ومؤسسون ومستثمرون.'
        }
      />

      <div className="page-body">
        {/* Shown only while NO episode has a player — the audio host is the
            client's choice (Lot 5). The day the first embed URL is entered in
            the back-office this notice disappears on its own, instead of
            staying on the page contradicting the episodes underneath it. */}
        {episodes.length > 0 && episodes.every((episode) => !episode.hasAudio) ? (
          <p className={styles.notice}>
            {locale === 'fr'
              ? 'Aucun enregistrement n’est encore disponible : le lecteur audio sera ajouté une fois la plateforme d’hébergement choisie. Les notes d’épisode, elles, sont bien là.'
              : 'لا يتوفر أي تسجيل بعد: سيضاف مشغل الصوت بمجرد اختيار منصة الاستضافة. أما ملاحظات الحلقات فهي متاحة.'}
          </p>
        ) : null}

        {episodes.length === 0 ? (
          <p className={styles.empty}>{tList('empty')}</p>
        ) : (
          <div className={styles.grid}>
            {episodes.map((episode) => (
              <PodcastCard key={episode.id} episode={episode} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
