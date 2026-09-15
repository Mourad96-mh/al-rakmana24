import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { listAuthors } from '@/lib/queries'
import { absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { AuthorCard } from '@/components/AuthorCard/AuthorCard'
import styles from './page.module.css'

export async function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

export const dynamicParams = false

type Params = Promise<{ lang: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) return {}

  const t = await getTranslations({ locale: lang, namespace: 'footer' })

  return {
    title: t('redaction'),
    alternates: {
      canonical: absolute(links.laRedaction(lang as AppLocale)),
      languages: languageAlternates(routing.locales, (l) => links.laRedaction(l as AppLocale)),
    },
  }
}

export default async function LaRedactionPage({ params }: { params: Params }) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const t = await getTranslations('footer')
  const authors = await listAuthors(locale)
  const fr = locale === 'fr'

  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[
          { label: fr ? 'Accueil' : 'الرئيسية', href: links.home(locale) },
          { label: t('redaction') },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader
        kicker={fr ? 'L’équipe' : 'الفريق'}
        title={t('redaction')}
        intro={
          fr
            ? 'Qui écrit quoi, et comment nous joindre. Chaque nom renvoie à l’ensemble des articles signés par cette personne.'
            : 'من يكتب ماذا، وكيف تتصلون بنا. يحيل كل اسم على جميع المقالات الموقعة من صاحبه.'
        }
      />

      <div className="page-body">
        <div className={styles.grid}>
          {authors.map((author) => (
            <AuthorCard
              key={author.id}
              author={author}
              locale={locale}
              bio={author.bio || undefined}
            />
          ))}
        </div>

        <section className={styles.charter}>
          <h2 className={styles.charterTitle}>
            {fr ? 'Nos engagements' : 'التزاماتنا'}
          </h2>
          <ul className={styles.charterList}>
            <li>
              {fr
                ? 'Les formats sont explicites : une actualité, une analyse et une tribune ne se lisent pas de la même manière, et chaque article annonce le sien.'
                : 'الصيغ معلنة: الخبر والتحليل والرأي لا تقرأ بالطريقة نفسها، وكل مقال يعلن صيغته.'}
            </li>
            <li>
              {fr
                ? 'Les tribunes n’engagent que leur auteur, ne sont jamais rémunérées, et les liens d’intérêt sont mentionnés.'
                : 'المقالات الرأي لا تلزم إلا أصحابها، ولا يؤدى عنها أبدا، وتذكر روابط المصلحة.'}
            </li>
            <li>
              {fr
                ? 'Une erreur factuelle est corrigée dans l’article, avec une mention datée. Nous ne dépublions pas.'
                : 'يصحح الخطأ الوقائعي داخل المقال مع إشارة مؤرخة. ولا نحذف المقالات.'}
            </li>
            <li>
              {fr
                ? 'Aucun contenu n’est réservé : pas d’abonnement payant, pas de compteur d’articles.'
                : 'لا محتوى محجوز: لا اشتراك مؤدى عنه ولا عداد للمقالات.'}
            </li>
          </ul>
          <p className={styles.charterContact}>
            <a href={links.nousContacter(locale)}>{t('contact')}</a>
          </p>
        </section>
      </div>
    </main>
  )
}
