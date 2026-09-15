import { v2 as cloudinary } from 'cloudinary'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'
import type { Plugin, UploadCollectionSlug } from 'payload'

/**
 * Cloudinary storage for Payload uploads.
 *
 * WHY THIS FILE EXISTS. Payload ships official adapters for S3, Azure, GCS and
 * Vercel Blob — not for Cloudinary. The two community packages are both dead
 * ends today: `payload-cloudinary` is still on Payload 2, and the maintained one
 * requires Payload 3.88 while this project is pinned at 3.85.1 (CLAUDE.md §2 —
 * that pin was paid for once already). So we sit on the OFFICIAL
 * `plugin-cloud-storage` and write the ~4 functions it asks for ourselves. No
 * unmaintained third party on the critical path of the client's media library.
 *
 * ⚠️ Imported by the Payload config graph — RELATIVE imports only (règle d'or #5).
 *
 * Two decisions worth knowing:
 *
 *  - `disablePayloadAccessControl` is ON. Images are served straight from
 *    Cloudinary's CDN instead of being proxied through our Node process. Media
 *    on this site is public (`publicRead`), and proxying every photograph
 *    through the app would waste the one thing the architecture is built to
 *    protect: a server that almost never runs.
 *
 *  - Payload keeps generating its own renditions (thumbnail / card / feature /
 *    wide, see collections/Media.ts) with sharp, and we upload each of them.
 *    Cloudinary could resize on the fly instead, but then every <Image> on the
 *    site would have to change. The renditions are already right; this stays a
 *    storage swap, not a rewrite.
 */

const FOLDER = process.env.CLOUDINARY_FOLDER ?? 'al-raqmana24'

/** Cloudinary splits its API by kind of asset, and the rules differ per kind. */
type ResourceType = 'image' | 'video' | 'raw'

const resourceTypeFor = (mimeType?: string | null): ResourceType => {
  if (mimeType?.startsWith('image/')) return 'image'
  if (mimeType?.startsWith('video/')) return 'video'
  // PDFs, Word, Excel, ZIP — everything the Fichiers collection accepts.
  return 'raw'
}

const stripExtension = (filename: string): string => filename.replace(/\.[^./]+$/, '')

/**
 * The Cloudinary id of a file.
 *
 * For an image the extension must NOT be part of the id: Cloudinary reads the
 * extension in the delivery URL as the format to convert to, so a public id of
 * `photo.jpg` would be looked up as `photo` and 404. For a raw file it is the
 * opposite — the extension belongs to the id, or the file comes back without one.
 */
const publicIdFor = (folder: string, filename: string, type: ResourceType): string => {
  const name = type === 'raw' ? filename : stripExtension(filename)
  return `${folder}/${name}`
}

const configured = (): boolean =>
  Boolean(
    process.env.CLOUDINARY_URL ??
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET),
  )

function configure(): void {
  // The SDK reads CLOUDINARY_URL on its own; the split variables are for hosts
  // whose UI dislikes a URL containing a secret.
  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    })
  } else {
    cloudinary.config({ secure: true })
  }
}

const cloudinaryAdapter =
  (): Adapter =>
  ({ collection, prefix }): GeneratedAdapter => {
    const folder = [FOLDER, prefix, collection.slug].filter(Boolean).join('/')

    return {
      name: 'cloudinary',

      onInit: () => {
        configure()
        if (!configured()) {
          // Loud, once, at boot — rather than a silent 500 the first time an
          // editor uploads a photograph.
          console.warn(
            '[cloudinary] Aucune configuration trouvée (CLOUDINARY_URL ou CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET). Les téléversements échoueront.',
          )
        }
      },

      handleUpload: async ({ data, file }) => {
        configure()
        const type = resourceTypeFor(file.mimeType)
        const publicId = publicIdFor(folder, file.filename, type)

        await new Promise<void>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                public_id: publicId,
                resource_type: type,
                // The filename IS the id: re-uploading the same name replaces
                // the file instead of silently creating `photo_a8f3d.jpg`, which
                // is how a media library becomes unusable.
                overwrite: true,
                unique_filename: false,
                use_filename: false,
                invalidate: true,
              },
              (error) => (error ? reject(error) : resolve()),
            )
            .end(file.buffer)
        })

        return data
      },

      handleDelete: async ({ doc, filename }) => {
        configure()
        const type = resourceTypeFor((doc as { mimeType?: string }).mimeType)
        await cloudinary.uploader.destroy(publicIdFor(folder, filename, type), {
          resource_type: type,
          invalidate: true,
        })
      },

      generateURL: ({ data, filename }) => {
        configure()
        const type = resourceTypeFor((data as { mimeType?: string } | undefined)?.mimeType)
        return cloudinary.url(publicIdFor(folder, filename, type), {
          resource_type: type,
          secure: true,
        })
      },

      /**
       * Only reached if Payload access control is re-enabled for a collection.
       * It streams the asset back rather than redirecting, so a future private
       * collection stays private instead of leaking a public CDN URL.
       */
      staticHandler: async (_req, { params }) => {
        configure()
        const type = resourceTypeFor(undefined)
        const url = cloudinary.url(publicIdFor(folder, params.filename, type), {
          resource_type: type,
          secure: true,
        })

        const upstream = await fetch(url)
        if (!upstream.ok) return new Response(null, { status: 404 })

        return new Response(upstream.body, {
          status: 200,
          headers: {
            'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })
      },
    }
  }

/**
 * @param collections upload-enabled collection slugs to store on Cloudinary
 */
export function cloudinaryStorage(collections: readonly UploadCollectionSlug[]): Plugin {
  return cloudStoragePlugin({
    collections: Object.fromEntries(
      collections.map((slug) => [
        slug,
        {
          adapter: cloudinaryAdapter(),
          disablePayloadAccessControl: true as const,
        },
      ]),
    ),
  })
}
