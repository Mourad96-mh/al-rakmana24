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

/**
 * File size for a download link. The reader decides whether to tap a 12 MB PDF
 * on a mobile connection BEFORE tapping it, so this is never optional next to a
 * download button.
 *
 * Western digits in both locales, like the dates above (ar-MA).
 */
export function formatFileSize(bytes: number, locale: Locale): string {
  const nf = new Intl.NumberFormat(locale === 'ar' ? 'ar-MA' : 'fr-MA', {
    maximumFractionDigits: bytes >= 1_048_576 ? 1 : 0,
  })

  if (bytes >= 1_048_576) {
    return `${nf.format(bytes / 1_048_576)} ${locale === 'fr' ? 'Mo' : 'م.ب'}`
  }
  return `${nf.format(Math.max(1, Math.round(bytes / 1024)))} ${locale === 'fr' ? 'Ko' : 'ك.ب'}`
}

/** Runtime for a video thumbnail: 8:32. Seconds in, m:ss out. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
