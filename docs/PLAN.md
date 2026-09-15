# AL-RAQMANA24.ma — Plan de réalisation

Découpage en 8 lots. **Un lot n'est terminé que s'il est vert** : `pnpm lint` ✓,
`pnpm build` ✓, smoke test sur `next start` ✓, puis commit.
Les règles d'or sont dans `/CLAUDE.md` — elles priment sur ce document.

Statut : `⬜ à faire` · `🟡 en cours` · `✅ fait & vérifié`

---

## Lot 1 — Fondations 🟡 (bloqué sur `DATABASE_URI`)

> **Fait & vérifié** : squelette Next 15.5.19 + Payload 3.85.1, bilingue FR/AR complet,
> `pnpm lint` ✓, `pnpm build` ✓ (`/fr` et `/ar` en **SSG**), smoke `next start` ✓
> (`/`→307 `/fr`, `/fr`+`/ar`=200 avec `dir` correct, rubrique inconnue=404).
> **Reste** : la chaîne de connexion MongoDB Atlas — sans elle `/admin` renvoie 500 et
> `generate:types` / `generate:importmap` / `seed` ne peuvent pas tourner.


Objectif : un squelette qui build, avec Payload branché sur MongoDB Atlas et le bilingue configuré.

- [ ] `create-next-app` **en pinnant Next 15.5.19** (pas `@latest` → installerait Next 16, incompatible Payload 3), TypeScript strict, App Router, pas de Tailwind, pas de `src/`.
- [ ] `package.json` : `"type": "module"`, scripts `dev/build/lint/seed/payload/test:e2e`.
- [ ] `.npmrc` (`verify-deps-before-run=false`) + `pnpm-workspace.yaml` (`onlyBuiltDependencies`: sharp, unrs-resolver, esbuild ; `allowBuilds: true`).
- [ ] Payload 3.85.1 + `@payloadcms/db-mongodb` + `@payloadcms/richtext-lexical` + sharp 0.34.5.
- [ ] `next.config.ts` : `outputFileTracingRoot` pinné sur ce dossier.
- [ ] Cluster MongoDB Atlas (région européenne), `DATABASE_URI` + `PAYLOAD_SECRET` + `CLOUDINARY_URL` dans `.env` (gitignored), `.env.example` commité.
- [ ] **Localisation Payload** : locales `fr` (défaut) + `ar` (`rtl: true`), **`fallback: false`** (règle d'or #2).
- [ ] Route groups `app/(frontend)/[lang]/` et `app/(payload)/` — **pas** de `app/layout.tsx` racine.
- [ ] next-intl : middleware, `routing.ts` avec pathnames localisés FR/AR, `[lang]` = `fr | ar`.
- [ ] `app/globals.css` : tokens de la charte (rouge/vert du logo, neutres, échelle typo **FR et AR séparées**, espacements). Polices : serif FR pour les titres + IBM Plex Sans Arabic / Cairo pour l'arabe.
- [ ] Layout `[lang]` : `<html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>`, `suppressHydrationWarning` sur `<body>`.
- [ ] Premier admin via `POST /api/users/first-register`.
- [ ] `.gitignore` (`.next`, `node_modules`, `.env`, `/media`).

**Pièges** : CLI Payload en `--use-swc` (Node 22.14) ; imports **relatifs** dans le graphe `payload.config.ts` ; `pnpm` déjà installé globalement (11.8.0) — ne pas passer par corepack (EPERM).

**Vert quand** : `pnpm dev` → `/fr` 200, `/ar` 200 avec `dir="rtl"`, `/admin` 200, création d'un user OK ; `pnpm lint` ✓ ; `pnpm build` ✓.

---

## Lot 2 — Modèle de contenu 🟡 (bloqué sur `DATABASE_URI`)

> **Fait & vérifié sans base** : les 13 collections, les 4 helpers de champs, les
> contrôles d'accès par rôle et le seed bilingue sont écrits.
> `payload generate:types` ✓ (`payload-types.ts` généré, il n'a pas besoin de la base),
> `tsc --noEmit` ✓, `pnpm lint` ✓, `pnpm build` ✓ (`/fr` et `/ar` toujours en **SSG**),
> smoke `next start` ✓ (`/`→307 `/fr`, `/fr`+`/ar`=200 avec `dir` correct).
> **Reste, et c'est le même blocage qu'au Lot 1** : sans chaîne Atlas, `/admin`
> renvoie 500 (`ECONNREFUSED ::1:5432` — la variable est vide, `pg` retombe sur
> localhost) et `pnpm seed` ne peut pas tourner. Rien d'autre ne bloque.

Objectif : les 13 collections, les helpers de champs, un seed bilingue idempotent.

- [x] Helpers `fields/` :
  - `slugField` — hook auto-slug **Unicode-aware** (doit produire des slugs arabes corrects, pas une chaîne vide ; `localized: true`).
  - `seoField` (title, description, image, noindex) — `localized: true`.
  - `accessLevelField` (`public` | `metered` | `premium`) — **présent mais dormant**, défaut `public` (règle d'or #1).
  - `rubriqueField` / `sousRubriqueField` — options issues du tableau de `/CLAUDE.md` §7, non localisées.
- [x] Collections : `Articles` `Auteurs` `Podcasts` `Startups` `Entreprises` `Personnalites` `TextesJuridiques` `Dossiers` `Tags` `Pages` `Newsletter` `Media` `Users`.
- [x] `Articles` : drafts + versions activés, `format` (Actualité/Analyse/Décryptage/Interview/Tribune/Infographie), `publishedAt`, `coverImage`, relations vers startups / entreprises / personnalites / textes-juridiques / dossiers / tags / auteurs.
- [x] Champs **localisés** : `title`, `slug`, `excerpt`, `body`, `seo`. Tout le reste partagé.
- [x] Rôles + contrôles d'accès réutilisables (`lib/payload-access.ts`, imports relatifs) : `publicRead` en lecture ; `staffOnly` (admin | redacteur-en-chef | journaliste) en écriture ; `contributeur` = drafts seulement ; `Users` = `adminOrSelf`, champ `role` réservé admin.
- [x] Groupes dans l'admin Payload + labels **en français** (c'est une rédaction francophone).
- [x] `scripts/seed.ts` idempotent, **bilingue** *(écrit, pas encore exécuté — base absente)* : quelques articles FR-only, AR-only et FR+AR — pour que le Lot 3 teste réellement le cas de traduction partielle.

**Vert quand** *(reste à faire, dès que la base répond)* : `pnpm seed` deux fois de suite ne duplique rien ; les données sont vérifiables en REST ; un article AR a bien un slug arabe ; `lint` ✓ `build` ✓.

---

## Lot 3 — Pages éditoriales ✅ (fait & vérifié)

> **Fait & vérifié** : `lib/payload.ts`, `lib/lexical.ts` et `lib/queries.ts` écrits ;
> les 28 pages/composants lisent désormais `@/lib/queries` ; la famille **articles**
> et l'accueil viennent de Payload ; la boucle « Publier → en ligne » fonctionne
> sans rebuild (testée sur `next start`). `dynamicParams = false` retiré de
> 19 routes de contenu — il gelait les pages et empêchait tout article créé après
> le build d'exister. `lint` ✓ `tsc` ✓ `build` ✓ (188 pages).
> **La boucle « Publier → en ligne » est close et vérifiée** : un article créé
> APRÈS le build existe à son URL en quelques secondes, et un article supprimé
> repasse à 404 — en FR comme en AR. Deux bugs corrigés au passage : `afterDelete`
> ne porte aucun champ localisé (d'où un hook `beforeDelete`), et
> `generateStaticParams` n'encodait pas les slugs arabes des articles.
> Migrées depuis Payload : **auteurs, dossiers, tags, hubs d'entités** — avec la
> correction des `generateStaticParams` qui croisaient locales × slugs (184 → 144
> routes prérendues, les slugs arabes ne sont plus annoncés sous `/fr`).
> **Les quatre dernières familles — podcasts, pages institutionnelles, vidéos,
> documents — sont passées à leur tour, et `lib/demo/` (≈ 3 200 lignes) a été
> supprimé.** Plus une seule fixture inventée dans le code : tout vient du CMS.
> `lint` ✓ `tsc` ✓ `build` ✓ (112 routes prérendues, toutes les clés `/ar`
> pourcent-encodées) · smoke `next start` ✓ (19 URL, 0 échec).
> Détail complet et pièges dans `docs/REPRISE.md`.

Objectif : accueil, rubriques, sous-rubriques, article — en FR et en AR.

- [x] `lib/payload.ts` (client mémoïsé via `cache`), `lib/queries.ts`, `lib/navigation.ts`, `lib/format.ts` (dates `fr-MA` et `ar-MA`), `lib/media.ts`.
- [x] **Toutes les queries filtrent sur la locale active** et excluent les articles sans contenu dans cette locale (règle d'or #2).
- [x] Composants : `ArticleCard`, `ArticleGrid`, `Ticker` (fil d'infos), `RubriqueHeader`, `LangSwitcher`, `AdSlot`.
- [x] `LangSwitcher` : pointe vers la **traduction réelle** si elle existe, sinon vers l'accueil de l'autre locale (jamais un lien mort).
- [x] Accueil : Une + top stories + fil + dernières publications par rubrique.
- [x] `[rubrique]/` + `[rubrique]/[sousRubrique]/` : `generateStaticParams` × 2 locales, `notFound()` si rubrique inconnue.
- [x] `article/[slug]/` : rendu Lexical, JSON-LD `NewsArticle` avec `isAccessibleForFree: true`, `inLanguage`, breadcrumb.
- [x] `hreflang` : émis **uniquement** si la contrepartie existe.
- [x] ISR + hook Payload `afterChange` → `revalidatePath` sur **les deux** locales (et `beforeDelete` pour les suppressions).
- [x] `lib/demo/` supprimé : podcasts, pages, vidéos et documents viennent de Payload.

**Vert quand** : `next start` — `/fr` `/ar` `/fr/economie` `/ar/...` = 200, rubrique inconnue = 404, article FR-only = 404 en `/ar/article/...`, JSON-LD présent, aucun `hreflang` orphelin.

---

## Lot 4 — Hubs d'entités ⬜

Le différenciateur SEO. Personne au Maroc ne fait ça sur le créneau droit du numérique / startups.

- [ ] `/startups/[slug]` `/entreprises/[slug]` `/textes-juridiques/[slug]` `/personnalites/[slug]` `/dossiers/[slug]` `/auteurs/[slug]` `/tags/[slug]`.
- [ ] Chaque hub = fiche (description, métadonnées, liens) + **liste auto-alimentée par les relations** des articles. Jamais de curation manuelle.
- [ ] `TextesJuridiques` : champs spécifiques (référence du texte, date de publication au BO, statut : en vigueur / projet / abrogé, lien officiel).
- [ ] `Startups` : secteur, année de création, stade, levées (montant, tour, date, investisseurs) → alimente « Meilleures levées de fonds ».
- [ ] JSON-LD par type : `Organization` (startups/entreprises), `Person` (personnalités), `Legislation` ou `CreativeWork` (textes), `CollectionPage` + `ItemList` pour les listes.
- [ ] Blocs « À lire aussi » sur l'article, tirés des mêmes relations.

**Vert quand** : créer un article lié à une startup fait apparaître l'article sur le hub sans aucune autre action ; `generateStaticParams` couvre les deux locales ; `lint` ✓ `build` ✓.

---

## Lot 5 — Podcast ⬜

- [ ] Collection `Podcasts` : titre, description, invité (relation `Personnalites`), durée, date, **URL d'embed** de l'hébergeur, article lié.
- [ ] Hébergement audio **externe** (Ausha ou Acast) — ne pas servir les MP3 depuis l'origine, ne pas écrire un flux RSS Apple à la main.
- [x] `/podcast/` (liste) + `/podcast/[slug]` : notes d'épisode, transcription optionnelle et **lecteur embarqué dès que `embedUrl` est renseigné** — fait au Lot 3, il ne reste que le choix de l'hébergeur et le flux RSS.
- [ ] JSON-LD `PodcastEpisode` / `PodcastSeries`.

**Vert quand** : lecteur fonctionnel en FR et AR, liste paginée, `lint` ✓ `build` ✓.

---

## Lot 6 — Newsletter, compte gratuit, pages statiques ⬜

- [ ] `NewsletterForm` (îlot client `useActionState`) dans le footer global → Server Action → upsert dans la collection `Newsletter` (**consentement loi 09-08** + source + locale) puis sync best-effort Brevo.
- [ ] `lib/brevo.ts` = seam tolérant : sans `BREVO_API_KEY`, renvoie `{ synced: false }` sans rien casser.
- [ ] Compte **gratuit** : `/connexion` `/inscription` `/compte` (noindex) → crée un document dans la collection **`Abonnes`**, jamais dans `Users` (voir `/CLAUDE.md` §6 : il n'existe plus de rôle `abonne`, la séparation est faite par collection). **Aucun paiement** (règle d'or #1).
- [ ] Ouvrir `Abonnes.access.create` au public **en même temps** que le formulaire — aujourd'hui `isAdmin`, fermé exprès : l'endpoint doit arriver avec son rate limiting et sa capture de consentement, pas avant.
- [ ] Header : état de connexion via îlot client qui fetch `/api/abonnes/me` après hydratation (règle d'or #4).
- [ ] Pages depuis la collection `Pages` : `la-redaction`, `qui-sommes-nous`, `nous-rejoindre`, `nous-contacter` — FR et AR.
- [ ] Formulaire de contact + mentions légales / politique de confidentialité (loi 09-08).

**Piège** : ajouter « Adresse e-mail » au footer casse tout `getByLabel("E-mail")` existant → `{ exact: true }`.

**Vert quand** : inscription newsletter OK sans clé Brevo, avec clé Brevo OK, inscription/connexion/compte OK, les articles publics restent **SSG** au build.

---

## Lot 7 — SEO & performance ⬜

- [ ] `lib/site.ts` : `SITE_URL`, noms et descriptions **par locale**, `absoluteUrl()`.
- [ ] `app/sitemap.ts` — les deux locales, avec `alternates.languages`.
- [ ] `app/news-sitemap/route.ts` — **Google News**, fenêtre 48 h, `news:language` par locale.
- [ ] `app/robots.ts` — `disallow` `/admin` `/api/` `/compte` `/connexion` `/inscription` ; `allow` explicite pour les robots IA (GPTBot, ClaudeBot, Google-Extended, PerplexityBot…) ; sitemaps absolus.
- [ ] RSS par rubrique et par locale.
- [ ] JSON-LD site : `@graph` `NewsMediaOrganization` + `WebSite` liés par `@id`.
- [ ] Images OG par locale (sharp, charte + logo) ; `next/image` partout ; LCP préchargé.
- [ ] Plausible monté seulement si `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`.
- [ ] Lancer la skill `seo-audit` + Lighthouse sur `/fr` et `/ar`.
- [ ] Vérifier le rendu arabe : pas de casse de la ligature, pas de troncature RTL, contraste AA.

**Vert quand** : sitemaps valides, Rich Results OK sur article + hub, Lighthouse ≥ 95 perf/SEO/a11y sur les deux locales.

---

## Lot 8 — Déploiement & passation ⬜

- [ ] **Confirmer l'hébergement avec le client** (VPS Hostinger recommandé ; voir `/CLAUDE.md` §8).
- [ ] `Dockerfile` (Next + Payload, `output: 'standalone'`), ou service Render / Vercel selon l'arbitrage. La base et les médias sont hors du serveur (Atlas + Cloudinary).
- [ ] Domaine `al-raqmana24.ma`, TLS, redirections `www`, headers de sécurité.
- [ ] Sauvegardes : Atlas (backup continu du plan payant, sinon `mongodump` planifié) + médias Cloudinary. **Tester une restauration**, pas seulement l'activer.
- [ ] Search Console : les deux locales, soumission des sitemaps (compte de service `gsc` déjà en place).
- [ ] **Guide rédacteur en français** : publier, traduire, lier une entité, programmer, gérer les médias.
- [ ] Session de formation de la rédaction.

---

## Hors périmètre (à réévaluer plus tard)

Paiement / paywall · applications mobiles · régie publicitaire · commentaires ·
espace annonceurs · newsletter éditorialisée automatisée.
