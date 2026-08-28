/**
 * Unicode-aware slugify — must work for BOTH French and Arabic.
 *
 * A stock Latin slugifier strips every non-ASCII byte, which turns an Arabic
 * headline into an empty string and then into a duplicate-key error. Arabic
 * articles get Arabic slugs on purpose: percent-encoded Unicode slugs index
 * fine and measurably out-click transliterated ones on Arabic SERPs.
 *
 * Dependency-free and imported RELATIVELY by the Payload field graph
 * (règle d'or #5).
 */

/** Tashkeel (harakat) + tatweel: cosmetic in Arabic, noise in a slug. */
const ARABIC_DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g

/** Latin combining marks left over from NFD decomposition (é -> e + U+0301). */
const COMBINING_MARKS = /[̀-ͯ]/g

/** Apostrophes and quotes: elide them so « l'innovation » -> « linnovation ». */
const ELISIONS = /['’‘`"“”]/g

/**
 * Characters we keep: ASCII alphanumerics, the Arabic letter blocks
 * (U+0621–U+063A hamza..ghain, U+0641–U+064A fa..ya, U+0671–U+06D3 extended)
 * and both digit sets. Everything else becomes a separator.
 */
const NON_SLUG = /[^a-z0-9ء-غف-ي٠-٩ٮ-ۓ۰-۹]+/g

/** Normalize the Arabic letter forms readers treat as interchangeable. */
function unifyArabic(input: string): string {
  return input
    .replace(/[آأإٱ]/g, 'ا') // آ أ إ ٱ -> ا
    .replace(/ى/g, 'ي') // ى -> ي
    .replace(/ة/g, 'ه') // ة -> ه
}

export function slugify(input: string): string {
  if (!input) return ''

  const withoutDiacritics = input.normalize('NFKC').replace(ARABIC_DIACRITICS, '')
  const unified = unifyArabic(withoutDiacritics)
  const deaccented = unified.normalize('NFD').replace(COMBINING_MARKS, '').normalize('NFC')

  return deaccented
    .toLowerCase()
    .replace(ELISIONS, '')
    .replace(NON_SLUG, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}
