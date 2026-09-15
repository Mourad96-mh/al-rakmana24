import type { VideoProvider } from './content-types'

/**
 * Turns whatever the newsroom pastes into (provider, id).
 *
 * Editors paste what the browser gave them: a watch URL, a share URL, an embed
 * URL, sometimes with a timestamp or a playlist. Asking them to extract the id
 * by hand is how a video ends up broken on the homepage on a Friday evening —
 * so the parsing lives here, is used by the Payload hook at save time (the error
 * surfaces in the back-office, not on the site) and by the front-end mapper.
 *
 * ⚠️ Imported by the Payload config graph — RELATIVE imports only (règle d'or #5).
 */
export interface ParsedVideo {
  provider: VideoProvider
  videoId: string
}

const YOUTUBE_ID = /^[\w-]{11}$/
const VIMEO_ID = /^\d{6,}$/

export function parseVideoUrl(input: string): ParsedVideo | null {
  const raw = input.trim()
  if (!raw) return null

  // A bare id, pasted from the provider's own UI.
  if (YOUTUBE_ID.test(raw)) return { provider: 'youtube', videoId: raw }
  if (VIMEO_ID.test(raw)) return { provider: 'vimeo', videoId: raw }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '')
  const segments = url.pathname.split('/').filter(Boolean)

  if (host === 'youtu.be') {
    const id = segments[0] ?? ''
    return YOUTUBE_ID.test(id) ? { provider: 'youtube', videoId: id } : null
  }

  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    // /watch?v=ID · /embed/ID · /live/ID · /shorts/ID
    const fromQuery = url.searchParams.get('v') ?? ''
    if (YOUTUBE_ID.test(fromQuery)) return { provider: 'youtube', videoId: fromQuery }

    const last = segments[segments.length - 1] ?? ''
    return YOUTUBE_ID.test(last) ? { provider: 'youtube', videoId: last } : null
  }

  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = segments.find((s) => VIMEO_ID.test(s)) ?? ''
    return VIMEO_ID.test(id) ? { provider: 'vimeo', videoId: id } : null
  }

  return null
}
