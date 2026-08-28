import type { Locale } from './rubriques'

/**
 * Dates use the Moroccan locale in both languages (fr-MA / ar-MA) and are always
 * rendered on the server from an ISO string, so SSG output is deterministic and
 * hydration cannot mismatch.
 *
 * Arabic uses `ar-MA`, which yields Western digits and Gregorian months as used
 * by the Moroccan press — not the Eastern-Arabic numerals of `ar-EG`.
 */

const TZ = 'Africa/Casablanca'

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ,
  }).format(new Date(iso))
}

export function formatTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
    hour12: false,
  }).format(new Date(iso))
}

/** Short form for dense lists: "28 août" / "28 غشت". */
export function formatDayMonth(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', {
    day: 'numeric',
    month: 'short',
    timeZone: TZ,
  }).format(new Date(iso))
}

/**
 * Relative age for the news ticker, computed against a caller-supplied `now` so
 * the value is stable inside one render pass.
 */
export function formatRelative(iso: string, locale: Locale, now: Date): string {
  const diffMs = now.getTime() - new Date(iso).getTime()
  const minutes = Math.round(diffMs / 60_000)
  const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', {
    numeric: 'auto',
  })

  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-Math.round(hours / 24), 'day')
}
