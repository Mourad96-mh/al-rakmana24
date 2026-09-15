import { notFound } from 'next/navigation'

import { PreviewShell } from './PreviewShell'

/**
 * /apercu-admin — the newsroom dashboard's LAYOUT, rendered without Payload.
 *
 * Reason it exists: Payload refuses to boot without a MongoDB connection, so
 * while DATABASE_URI is empty nothing under /admin renders at all — not even
 * the markup. This page mounts the same `DashboardView` the admin mounts, with
 * sample counts, so the design can be reviewed and iterated on now.
 *
 * DEV ONLY. It is a scaffold, not a feature: once /admin runs, delete the
 * (preview) route group. Remove the guard below if you need to show it to the
 * client on a deployed URL — it stays noindex either way (see layout.tsx).
 */
export const dynamic = 'force-static'

export default function ApercuAdminPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <PreviewShell />
}
