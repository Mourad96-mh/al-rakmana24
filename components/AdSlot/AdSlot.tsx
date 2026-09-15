import Image from 'next/image'
import { getTranslations } from 'next-intl/server'

import type { Locale } from '@/lib/rubriques'
import * as links from '@/lib/links'
import { AD_FORMATS, getCreative, type AdFormat, type AdSlotId } from '@/lib/ads'
import styles from './AdSlot.module.css'

/**
 * One advertising slot: a labelled box whose height is reserved from the format,
 * so a banner arriving later never shifts the page (CLS).
 *
 * Server component — see lib/ads.ts for why it must stay one. It renders a plain
 * <div>: the surrounding <AdBand> / <AdRail> own the single ARIA landmark, since
 * one "complementary" region per banner is noise for a screen reader.
 */
export async function AdSlot({
  id,
  format,
  locale,
  sticky = false,
  className = '',
}: {
  id: AdSlotId
  format: AdFormat
  locale: Locale
  sticky?: boolean
  className?: string
}) {
  const t = await getTranslations('ads')
  const size = AD_FORMATS[format]
  const creative = getCreative(id, locale)

  return (
    <div
      className={[styles.slot, styles[format], sticky ? styles.sticky : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Required by the press code of conduct and by Google: paid space must be
          identified as such, above the creative, in the reader's language. */}
      <p className={styles.label}>{t('label')}</p>

      <div className={styles.frame}>
        {creative ? (
          <a
            className={styles.creative}
            href={creative.href}
            rel="sponsored noopener"
            target="_blank"
          >
            <Image
              src={creative.src}
              alt={creative.advertiser}
              width={size.width}
              height={size.height}
              className={styles.image}
            />
          </a>
        ) : (
          /* An unsold slot is an ad for the inventory itself. */
          <a className={styles.empty} href={links.nousContacter(locale)}>
            <span className={styles.emptyTitle}>{t('placeholder')}</span>
            <span className={styles.emptySize}>
              {size.width} × {size.height}
            </span>
            <span className={styles.emptyCta}>{t('cta')}</span>
          </a>
        )}
      </div>
    </div>
  )
}

/**
 * The top band: full-bleed strip, container-aligned leaderboard. Mounted once in
 * the layout as the first element of the page, above the masthead, so it appears
 * on every page.
 */
export async function AdBand({ locale }: { locale: Locale }) {
  const t = await getTranslations('ads')

  return (
    <aside className={styles.band} aria-label={t('label')}>
      <div className="container">
        <AdSlot id="header-leaderboard" format="leaderboard" locale={locale} />
      </div>
    </aside>
  )
}

/**
 * The right-hand rail: a pavé, then a sticky half-page that follows the reader
 * down the article. Second column of the global `.with-rail` grid; under 1100px
 * the rail drops below the content and the half-page is dropped entirely — a
 * 600px-tall banner at the bottom of a phone screen is inventory nobody buys.
 */
export async function AdRail({ locale }: { locale: Locale }) {
  const t = await getTranslations('ads')

  return (
    <aside className={styles.rail} aria-label={t('label')}>
      <AdSlot id="rail-top" format="rectangle" locale={locale} />
      <AdSlot
        id="rail-bottom"
        format="halfpage"
        locale={locale}
        sticky
        className={styles.railTall}
      />
    </aside>
  )
}
