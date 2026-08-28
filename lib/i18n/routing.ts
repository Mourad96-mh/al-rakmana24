import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

/**
 * Bilingual routing. French is the default locale (the entire client brief is in
 * French); Arabic is a full first-class locale, not a translation layer.
 *
 * `localePrefix: 'always'` — /fr/... and /ar/... are both explicit. No bare
 * root URLs: an unprefixed URL is ambiguous for hreflang and for the editors.
 *
 * ⚠️ The Arabic pathnames below are PROVISIONAL, like the rubrique slugs in
 * `lib/rubriques.ts`. Validate with the client's Arabic editor before launch —
 * changing one afterwards costs a permanent redirect.
 *
 * Rubrique and sous-rubrique URLs are NOT listed here: they are dynamic
 * `[rubrique]` / `[sousRubrique]` segments whose per-locale slug lives in
 * `lib/rubriques.ts` and is resolved with `findRubriqueBySlug(slug, locale)`.
 * Next.js prioritises the static segments below over those dynamic ones.
 */
export const routing = defineRouting({
  locales: ['fr', 'ar'],
  defaultLocale: 'fr',
  localePrefix: 'always',
  localeDetection: true,

  pathnames: {
    '/': '/',

    // Editorial
    '/article/[slug]': { fr: '/article/[slug]', ar: '/مقال/[slug]' },
    '/podcast': { fr: '/podcast', ar: '/بودكاست' },
    '/podcast/[slug]': { fr: '/podcast/[slug]', ar: '/بودكاست/[slug]' },
    '/dossiers/[slug]': { fr: '/dossiers/[slug]', ar: '/ملفات/[slug]' },
    '/auteurs/[slug]': { fr: '/auteurs/[slug]', ar: '/محررون/[slug]' },
    '/tags/[slug]': { fr: '/tags/[slug]', ar: '/وسوم/[slug]' },

    // Entity hubs — the SEO moat (Lot 4)
    '/startups/[slug]': { fr: '/startups/[slug]', ar: '/شركات-ناشئة/[slug]' },
    '/entreprises/[slug]': { fr: '/entreprises/[slug]', ar: '/شركات/[slug]' },
    '/personnalites/[slug]': { fr: '/personnalites/[slug]', ar: '/شخصيات/[slug]' },
    '/textes-juridiques/[slug]': {
      fr: '/textes-juridiques/[slug]',
      ar: '/نصوص-قانونية/[slug]',
    },

    // Institutional
    '/qui-sommes-nous': { fr: '/qui-sommes-nous', ar: '/من-نحن' },
    '/la-redaction': { fr: '/la-redaction', ar: '/هيئة-التحرير' },
    '/nous-rejoindre': { fr: '/nous-rejoindre', ar: '/انضم-إلينا' },
    '/nous-contacter': { fr: '/nous-contacter', ar: '/اتصل-بنا' },
    '/newsletter': { fr: '/newsletter', ar: '/النشرة-البريدية' },
    '/recherche': { fr: '/recherche', ar: '/بحث' },

    // Free account (Lot 6) — noindex, no payment ever (règle d'or #1)
    '/connexion': { fr: '/connexion', ar: '/تسجيل-الدخول' },
    '/inscription': { fr: '/inscription', ar: '/إنشاء-حساب' },
    '/compte': { fr: '/compte', ar: '/حسابي' },
  },
})

export type AppLocale = (typeof routing.locales)[number]

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)

export const isRtl = (locale: string): boolean => locale === 'ar'
export const dirOf = (locale: string): 'rtl' | 'ltr' => (isRtl(locale) ? 'rtl' : 'ltr')
