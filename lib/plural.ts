import type { Locale } from './rubriques'

/**
 * Counted nouns, in both languages.
 *
 * French has two forms. Arabic has six categories and the *noun* changes with
 * them, not just an ending: مقال واحد / مقالان / 5 مقالات / 30 مقالا. Writing
 * `${n} مقال` — the obvious port of the French — is wrong for every n except 1,
 * and reads as broken Arabic rather than as a typo.
 *
 * Only the four categories the site can actually produce are modelled: `zero` is
 * never rendered (an empty list shows an empty-state sentence instead), and the
 * fractional `other` cannot occur for a count of items.
 */

export interface ArabicForms {
  /** n = 1 — the whole phrase, since Arabic drops the numeral here. */
  one: string
  /** n = 2 — likewise: the dual is carried by the noun. */
  two: string
  /** n % 100 in 3–10 — plural noun, numeral kept. */
  few: string
  /** everything else (11–99, 100+) — singular noun, numeral kept. */
  many: string
}

export interface FrenchForms {
  one: string
  other: string
}

export function countLabel(
  count: number,
  locale: Locale,
  forms: { fr: FrenchForms; ar: ArabicForms },
): string {
  if (locale === 'fr') {
    return `${count} ${count > 1 ? forms.fr.other : forms.fr.one}`
  }

  const { one, two, few, many } = forms.ar
  if (count === 1) return one
  if (count === 2) return two

  const mod100 = count % 100
  return mod100 >= 3 && mod100 <= 10 ? `${count} ${few}` : `${count} ${many}`
}

/** "3 articles" / "3 مقالات" — used by every hub, dossier and author page. */
export const articleCount = (count: number, locale: Locale): string =>
  countLabel(count, locale, {
    fr: { one: 'article', other: 'articles' },
    ar: { one: 'مقال واحد', two: 'مقالان', few: 'مقالات', many: 'مقالا' },
  })

/** "2 résultats" / "نتيجتان" — the search island. */
export const resultCount = (count: number, locale: Locale): string =>
  countLabel(count, locale, {
    fr: { one: 'résultat', other: 'résultats' },
    ar: { one: 'نتيجة واحدة', two: 'نتيجتان', few: 'نتائج', many: 'نتيجة' },
  })
