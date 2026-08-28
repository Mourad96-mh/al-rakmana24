import type { ImageRef } from './content-types'

/**
 * The single seam between "an article has an image" and "which file do we serve".
 *
 * Components must never build an image path themselves — they call
 * `resolveMedia()`. Today it falls back to the generated placeholders in
 * public/placeholders/; once the newsroom uploads real photography through
 * /admin, Payload's Media document wins and NOTHING in the components changes.
 */

const PLACEHOLDER_VARIANTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] as const

export type MediaSize = 'feature' | 'card' | 'thumb'

const DIMENSIONS: Record<MediaSize, { width: number; height: number }> = {
  feature: { width: 1200, height: 675 },
  card: { width: 768, height: 512 },
  thumb: { width: 400, height: 300 },
}

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
  const { width, height } = DIMENSIONS[size]
  return {
    src: `/placeholders/${variantFor(key)}-${size}.jpg`,
    alt: '',
    width,
    height,
  }
}

/**
 * An upstream image may arrive without dimensions (a Payload upload whose
 * rendition metadata has not been generated yet), hence the optional fields.
 */
export type ImageInput = Partial<ImageRef> & { src?: string }

/**
 * @param image  the article's own image, when it has one
 * @param key    stable identity (article id or slug) used to pick a placeholder
 * @param size   which rendition the slot needs
 */
export function resolveMedia(
  image: ImageInput | undefined,
  key: string,
  size: MediaSize,
): ImageRef {
  if (!image?.src) return placeholderFor(key, size)

  const fallback = DIMENSIONS[size]
  return {
    src: image.src,
    alt: image.alt ?? '',
    // The image's own dimensions win; the rendition defaults only fill gaps.
    width: image.width ?? fallback.width,
    height: image.height ?? fallback.height,
    credit: image.credit,
  }
}

/** True when the resolved image is a placeholder — lets the UI mark it as such. */
export const isPlaceholder = (image: ImageRef): boolean =>
  image.src.startsWith('/placeholders/')
