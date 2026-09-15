import type { ImageRef } from './content-types'
import type { Locale } from './rubriques'

/**
 * The single seam between "an article has an image" and "which file do we serve".
 *
 * Components must never build an image path themselves — they call
 * `resolveMedia()`. Two tiers, in order of precedence:
 *
 *   1. `src`  — a real upload: the Payload Media URL, served from Cloudinary.
 *   2. none   — the generated on-brand placeholder tile, so a slot with no
 *               image still reads as "art direction pending" rather than as a
 *               broken layout.
 *
 * There used to be a third tier between them, a key into a demo photo library
 * in `public/photos/`. It went with `lib/demo` at the end of Lot 3: every image
 * on the site is now an upload the newsroom made through /admin, and a second
 * source of pictures could only ever disagree with it.
 */

const PLACEHOLDER_VARIANTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] as const

export type MediaSize = 'feature' | 'card' | 'thumb' | 'portrait'

const DIMENSIONS: Record<MediaSize, { width: number; height: number }> = {
  feature: { width: 1200, height: 675 },
  card: { width: 768, height: 512 },
  thumb: { width: 400, height: 300 },
  portrait: { width: 480, height: 480 },
}

/** The placeholder generator only emits landscape tiles. */
const PLACEHOLDER_SIZES = new Set<MediaSize>(['feature', 'card', 'thumb'])

/**
 * Stable per-key variant choice: the same article always gets the same
 * placeholder, so the page does not reshuffle between renders (which would also
 * make every build produce different HTML).
 */
function variantFor(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  return PLACEHOLDER_VARIANTS[hash % PLACEHOLDER_VARIANTS.length]
}

export function placeholderFor(key: string, size: MediaSize): ImageRef {
  const tile: MediaSize = PLACEHOLDER_SIZES.has(size) ? size : 'thumb'
  return {
    src: `/placeholders/${variantFor(key)}-${tile}.jpg`,
    alt: '',
    ...DIMENSIONS[size],
  }
}

/**
 * An upstream image may arrive without dimensions (a Payload upload whose
 * rendition metadata has not been generated yet), hence the optional fields.
 */
export type ImageInput = Partial<ImageRef> & {
  src?: string
}

/**
 * @param image   the article's own image, when it has one
 * @param key     stable identity (article id or slug) used to pick a placeholder
 * @param size    which rendition the slot needs
 * @param locale  reader's locale — kept in the signature although only the
 *                placeholder path ignores it today, so a locale-aware default
 *                (an Arabic-lettered tile) does not have to touch 30 call sites
 */
export function resolveMedia(
  image: ImageInput | undefined,
  key: string,
  size: MediaSize,
  _locale: Locale,
): ImageRef {
  const fallback = DIMENSIONS[size]

  if (image?.src) {
    return {
      src: image.src,
      alt: image.alt ?? '',
      // The image's own dimensions win; the rendition defaults only fill gaps.
      width: image.width ?? fallback.width,
      height: image.height ?? fallback.height,
      credit: image.credit,
    }
  }

  return placeholderFor(key, size)
}

/** True when the resolved image is a placeholder — lets the UI mark it as such. */
export const isPlaceholder = (image: ImageRef): boolean =>
  image.src.startsWith('/placeholders/')
