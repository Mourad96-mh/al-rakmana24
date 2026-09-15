import type { Access, CollectionBeforeChangeHook, FieldAccess, Field, Where } from 'payload'

/**
 * Reusable Payload access controls.
 *
 * Imported RELATIVELY from `collections/*` and `fields/*` (règle d'or #5).
 *
 * The model in one sentence: **staff read everything, the public reads what is
 * published, and a `contributeur` can write drafts but can never publish, never
 * touch someone else's work, and never delete.**
 */

/**
 * The roles of the NEWSROOM. Every one of them is staff.
 *
 * `abonne` used to be the fifth entry here, and its removal is the point of the
 * split: readers now live in their own auth collection (`collections/Abonnes`),
 * which the admin panel does not authenticate against at all. A reader is no
 * longer "a user with the weakest role" — they are not a user of this system.
 *
 * The practical consequence: `req.user` on a public request is an Abonne, which
 * has no `role` at all, so every helper below fails closed on it.
 */
export const ROLES = [
  'admin',
  'redacteur-en-chef',
  'journaliste',
  'contributeur',
] as const

export type Role = (typeof ROLES)[number]

/**
 * Roles allowed into the Payload admin panel at all.
 *
 * Identical to ROLES since the split — kept as its own export because the two
 * answer different questions ("what roles exist" vs "who gets the back-office")
 * and will diverge the moment a non-staff staff role appears.
 */
export const STAFF_ROLES: readonly Role[] = [
  'admin',
  'redacteur-en-chef',
  'journaliste',
  'contributeur',
]

/** Roles allowed to create and edit editorial content. */
export const EDITORIAL_ROLES: readonly Role[] = ['admin', 'redacteur-en-chef', 'journaliste']

type MaybeUser = { role?: Role | null; id?: string | number } | null | undefined

const roleOf = (user: MaybeUser): Role | undefined => user?.role ?? undefined

const hasRole = (user: MaybeUser, roles: readonly Role[]): boolean => {
  const role = roleOf(user)
  return role !== undefined && roles.includes(role)
}

const userOf = (req: { user?: unknown }): MaybeUser => req.user as MaybeUser

/** Anyone may read. Used for published editorial content. */
export const publicRead: Access = () => true

export const isAdmin: Access = ({ req }) => roleOf(userOf(req)) === 'admin'

export const isEditorial: Access = ({ req }) => hasRole(userOf(req), EDITORIAL_ROLES)

export const isStaff: Access = ({ req }) => hasRole(userOf(req), STAFF_ROLES)

/** A contributor: may draft, may not publish. */
export const isContributeur = (user: MaybeUser): boolean => roleOf(user) === 'contributeur'

/**
 * `isEditorial`, for `admin.hidden`.
 *
 * Payload hands `admin.hidden` the raw user, not an access-control `req`, so
 * the `Access` helpers above do not fit its signature — hence this twin.
 *
 * Use it to keep a collection out of a sidebar it has no business in. It is
 * COSMETIC: hiding a nav entry is not access control, and on `Publicites`
 * (whose `read` is public, because the site itself fetches the creatives
 * unauthenticated) it is *only* cosmetic. Every collection that hides itself
 * must still be refused by its `access` block.
 */
export const isEditorialUser = (user: unknown): boolean =>
  hasRole(user as MaybeUser, EDITORIAL_ROLES)

/**
 * Contributors may create drafts but never publish or delete; the editorial
 * roles above own the publish button.
 */
export const canCreateContent: Access = ({ req }) => hasRole(userOf(req), STAFF_ROLES)

/**
 * Read access for a collection with drafts enabled.
 *
 * Anonymous visitors and logged-in Abonnés see published documents only. Staff
 * see drafts too, which is what makes Payload's live preview and the admin list
 * view work.
 *
 * An Abonné carries no `role`, so it takes the public branch here without any
 * special case — the split does the work that an `abonne` role used to do.
 *
 * NOTE: this returns a Where clause rather than `false` for the public, so the
 * public REST/GraphQL API stays usable — the site itself is a consumer of it.
 */
export const readPublished: Access = ({ req }) => {
  if (hasRole(userOf(req), STAFF_ROLES)) return true
  return { _status: { equals: 'published' } }
}

/**
 * Update access for a collection with drafts enabled.
 *
 * A contributor is confined to their own unpublished work. Once a document is
 * published, it leaves their hands entirely — reopening it is an editor's call.
 */
export const canUpdateContent: Access = ({ req }) => {
  const user = userOf(req)
  if (hasRole(user, EDITORIAL_ROLES)) return true
  if (isContributeur(user) && user?.id !== undefined) {
    const own: Where = { creePar: { equals: user.id } }
    const unpublished: Where = { _status: { not_equals: 'published' } }
    return { and: [own, unpublished] }
  }
  return false
}

/** Deleting published history is an editorial act. */
export const canDeleteContent: Access = isEditorial

/** A user may read/update their own record; admins may touch any. */
export const adminOrSelf: Access = ({ req }) => {
  const user = userOf(req)
  if (!user) return false
  if (roleOf(user) === 'admin') return true
  return { id: { equals: user.id } }
}

/**
 * Strict boolean — Payload's `admin.access` must not return a Where clause.
 *
 * Since the Users/Abonnes split this is the SECOND lock rather than the only
 * one: a reader's credentials are not accepted at /admin/login in the first
 * place, because that form authenticates against `admin.user` (= `users`) and
 * readers are not in it. This still guards the case that matters — a staff
 * account whose role was narrowed after it was created.
 */
export const staffAdminPanel = ({ req }: { req: { user?: unknown } }): boolean =>
  hasRole(userOf(req), STAFF_ROLES)

/** Only an admin may change a role — prevents privilege escalation via the form. */
export const adminFieldOnly: FieldAccess = ({ req }) => roleOf(userOf(req)) === 'admin'

/**
 * Records who first created a document.
 *
 * Read-only and hidden: it is authorization data, not editorial metadata. Its
 * only job is to give `canUpdateContent` something to compare a contributor
 * against. The byline shown to readers is the `auteurs` relationship, which is
 * a different thing entirely — a staff writer can file a piece on behalf of an
 * outside contributor and vice versa.
 */
export const createdByField = (): Field => ({
  name: 'creePar',
  type: 'relationship',
  relationTo: 'users',
  label: { fr: 'Créé par', ar: 'أنشأه' },
  access: {
    create: () => false,
    update: () => false,
  },
  admin: { readOnly: true, position: 'sidebar', hidden: true },
})

/**
 * Collection `beforeChange` hooks that back the two rules above.
 *
 * `enforceDraftForContributors` is the load-bearing one. Payload has no field
 * access control on `_status`, so without this a contributor could publish by
 * POSTing `{"_status":"published"}` straight to the REST API, bypassing the
 * admin UI's disabled button.
 */
export const stampCreator: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation !== 'create') return data
  const user = userOf(req)
  if (user?.id === undefined) return data
  return { ...data, creePar: user.id }
}

export const enforceDraftForContributors: CollectionBeforeChangeHook = ({ data, req }) => {
  if (!isContributeur(userOf(req))) return data
  return { ...data, _status: 'draft' }
}

/** The pair, in the order collections should apply them. */
export const editorialHooks = {
  beforeChange: [stampCreator, enforceDraftForContributors],
}
