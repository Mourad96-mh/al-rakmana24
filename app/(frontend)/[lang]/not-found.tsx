import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { RUBRIQUES } from '@/lib/rubriques'
import { encodeParam } from '@/lib/params'
import { routing } from '@/lib/i18n/routing'
import styles from './not-found.module.css'

/**
 * 404 inside the [lang] segment.
 *
 * Next does not pass params to not-found.tsx, so the locale is unknown here.
 * Rather than guess it — and rather than opt the tree into dynamic rendering by
 * reading headers — the page is rendered BILINGUALLY. That is also the honest
 * answer for a bilingual site: whichever half of it the reader came from, the
 * way back is on the page.
 *
 * The most common reason a reader lands here is règle d'or #2: an article that
 * exists in one language and genuinely not in the other. The copy says so.
 */
export default async function NotFound() {
  const fr = await getTranslations({ locale: routing.defaultLocale, namespace: 'error' })
  const ar = await getTranslations({ locale: 'ar', namespace: 'error' })

  return (
    <main id="contenu" className={`container ${styles.wrap}`}>
      <p className={styles.code}>404</p>

      <section className={styles.side} lang="fr" dir="ltr">
        <h1 className={styles.title}>{fr('notFoundTitle')}</h1>
        <p className={styles.body}>{fr('notFoundBody')}</p>
        <p className={styles.body}>
          Si vous cherchiez un article en français, il est possible qu’il n’existe qu’en arabe :
          nous ne publions pas de traduction automatique.
        </p>
        <Link className={styles.cta} href="/fr">
          {fr('backHome')}
        </Link>
        <ul className={styles.links}>
          {RUBRIQUES.map((r) => (
            <li key={r.value}>
              <Link href={`/fr/${r.slug.fr}`}>{r.label.fr}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.side} lang="ar" dir="rtl">
        <h1 className={styles.title}>{ar('notFoundTitle')}</h1>
        <p className={styles.body}>{ar('notFoundBody')}</p>
        <p className={styles.body}>
          إذا كنتم تبحثون عن مقال بالعربية، فقد يكون متوفرا بالفرنسية فقط: نحن لا ننشر ترجمة آلية.
        </p>
        <Link className={styles.cta} href="/ar">
          {ar('backHome')}
        </Link>
        <ul className={styles.links}>
          {RUBRIQUES.map((r) => (
            <li key={r.value}>
              <Link href={`/ar/${encodeParam(r.slug.ar)}`}>{r.label.ar}</Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
