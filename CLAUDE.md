# AL-RAQMANA24.ma — CLAUDE.md

Governing document for this repo. Read it before touching code.
Written in English (working language with the developer); **all user-facing copy,
client deliverables and editor documentation are in French / Arabic.**

---

## 1. What this is

**Al-Raqmana24.ma** — *Entreprendre, Innover, Digitaliser.*
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

| Layer | Choice | Pin |
|---|---|---|
| Framework | Next.js 15, App Router | `15.5.19` |
| UI | React 19 | `19.x` |
| Language | TypeScript, `strict: true` | — |
| CMS | Payload 3, self-hosted, **same repo** | `3.85.1` |
| DB | PostgreSQL (Neon, eu-central-1) | — |
| Images | sharp | `0.34.5` |
| Styling | **Pure CSS Modules** + tokens | no Tailwind, ever |
| i18n routing | next-intl, localized pathnames | — |
| Newsletter | Brevo (behind a tolerant seam) | — |
| Analytics | Plausible | — |
| E2E | Playwright | — |
| Package manager | pnpm | `11.x` |

**Why these exact pins** (learned the hard way on MCF News — do not "upgrade to latest"):

- `create-next-app@latest` installs Next 16 → **incompatible with Payload 3**.
- `sharp` 0.35 **breaks Payload's types**.
- Node here is 22.14, which breaks tsx's `require(ESM)` / top-level await →
  the Payload CLI must run with `--use-swc`.

---

## 3. Règles d'or

**#1 — No payment, no paywall.** The client brief says « S'abonner gratuitement ».
The `accessLevel` field and the ad-slot component exist but stay **dormant** —
they are seams for a possible future, not features. Never build a checkout, never
gate an article, never wire CMI. If asked to "add subscriptions", it means
*newsletter + free account*.

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

**#4 — Public routes must stay SSG/ISR.** The site has no paywall, so *every* page
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
/{lang}/startups/{slug}/                    entity hubs — the SEO moat,
/{lang}/entreprises/{slug}/                 auto-populated from article
/{lang}/textes-juridiques/{slug}/           relationships, never hand-curated
/{lang}/personnalites/{slug}/
/{lang}/dossiers/{slug}/   /auteurs/{slug}/   /tags/{slug}/
/{lang}/la-redaction/ /qui-sommes-nous/ /nous-rejoindre/ /nous-contacter/ /newsletter/
```

Pathnames are **localized** (next-intl).
**Arabic articles get Arabic slugs** (percent-encoded) — better SERP CTR in Arabic.
`slugField` must therefore be Unicode-aware, not Latin-only.

---

## 6. Content model

`Articles` `Auteurs` `Podcasts` `Startups` `Entreprises` `Personnalites`
`TextesJuridiques` `Dossiers` `Tags` `Pages` `Newsletter` `Media` `Users`

Localized fields: `title`, `slug`, `excerpt`, `body`, `seo`.
Shared (non-localized): `publishedAt`, `rubrique`, `sousRubrique`, `coverImage`,
`accessLevel`, and all relationships.

`Articles.format`: Actualité | Analyse | Décryptage | Interview | Tribune | Infographie.

Roles: `admin`, `redacteur-en-chef`, `journaliste`, `contributeur` (drafts only), `abonne`.

---

## 7. Rubriques (verbatim from the client brief)

| Rubrique | Sous-rubriques |
|---|---|
| Économie | — |
| Actus juridique | Propriété intellectuelle & numérique · Droit des plateformes · Droit & confiance numérique · Données personnelles |
| La startup marocaine | Booster votre créativité par le Droit · Meilleures levées de fonds · Meilleurs classements par secteur · Écosystème |
| Legaltech – Fintech | Marché marocain de la Legaltech · Actualité de la Fintech |
| Décryptage sectoriel | Réglementation numérique marocaine · Mesures d'encouragement à l'innovation |
| Tendances | Applis mobiles · Plateformes innovantes · Formations, organisations, fédérations |
| Podcast | — |

Do not invent rubriques. Changes come from the client, in writing.

---

## 8. Deployment

Target: **Hostinger VPS (KVM), Docker** — Next + Payload + Postgres.
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
- **`EPERM rename ...tmp -> ...`** in `.next` is a *lock*, not dehydration: three antivirus
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
- **Playwright `getByLabel` matches substrings case-insensitively.** Once a newsletter
  field named « Adresse e-mail » exists in the footer, any `getByLabel("E-mail")`
  becomes a strict-mode violation. Use `{ exact: true }`.

---

## 10. Commands

```
pnpm dev            # port 3000, often falls through to 3001
pnpm build          # never while a dev server is running
pnpm lint
pnpm seed           # idempotent bilingual demo data
pnpm test:e2e       # Playwright
pnpm payload -- --use-swc <cmd>
```
