import type { ArticleSummary } from '@/lib/content-types'
import type { Locale } from '@/lib/rubriques'
import { ArticleCard } from '@/components/ArticleCard/ArticleCard'
import styles from './ArticleGrid.module.css'

/**
 * The listing body used by every rubrique, tag, dossier, author and entity page.
 *
 * `lead` promotes the first article to the wide treatment, which is what stops a
 * listing from reading as an undifferentiated wall of equal cards. Turn it off
 * where the page already has a hero (an entity hub, for instance).
 */
export function ArticleGrid({
  articles,
  locale,
  emptyLabel,
  lead = true,
}: {
  articles: readonly ArticleSummary[]
  locale: Locale
  emptyLabel: string
  lead?: boolean
}) {
  if (articles.length === 0) {
    return <p className={styles.empty}>{emptyLabel}</p>
  }

  const [first, ...rest] = articles
  const promote = lead && articles.length > 2

  return (
    <div className={styles.wrap}>
      {promote ? (
        <div className={styles.lead}>
          <ArticleCard article={first} locale={locale} variant="lead" showExcerpt />
        </div>
      ) : null}

      <div className={styles.grid}>
        {(promote ? rest : articles).map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            locale={locale}
            variant="standard"
            showExcerpt
          />
        ))}
      </div>
    </div>
  )
}
