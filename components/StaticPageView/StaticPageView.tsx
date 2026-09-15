import Image from 'next/image'
import type { ReactNode } from 'react'
import type { StaticPage } from '@/lib/content-types'
import { resolveMedia } from '@/lib/media'
import { absolute } from '@/lib/site'
import type { Locale } from '@/lib/rubriques'
import { Breadcrumbs } from '@/components/Breadcrumbs/Breadcrumbs'
import { PageHeader } from '@/components/PageHeader/PageHeader'
import { Prose } from '@/components/Prose/Prose'
import styles from './StaticPageView.module.css'

/**
 * Shared shell for the institutional pages (qui-sommes-nous, mentions légales…).
 * Each route file is then just "fetch the page, render it", which keeps the five
 * of them from drifting apart.
 */
export function StaticPageView({
  page,
  locale,
  children,
}: {
  page: StaticPage
  locale: Locale
  /** Extra content under the body — the newsletter form, a contact block… */
  children?: ReactNode
}) {
  const image = page.image ? resolveMedia(page.image, page.slug, 'feature', locale) : null

  return (
    <main id="contenu" className="container">
      <Breadcrumbs
        items={[
          { label: locale === 'fr' ? 'Accueil' : 'الرئيسية', href: `/${locale}` },
          { label: page.title },
        ]}
        locale={locale}
        siteUrl={absolute('')}
      />

      <PageHeader title={page.title} intro={page.intro} />

      <div className="page-body">
        {image ? (
          <figure className={styles.figure}>
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(max-width: 1000px) 100vw, 1000px"
              priority
              className={styles.image}
            />
          </figure>
        ) : null}

        <Prose blocks={page.body} />

        {children}
      </div>
    </main>
  )
}
