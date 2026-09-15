import type { BodyBlock } from '@/lib/content-types'
import styles from './Prose.module.css'

/**
 * Renders a body. Deliberately a switch over a small block union rather than an
 * HTML string: nothing here can inject markup, and the same component will take
 * Payload's Lexical output in Lot 3 once it is mapped to these blocks.
 *
 * Measure is capped by `--measure`, which is narrower under `dir=rtl` — Arabic
 * needs fewer characters per line to read at the same comfort.
 */
export function Prose({ blocks }: { blocks: readonly BodyBlock[] }) {
  return (
    <div className={styles.prose}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading':
            return (
              <h2 key={i} className={styles.heading}>
                {block.text}
              </h2>
            )

          case 'quote':
            return (
              <figure key={i} className={styles.quote}>
                <blockquote className={styles.quoteText}>{block.text}</blockquote>
                {block.attribution ? (
                  <figcaption className={styles.attribution}>{block.attribution}</figcaption>
                ) : null}
              </figure>
            )

          case 'list':
            return (
              <ul key={i} className={styles.list}>
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )

          case 'callout':
            return (
              <aside key={i} className={styles.callout}>
                <p className={styles.calloutTitle}>{block.title}</p>
                <p className={styles.calloutText}>{block.text}</p>
              </aside>
            )

          default:
            return (
              <p key={i} className={styles.paragraph}>
                {block.text}
              </p>
            )
        }
      })}
    </div>
  )
}
