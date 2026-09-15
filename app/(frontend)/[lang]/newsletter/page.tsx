import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { routing, type AppLocale } from '@/lib/i18n/routing'
import { absolute, languageAlternates } from '@/lib/site'
import * as links from '@/lib/links'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { NewsletterForm } from '@/components/NewsletterForm/NewsletterForm'
import styles from './page.module.css'

export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }))
}

export const dynamicParams = false

type Params = Promise<{ lang: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) return {}

  const t = await getTranslations({ locale: lang, namespace: 'newsletter' })

  return {
    title: t('title'),
    description: t('intro'),
    alternates: {
      canonical: absolute(links.newsletter(lang as AppLocale)),
      languages: languageAlternates(routing.locales, (l) => links.newsletter(l as AppLocale)),
    },
  }
}

/**
 * The only "subscription" the site has, and it is free (règle d'or #1 — the
 * client brief says « S'abonner gratuitement »). No checkout, no tier, no
 * metered access: this page must never grow a price.
 */
export default async function NewsletterPage({ params }: { params: Params }) {
  const { lang } = await params
  if (!hasLocale(routing.locales, lang)) notFound()
  setRequestLocale(lang)

  const locale = lang as AppLocale
  const t = await getTranslations('newsletter')
  const fr = locale === 'fr'

  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[
          { label: fr ? 'Accueil' : 'الرئيسية', href: links.home(locale) },
          { label: t('title') },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader kicker={fr ? 'Gratuit' : 'مجانا'} title={t('title')} intro={t('intro')} />

      <div className={`page-body ${styles.layout}`}>
        <div>
          <NewsletterForm locale={locale} />
        </div>

        <aside className={styles.aside}>
          <h2 className={styles.asideTitle}>{fr ? 'Ce que vous recevez' : 'ما ستتوصلون به'}</h2>
          <ul className={styles.list}>
            <li>
              {fr
                ? 'Un envoi par semaine, le lundi matin, en français ou en arabe selon la langue choisie.'
                : 'رسالة واحدة أسبوعيا صباح الاثنين، بالفرنسية أو بالعربية حسب اللغة المختارة.'}
            </li>
            <li>
              {fr
                ? 'Les articles marquants de la semaine, résumés en une ligne chacun.'
                : 'أبرز مقالات الأسبوع ملخصة في سطر واحد لكل مقال.'}
            </li>
            <li>
              {fr
                ? 'Les échéances réglementaires et les levées de fonds annoncées.'
                : 'الاستحقاقات التنظيمية وجولات التمويل المعلنة.'}
            </li>
          </ul>

          <h2 className={styles.asideTitle}>{fr ? 'Ce que nous ne faisons pas' : 'ما لا نفعله'}</h2>
          <ul className={styles.list}>
            <li>{fr ? 'Aucune revente d’adresse, jamais.' : 'لا بيع للعناوين إطلاقا.'}</li>
            <li>
              {fr
                ? 'Aucun contenu réservé aux abonnés : tout est déjà en accès libre sur le site.'
                : 'لا محتوى محجوز للمشتركين: كل شيء متاح بحرية على الموقع.'}
            </li>
            <li>
              {fr
                ? 'Désabonnement en un clic depuis chaque envoi, sans justification.'
                : 'إلغاء الاشتراك بنقرة واحدة من كل رسالة ودون تبرير.'}
            </li>
          </ul>

          <p className={styles.privacy}>
            <a href={links.confidentialite(locale)}>
              {fr ? 'Politique de confidentialité' : 'سياسة الخصوصية'}
            </a>
          </p>
        </aside>
      </div>
    </main>
  )
}
