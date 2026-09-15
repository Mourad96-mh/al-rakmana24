import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './payload-theme.css'

/**
 * Root layout for the offline previews.
 *
 * The (frontend) and (payload) route groups each own their own <html>/<body>;
 * this is a third, deliberately minimal one. It imports NEITHER globals.css nor
 * @payloadcms/next/css: the point of these pages is to render admin components
 * outside the admin, without a database — pulling in Payload's stylesheet would
 * drag in the whole admin runtime and put us back where we started.
 */
export const metadata: Metadata = {
  title: 'Aperçu — Al-Raqmana24',
  robots: { index: false, follow: false },
}

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      {/* suppressHydrationWarning: browser extensions inject attributes on <body>
          (ColorZilla's cz-shortcut-listen, Grammarly's data-gr-*). Same reason
          as the (frontend) layout. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
