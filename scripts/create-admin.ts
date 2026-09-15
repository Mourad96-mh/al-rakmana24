/**
 * Crée le premier compte administrateur, hors du navigateur.
 *
 *     pnpm create-admin
 *
 * WHY THIS EXISTS. Payload serves `/admin/create-first-user` for as long as the
 * `users` collection is empty. On a laptop that is harmless. On a deployed site
 * it is a window in which the first stranger to find `/admin` owns the
 * newsroom — and "create the account quickly after deploying" is a habit, not a
 * control. Run this as a deployment step, before DNS points at the box, and the
 * screen never appears.
 *
 * Modelled on the same idea as `pour-bebe/pourbebe-backend/src/create-admin.js`
 * — the admin is created by an operator, never through a public form — with the
 * credentials moved out of the source file and into the environment.
 *
 * IDEMPOTENT, and safe to run on every deploy:
 *   - no user with that e-mail  -> creates it
 *   - the e-mail exists         -> leaves it alone, never rewrites the password
 *   - other users already exist -> refuses to create a second bootstrap admin
 *
 * It deliberately does NOT reset an existing password: a script that silently
 * rewrites credentials on every deploy is a worse problem than the one it
 * solves. Use the admin UI, or Payload's forgot-password flow, for that.
 */

import { getPayload } from 'payload'
import config from '../payload.config'

const EMAIL = process.env.ADMIN_EMAIL
const PASSWORD = process.env.ADMIN_PASSWORD
const NOM = process.env.ADMIN_NOM ?? 'Administrateur'

function fail(message: string): never {
  console.error(`\n[create-admin] ${message}\n`)
  process.exit(1)
}

if (!EMAIL || !PASSWORD) {
  fail(
    'ADMIN_EMAIL et ADMIN_PASSWORD sont requis.\n' +
      '  Exemple :\n' +
      '    ADMIN_EMAIL=redaction@al-raqmana24.ma ADMIN_PASSWORD="..." pnpm create-admin',
  )
}

/**
 * Payload enforces its own minimum, but 8 characters on an internet-facing CMS
 * with no second factor is not a password — it is a formality.
 */
if (PASSWORD.length < 12) {
  fail('ADMIN_PASSWORD doit faire au moins 12 caractères.')
}

const payload = await getPayload({ config })

const existing = await payload.find({
  collection: 'users',
  where: { email: { equals: EMAIL.toLowerCase() } },
  limit: 1,
  depth: 0,
  overrideAccess: true,
})

if (existing.docs.length > 0) {
  const found = existing.docs[0] as unknown as { role?: string }
  console.log(`[create-admin] ${EMAIL} existe déjà (rôle : ${found.role ?? '?'}). Rien à faire.`)
  console.log('[create-admin] Le mot de passe n’est jamais réécrit par ce script.')
  process.exit(0)
}

/**
 * If the collection already has members, this is no longer a bootstrap — it is
 * an ordinary account creation, and it belongs in the admin UI where it is
 * audited and where someone chooses the role on purpose.
 */
const total = await payload.find({
  collection: 'users',
  limit: 1,
  depth: 0,
  pagination: false,
  overrideAccess: true,
})

if (total.docs.length > 0) {
  fail(
    `La collection « users » n’est pas vide et ${EMAIL} n’y figure pas.\n` +
      '  Créez ce compte depuis /admin (Administration > Utilisateurs), pour que\n' +
      '  le rôle soit choisi explicitement et que la création soit tracée.',
  )
}

await payload.create({
  collection: 'users',
  data: { email: EMAIL.toLowerCase(), password: PASSWORD, nom: NOM, role: 'admin' },
  overrideAccess: true,
})

console.log(`\n[create-admin] Compte administrateur créé.`)
console.log(`  E-mail : ${EMAIL.toLowerCase()}`)
console.log(`  Nom    : ${NOM}`)
console.log(`  Rôle   : admin`)
console.log(`\n  Le mot de passe n’est pas réaffiché ici — il vient de votre environnement.`)
console.log(`  /admin/create-first-user ne s’affichera plus.\n`)

process.exit(0)
