import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from 'next-intl/plugin'

const projectRoot = dirname(fileURLToPath(import.meta.url))

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts')

const nextConfig: NextConfig = {
  // Pinned on purpose: without it Next walks up and picks the lockfile from the
  // parent home directory (C:\Users\MOURAD), which breaks output tracing.
  outputFileTracingRoot: projectRoot,

  // Self-contained server bundle for the Docker image (see Dockerfile). Opt-in
  // through the environment so the local Windows build — OneDrive, three
  // antivirus products — keeps the plain `.next` layout `next start` expects.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,

  reactStrictMode: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    // Les medias sont servis par Cloudinary (voir lib/cloudinary-storage.ts).
    // Sans cette autorisation, next/image refuse l'URL et la page casse.
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },

  // Payload's admin bundle is large and its generated types lag behind; keep the
  // frontend honest instead of loosening this.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
}

export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
