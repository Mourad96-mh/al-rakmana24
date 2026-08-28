import createMiddleware from 'next-intl/middleware'
import { routing } from './lib/i18n/routing'

export default createMiddleware(routing)

export const config = {
  /**
   * Everything EXCEPT:
   *   admin, api        -> Payload owns these; locale-prefixing them breaks the CMS
   *   _next, _vercel    -> framework internals
   *   media             -> uploaded files
   *   *.*               -> static assets (favicon, og images, fonts...)
   *
   * Note: the middleware only rewrites the locale prefix. It does NOT opt pages
   * into dynamic rendering — pages stay SSG/ISR as long as they call
   * `setRequestLocale` (règle d'or #4).
   */
  matcher: ['/((?!api|admin|_next|_vercel|media|.*\\..*).*)'],
}
