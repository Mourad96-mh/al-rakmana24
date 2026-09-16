# AL-RAQMANA24.ma — CLAUDE.md

Governing document for this repo. Read it before touching code.
Written in English (working language with the developer); **all user-facing copy,
client deliverables and editor documentation are in French / Arabic.**

---

## 1. What this is

**Al-Raqmana24.ma** — _Entreprendre, Innover, Digitaliser._
A Moroccan online journal covering the **digital economy, digital law, startups,
legaltech and fintech**. Bilingual **French + Arabic (RTL)**.

It is a **newsroom**, not a vitrine: editors publish several times a day and expect
their article to be live within seconds. Every architectural decision below serves
that loop.

Reference site: `jeuneafrique.com` — copy its **entity-hub taxonomy**, not its ad
density, not its paywall, not its three-column homepage.

Brand: logo is `<>` chevrons forming a globe in Moroccan red + green.
Tokens live in `app/globals.css` — never hardcode a colour in a component.

---

## 2. Stack — NON-NEGOTIABLE

| Layer           | Choice                                | Pin               |
| --------------- | ------------------------------------- | ----------------- |
| Framework       | Next.js 15, App Router                | `15.5.19`         |
| UI              | React 19                              | `19.x`            |
| Language        | TypeScript, `strict: true`            | —                 |
| CMS             | Payload 3, self-hosted, **same repo** | `3.85.1`          |
| DB              | MongoDB Atlas                         | —                 |
| Images          | sharp + Cloudinary (stockage)         | `0.34.5`          |
| Styling         | **Pure CSS Modules** + tokens         | no Tailwind, ever |
| i18n routing    | next-intl, localized pathnames        | —                 |
| Newsletter      | Brevo (behind a tolerant seam)        | —                 |
| Analytics       | Plausible                             | —                 |
| E2E             | Playwright                            | —                 |
| Package manager | pnpm                                  | `11.x`            |

**Why these exact pins** (learned the hard way on MCF News — do not "upgrade to latest"):

- `create-next-app@latest` installs Next 16 → **incompatible with Payload 3**.
- **DB switched from Postgres/Neon to MongoDB Atlas on 2026-09-05**, while the
  database was still empty and the change cost a single adapter swap — Payload
  derives the schema from the collections, so none of the 16 changed. The reason
  is maintenance, not performance: the developer already operates Atlas and
  Cloudinary daily, and Mongo removes the schema-migration step entirely. The
  same swap in six months, over a live archive, would have been a migration.
- **Uploads go to Cloudinary**, never to the application server: its disk is
  ephemeral on every host under consideration. Payload has no official
  Cloudinary adapter and both community packages are dead ends (one is on
  Payload 2, the other needs 3.88), so `lib/cloudinary-storage.ts` implements
  the official `plugin-cloud-storage` interface directly. Read it before
  touching anything upload-related.
- `sharp` 0.35 **breaks Payload's types**.
- Node here is 22.14, which breaks tsx's `require(ESM)` / top-level await →
  the Payload CLI must run with `--use-swc`.

---

## 3. Règles d'or

**#1 — No payment, no paywall.** The client brief says « S'abonner gratuitement ».
The `accessLevel` field exists but stays **dormant** — a seam for a possible
future, not a feature. Never build a checkout, never gate an article, never wire
CMI. If asked to "add subscriptions", it means _newsletter + free account_.

Display advertising is the exception, and it is **live**: the client asked for
« espaces publicitaires » in the header and in a right-hand rail (2026-09-05).
Ads sell space, they do not gate content — the rule above is untouched.
`components/AdSlot` renders every emplacement, `lib/ads.ts` holds the booked
creatives (empty for now → each slot shows a labelled placeholder linking to
« Nous contacter »). Slots stay **server-rendered**: the reserved box is what
keeps CLS at zero and the pages SSG. A future ad server / personalised creative
must be a client island mounted _inside_ that box, never a `cookies()` read.

**#2 — `localization.fallback` is `false`. Never turn it on.**
With fallback enabled, an untranslated Arabic article silently renders in French
and Google indexes a broken page. Off, it 404s — which is correct.
Consequence: **partial translation is the normal case.** An article may be FR-only,
AR-only, or both. Therefore:

- every listing query filters to articles that actually have content in the active locale;
- `hreflang` is emitted **only** when the counterpart genuinely exists;
- never assume `article.title` is non-empty just because the article exists.

**#3 — RTL comes from logical properties, not a second stylesheet.**
`margin-inline-start`, `padding-inline`, `border-inline-end`, `text-align: start`,
`inset-inline`. No `left`/`right` in layout CSS. `dir` is set on `<html>` from the
route param. Only directional glyphs need explicit mirroring.

**#4 — Public routes must stay SSG/ISR.** The site has no paywall, so _every_ page
is publicly cacheable — that is our main performance advantage over the reference
site. Never read `cookies()` / `headers()` in a layout or in a component mounted by
the layout: it opts the whole tree into dynamic rendering. Anything viewer-specific
(account state in the header) is a **client island that fetches after hydration**.

**#5 — The Payload config graph uses RELATIVE imports.** `payload.config.ts` and
everything it transitively imports must not use the `@/*` alias — the Payload CLI
loaders do not honour it. Frontend code may use `@/*` freely.

**#6 — A lot is not done until it is green.** `pnpm lint` ✓, `pnpm build` ✓, and a
smoke test against `next start` (not just `dev`). Then commit. No exceptions.

---

## 4. Structure

```
app/
  (frontend)/[lang]/        fr | ar — owns <html>/<body>, dir + lang attributes
  (payload)/                /admin + REST/GraphQL
  sitemap.ts  robots.ts  news-sitemap/route.ts     <- ROOT of app/, outside route groups
collections/                Payload collections
fields/                     slugField (AR-aware), seoField, accessLevelField, rubrique fields
components/<Name>/          <Name>.tsx + <Name>.module.css
lib/                        payload, queries, i18n, navigation, media, format, site
docs/                       plan + client deliverables (French)
```

There is **no** `app/layout.tsx` at the root — `(frontend)` and `(payload)` each
own their document.

---

## 5. URL map

```
/{lang}/                                    home
/{lang}/{rubrique}/                         economie, actus-juridique, la-startup-marocaine,
                                            legaltech-fintech, decryptage-sectoriel, tendances
/{lang}/{rubrique}/{sous-rubrique}/
/{lang}/article/{slug}/                     namespaced — avoids collisions with static pages
/{lang}/podcast/   /{lang}/podcast/{slug}/
/{lang}/documents/                          téléchargements de la rédaction :
                                            contrats types, attestations, études, synthèses
                                            (ar: /وثائق) — les TEXTES LÉGAUX ne sont pas ici
/{lang}/startups/{slug}/                    entity hubs — the SEO moat,
/{lang}/entreprises/{slug}/                 auto-populated from article
/{lang}/textes-juridiques/{slug}/           relationships, never hand-curated.
                                            Porte AUSSI le texte officiel en
                                            téléchargement — 2e bibliothèque
/{lang}/personnalites/{slug}/
/{lang}/dossiers/{slug}/   /auteurs/{slug}/   /tags/{slug}/
/{lang}/la-redaction/ /qui-sommes-nous/ /nous-rejoindre/ /nous-contacter/ /newsletter/
```

Pathnames are **localized** (next-intl).
**Arabic articles get Arabic slugs** (percent-encoded) — better SERP CTR in Arabic.
`slugField` must therefore be Unicode-aware, not Latin-only.

---

## 6. Content model

18 collections, in the order they appear in `payload.config.ts` — which is also
the order of the admin sidebar, grouped by how often the newsroom touches them:

| Groupe             | Collections                                                          |
| ------------------ | -------------------------------------------------------------------- |
| **Contenu**        | `Articles` `Podcasts` `Videos` `Documents` `Dossiers` `Pages` `Media` `Fichiers` |
| **Entités**        | `Startups` `Entreprises` `Personnalites` `TextesJuridiques`           |
| **Rédaction**      | `Auteurs` `Tags`                                                      |
| **Régie**          | `Publicites`                                                          |
| **Audience**       | `Newsletter` `Abonnes`                                                |
| **Administration** | `Users`                                                               |

`Auteurs` is a byline, not an account: a contributor can be credited without
ever having a login, and a `Users` record is not automatically an author.

`Media` holds images only; `Fichiers` is the same thing for PDF/DOC/XLS/ZIP —
Payload generates renditions for whatever lands in Media, which is meaningless
for a PDF, and the médiathèque must stay searchable for photographers.

**Videos are embedded, never hosted** (same reason as the podcast audio): the
collection stores the YouTube/Vimeo URL, `lib/video-url.ts` parses it at save
time, and `components/VideoCard` renders a click-to-play FACADE — the provider's
iframe and its cookies load only when the reader presses play. Three embeds on
the homepage would otherwise outweigh the whole rest of the site.

**Two download libraries, and they must stay separate** (client instruction):
`Documents` (contrats types, attestations, études, synthèses — our own material,
at `/{lang}/documents`) and the official legal texts, which are NOT a second
corpus: the file hangs off `TextesJuridiques.fichier` so a text keeps one URL,
with its résumé, son statut and our articles. Never merge them — it would give
each text two competing pages and blur, for the reader, the line between what
the newsroom drafted and what the State published.

Localized fields: `title`, `slug`, `excerpt`, `body`, `seo`.
Shared (non-localized): `publishedAt`, `rubrique`, `sousRubrique`, `coverImage`,
`accessLevel`, and all relationships.

`Articles.format`: Actualité | Analyse | Décryptage | Interview | Tribune | Infographie.

### Comptes : deux collections, et elles ne se mélangent jamais

**`Users` = la rédaction.** Roles: `admin`, `redacteur-en-chef`, `journaliste`,
`contributeur` (drafts only). Every record in it is staff; there is no
reader-level role. Default on create is `contributeur`, the least-privileged
**staff** role — so an account created with `role` stripped can draft and
nothing else.

**`Abonnes` = les lecteurs.** The free accounts (règle d'or #1: free, always).
It has **no `role` field at all**, deliberately — a reader cannot be promoted.

Why two collections rather than one with a role, which is the obvious design and
was the original one: Payload's admin authenticates against exactly **one**
collection, the one named by `admin.user`. With readers in `Users`, a reader's
e-mail and password were *valid credentials at `/admin/login`* — they
authenticated, and were refused only afterwards by an access rule. One
regression in that rule and the back-office is open. Split, a reader's password
does not fit the lock at all, and the refusal stops depending on a check being
correct. Privilege is now a property of **which collection an account lives in**,
not of a column.

Consequence: `req.user` on a public request is an `Abonne`, which has no `role`,
so every helper in `lib/payload-access.ts` fails closed on it with no special
case. `staffAdminPanel` remains as a second lock, for a staff account whose role
was narrowed after creation.

**Never create the first admin through `/admin/create-first-user` on a
reachable host.** Payload serves that screen for as long as `users` is empty, so
the window belongs to whoever finds `/admin` first. Run `pnpm create-admin`
(`ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NOM`) as a deployment step, before DNS
points at the box — it is idempotent, never rewrites an existing password, and
refuses to run once the collection is non-empty.

---

## 7. Rubriques (verbatim from the client brief)

| Rubrique             | Sous-rubriques                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Économie             | —                                                                                                                   |
| Actus juridique      | Propriété intellectuelle & numérique · Droit des plateformes · Droit & confiance numérique · Données personnelles   |
| La startup marocaine | Booster votre créativité par le Droit · Meilleures levées de fonds · Meilleurs classements par secteur · Écosystème |
| Legaltech – Fintech  | Marché marocain de la Legaltech · Actualité de la Fintech                                                           |
| Décryptage sectoriel | Réglementation numérique marocaine · Mesures d'encouragement à l'innovation                                         |
| Tendances            | Applis mobiles · Plateformes innovantes · Formations, organisations, fédérations                                    |
| Podcast              | —                                                                                                                   |

Do not invent rubriques. Changes come from the client, in writing.

---

## 8. Deployment

Target: **one Node service** (Hostinger VPS Docker, or Render) — Next + Payload
in a single process, with MongoDB Atlas and Cloudinary outside it. There is no
separate frontend to upload anywhere: the pages and `/admin` come out of the
same server.
The client asked for Hostinger shared / cPanel; shared cannot run Node, Payload's
admin, or ISR, so the plan assumes a VPS on the same vendor. **Confirm before Lot 8.**
Fallbacks, in order: (a) Hostinger domain + email, app on Vercel; (b) static export on
Hostinger + Payload on Render with a rebuild webhook (loses the instant publish loop).

Publish flow: Payload `afterChange` → `revalidatePath` for **both** locales → live.

---

## 9. Known traps on this machine

- **OneDrive dehydrates `.next`** → `EINVAL readlink` / `MODULE_NOT_FOUND`. This folder
  is pinned (`attrib +P -U ... /s /d`). `.next` must be a **real directory inside the
  project** — `distDir` elsewhere and junctions both fail.
- **`EPERM rename ...tmp -> ...`** in `.next` is a _lock_, not dehydration: three antivirus
  products are installed and Defender's service is dead, so `Add-MpPreference` is useless.
  Exclusions must be set in McAfee's and Reason's own UI.
- **Never run `pnpm build` while the user's `next dev` is running** — it corrupts `.next`.
  Never leave a background dev server up.
- **pnpm 11 reads its settings from `pnpm-workspace.yaml`, NOT `.npmrc`.** Without
  `verifyDepsBeforeRun: false` there, pnpm re-runs `pnpm install` before every script,
  hits `ERR_PNPM_IGNORED_BUILDS`, and the script never starts. `.npmrc`'s
  `verify-deps-before-run=false` is ignored — keep the YAML as the source of truth.
  `ERR_PNPM_IGNORED_BUILDS` still prints on an explicit `pnpm install`; harmless here
  because sharp, esbuild, @swc/core and unrs-resolver all ship prebuilt binaries
  (`require('sharp')` verified working, libvips 8.17.3).
- **There is a `node_modules` with ~568 packages in the HOME directory**
  (`C:\Users\MOURAD\node_modules`, alongside a stray `package.json`). It is an ancestor
  of every project under `Bureau\`, so Node can resolve packages out of it —
  it holds `@typescript-eslint`, `@eslint`, `@babel` and more. Suspect it whenever a
  tool behaves as though a dependency you never installed is present.
- **Do not use `FlatCompat` in `eslint.config.mjs`.** The legacy eslintrc resolver it
  wraps resolved `@next/eslint-plugin-next` out of a **sibling project**
  (`Bureau\crewstay\node_modules`), whose older copy calls `context.getAncestors()` —
  removed in ESLint 9 — crashing every lint run. The config now imports the plugins
  directly. Also pin `@next/eslint-plugin-next` to the Next version (15.5.19):
  `pnpm add -D @next/eslint-plugin-next` alone pulls the Next **16** plugin.
- **`next.config.ts` must pin `outputFileTracingRoot`**, else Next picks up the lockfile
  from the parent home directory.
- **This folder is its own git repo** (`git init` run here). The parent
  `C:\Users\MOURAD\.git` mega-repo must never be committed to from this project.
- **Dynamic route params arrive PERCENT-ENCODED and Next never decodes them.**
  `/ar/%D8%A7%D9%82%D8%AA%D8%B5%D8%A7%D8%AF` reaches the page as
  `params.rubrique === '%D8%A7...'`, not `'اقتصاد'` — so every lookup against a slug
  from `lib/rubriques.ts` misses and the whole Arabic side 404s, invisibly, because
  every French slug is ASCII and therefore identical either way. Always resolve a
  slug through `decodeParam()` and emit static params through `encodeParam()`
  (`lib/params.ts`). Related: `dynamicParams = false` **cannot** be used on the
  `[rubrique]` routes — it answers `NoFallbackError` for non-ASCII segments even
  when the prerender manifest key matches the request byte for byte.
- **`routing.pathnames` localizes segments, so a hand-written internal URL costs a
  307 on /ar.** `/ar/article/x` redirects to `/ar/مقال/x`, which makes the wrong URL
  look like it works while the page's own canonical disagrees with the served one.
  Build every internal link through `lib/links.ts`; nothing else concatenates a path.
- **Payload's `afterDelete` hands you a document whose LOCALIZED fields are all
  `undefined`.** Not resolved into the request locale, not shaped as `{ fr, ar }` —
  gone; only the shared fields (`rubrique`, `_status`, `publishedAt`) survive. So a
  hook that needs a deleted document's slug must read it in **`beforeDelete`**, while
  the row still exists, and hand it forward through `req.context` (keyed by id — one
  `delete({ where })` fires the pair once per matching document on a shared request).
  Measured on a real delete: `title=undefined slug=undefined rubrique="economie"
  status="published"`. The cost of getting it wrong is that a withdrawn article keeps
  serving its cached HTML at its own URL until the next build.
- **`generateStaticParams` must emit slugs through `encodeParam()`** — the prerender
  manifest is matched against the RAW request path, so an Arabic slug written
  literally produces a manifest key no request can ever equal. With `dynamicParams`
  true this does not 404, which is what makes it easy to miss: the page is built and
  then silently never served from the build, rendering on demand every time the cache
  is cold. Check `.next/prerender-manifest.json` — every `/ar/…` key must be
  percent-encoded.
- **A `pnpm build` can fail with `payloadInitError: true` on a transient Atlas
  hiccup** (`Failed to collect page data for …`, thrown out of `generateStaticParams`).
  It is not a code error; re-run before debugging it.
- **A `required` + `localized` upload field cannot be half-translated, and that is
  the point.** `Documents.fichier` is both, so Payload REFUSES an `update` that adds
  only an Arabic `title`: the Arabic file is required in the same save. An editor
  therefore cannot produce a document whose Arabic page would offer the French PDF —
  règle d'or #2 is enforced at the write, not merely filtered at the read. Measured:
  `ValidationError: Le champ suivant n'est pas valide : Fichier à télécharger`.
  The drop in `documentSummaryOf()` stays as the second lock, for rows written by a
  script.
- **The institutional pages are addressed by `cle`, and one key does not match its
  URL.** The route segment is `/confidentialite` but the stored key is
  `politique-de-confidentialite` (the value `collections/Pages.ts` offers in its
  dropdown). Naming the segment in the route constant silently finds no page and
  404s a link that sits in the footer of every page. The seed creates all six keys
  for exactly this reason.
- **Playwright `getByLabel` matches substrings case-insensitively.** Once a newsletter
  field named « Adresse e-mail » exists in the footer, any `getByLabel("E-mail")`
  becomes a strict-mode violation. Use `{ exact: true }`.
- **Never share one `context` object across Local API upload calls.** Payload uses it
  as `req.context` by reference, and plugin-cloud-storage stashes the incoming file on
  it only when nothing is stashed yet — so with a shared `OPTS = { context: {...} }`
  constant the first upload of the process reaches Cloudinary and every later one
  silently does not: the Media row exists, its file never does. Build the options per
  call (`scripts/seed-photos.ts`). Checking afterwards: ask the Cloudinary API, not the
  CDN — a URL fetched while it 404ed stays cached as a 404 for a while after the upload.
- **On Vercel, Arabic-slug pages must not be prerendered.** A page prerendered under a
  percent-encoded non-ASCII path is served as a cached 404 there (fine under
  `next start`). `prerenderSlug()` in `lib/params.ts` drops them from
  `generateStaticParams` on Vercel only; they render on first request, then ISR.

---

## 10. Commands

```
pnpm dev            # port 3000, often falls through to 3001
pnpm build          # never while a dev server is running
pnpm lint
pnpm seed           # idempotent bilingual demo data
pnpm create-admin   # premier compte admin depuis l'environnement (voir §6)
                    # ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NOM=... pnpm create-admin
pnpm test:e2e       # Playwright
pnpm payload -- --use-swc <cmd>
```
