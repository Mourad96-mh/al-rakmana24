import type { FieldHook, TextField } from 'payload'

// RELATIVE import — this file is in the payload.config.ts graph (règle d'or #5).
import { slugify } from '../lib/slugify'

/**
 * Localized, Unicode-aware slug.
 *
 * Two things make this different from the usual `slugField` snippet:
 *
 * 1. It is `localized: true`, and the source title is localized too. When the
 *    newsroom writes the Arabic version of an article, this hook receives the
 *    Arabic title and produces an ARABIC slug (percent-encoded in the URL) —
 *    that is deliberate, see /CLAUDE.md §5.
 *
 * 2. It returns `undefined` rather than `''` when it cannot derive anything.
 *    Partial translation is the normal case here (règle d'or #2): an FR-only
 *    article has no Arabic title, so it must have no Arabic slug. Postgres
 *    treats NULLs as distinct in a unique index, so many untranslated articles
 *    coexist; a batch of empty strings would collide on the second one.
 */

interface SlugFieldOptions {
  /** Field this slug is derived from when left blank. */
  from?: string
  name?: string
  required?: boolean
  unique?: boolean
  admin?: TextField['admin']
}

const deriveSlug =
  (from: string): FieldHook =>
  ({ data, originalDoc, value }) => {
    // An explicit value always wins, but is still normalized — an editor who
    // types a slug by hand must not be able to create a broken URL.
    if (typeof value === 'string' && value.trim().length > 0) {
      return slugify(value) || undefined
    }

    const source: unknown =
      data?.[from] ?? (originalDoc as Record<string, unknown> | undefined)?.[from]

    if (typeof source === 'string' && source.trim().length > 0) {
      return slugify(source) || undefined
    }

    // No title in this locale => no slug in this locale. Not an error.
    return undefined
  }

export const slugField = ({
  from = 'title',
  name = 'slug',
  required = false,
  unique = true,
  admin,
}: SlugFieldOptions = {}): TextField => ({
  name,
  type: 'text',
  localized: true,
  required,
  unique,
  index: true,
  label: { fr: 'Slug (URL)', ar: 'الرابط المختصر' },
  hooks: { beforeValidate: [deriveSlug(from)] },
  admin: {
    position: 'sidebar',
    description: {
      fr: 'Laisser vide : généré depuis le titre de CETTE langue. Une fois l’article en ligne, le modifier casse les liens existants.',
      ar: 'اتركه فارغا: يولد تلقائيا من عنوان هذه اللغة. تغييره بعد النشر يكسر الروابط القائمة.',
    },
    ...admin,
  },
})
