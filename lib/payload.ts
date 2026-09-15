import { cache } from 'react'
import { getPayload, type Payload } from 'payload'

import config from '../payload.config'

/**
 * The Payload Local API, for the frontend.
 *
 * The LOCAL API, not REST: the pages run inside the same Node process as
 * Payload (CLAUDE.md §8 — one service), so a query here is a function call and
 * a database round-trip, not an HTTP round-trip to ourselves. It also ignores
 * access control by default, which is what we want at build time — the
 * published-only filter is expressed in the queries, not borrowed from a
 * request that does not exist during `generateStaticParams`.
 *
 * `cache()` is React's per-render memo: two components asking for the client in
 * the same render get the same instance instead of two connection pools. It is
 * NOT a data cache — it does not memoize the queries themselves, only the
 * client. Page-level caching is Next's, via SSG/ISR (règle d'or #4).
 *
 * This file is NOT part of the `payload.config.ts` import graph — it imports
 * the config, not the other way round — so règle d'or #5 does not apply and
 * `@/*` would work here. It uses a relative path anyway, to keep every
 * config-adjacent import looking the same.
 */
export const getPayloadClient = cache(async (): Promise<Payload> => getPayload({ config }))
