import type { Access, FieldAccess } from 'payload'

/**
 * Reusable Payload access controls.
 *
 * Imported RELATIVELY from `collections/*` (règle d'or #5). Expanded in Lot 2
 * when the remaining collections land; the role vocabulary is already final.
 */

export const ROLES = [
  'admin',
  'redacteur-en-chef',
  'journaliste',
  'contributeur',
  'abonne',
] as const

export type Role = (typeof ROLES)[number]

/** Roles allowed into the Payload admin panel at all. */
export const STAFF_ROLES: readonly Role[] = [
  'admin',
  'redacteur-en-chef',
  'journaliste',
  'contributeur',
]

/** Roles allowed to create and edit editorial content. */
export const EDITORIAL_ROLES: readonly Role[] = ['admin', 'redacteur-en-chef', 'journaliste']

type MaybeUser = { role?: Role | null } | null | undefined

const roleOf = (user: MaybeUser): Role | undefined => user?.role ?? undefined

const hasRole = (user: MaybeUser, roles: readonly Role[]): boolean => {
  const role = roleOf(user)
  return role !== undefined && roles.includes(role)
}

/** Anyone may read. Used for published editorial content. */
export const publicRead: Access = () => true

export const isAdmin: Access = ({ req }) => roleOf(req.user as MaybeUser) === 'admin'

export const isEditorial: Access = ({ req }) => hasRole(req.user as MaybeUser, EDITORIAL_ROLES)

export const isStaff: Access = ({ req }) => hasRole(req.user as MaybeUser, STAFF_ROLES)

/**
 * Contributors may create drafts but never publish or delete; the editorial
 * roles above own the publish button.
 */
export const canCreateContent: Access = ({ req }) => hasRole(req.user as MaybeUser, STAFF_ROLES)

/** A user may read/update their own record; admins may touch any. */
export const adminOrSelf: Access = ({ req }) => {
  const user = req.user as (MaybeUser & { id?: string | number }) | null
  if (!user) return false
  if (roleOf(user) === 'admin') return true
  return { id: { equals: user.id } }
}

/**
 * Strict boolean — Payload's `admin.access` must not return a Where clause.
 * Keeps `abonne` (newsletter/free account holders) out of the CMS entirely.
 */
export const staffAdminPanel = ({ req }: { req: { user?: unknown } }): boolean =>
  hasRole(req.user as MaybeUser, STAFF_ROLES)

/** Only an admin may change a role — prevents privilege escalation via the form. */
export const adminFieldOnly: FieldAccess = ({ req }) => roleOf(req.user as MaybeUser) === 'admin'
