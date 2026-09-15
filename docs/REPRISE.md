# Reprise — les Lots 3 et 4 sont clos

Point d'arrêt du 15 septembre 2026, 14 h 00. À lire avant de reprendre.

État de l'arbre : `pnpm lint` ✓ · `npx tsc --noEmit` ✓ · `pnpm build` ✓ ·
smoke `next start` ✓ · aucun serveur ne tourne · aucun fichier temporaire ·
base propre (les documents de test des deux sessions ont été supprimés et la
suppression a été **vérifiée**).

---

## 1. Lot 3 — pages éditoriales (commit `30108d2`)

**Les quatre dernières familles de `lib/queries.ts` sont passées sur Payload, et
`lib/demo/` a été supprimé** (≈ 3 200 lignes). Plus une seule fixture inventée
dans le code : tout ce que le site affiche sort du CMS.

| Famille | Collection | Notes |
| --- | --- | --- |
| `listPodcasts` / `getPodcast` / `podcastParams` | `Podcasts` | + `embedUrl`, + transcription |
| `getPage` | `Pages`, par `cle` | `pageSlugs()` supprimé (mort) |
| `listVideos` | `Videos` | URL passée par `parseVideoUrl()` |
| `listDocuments` / `documentsByCategory` / `listTexteDownloads` | `Documents` | `fichier` **localisé** |

`loadPublished()` est le jumeau de `loadDocs()` pour les collections à
brouillons : `payload.find` avec `overrideAccess` renvoie volontiers les
brouillons, donc sans filtre un texte en cours d'écriture part en ligne. Deux
fonctions plutôt qu'un drapeau — l'oubli se voit au point d'appel.

Décisions notables : un épisode existe dans une locale s'il a un titre et un
slug (pas des notes — sinon `podcastParams` et `getPodcast` divergent) ;
`episode` et `duration` optionnels comme dans la collection ; lecteur audio réel
dès que `embedUrl` est renseigné ; `AuthorSummary` porte `bio` ; les pages
institutionnelles s'adressent par `cle`.

Trous bouchés : trois pages institutionnelles manquaient au seed alors que le
pied de page y renvoie depuis chaque page (404 en FR et en AR), et la route
`/confidentialite` cherchait la clé `confidentialite` là où `Pages` propose
`politique-de-confidentialite`. La bibliothèque de photos de démonstration a
suivi `lib/demo` : `resolveMedia()` n'a plus que deux étages.

---

## 2. Lot 4 — hubs d'entités

Les sept routes et la liste dérivée existaient déjà. Ce qui a été ajouté :

### `EntityData` — l'identité comme donnée, et non comme chaîne d'affichage

Le panneau d'identité (`facts`) était lu directement depuis le document Payload.
Le JSON-LD, lui, a besoin des **valeurs brutes** : `foundingDate`, une date ISO,
un identifiant de texte — tout ce qu'un libellé détruit. Écrire les deux depuis
le document aurait donné deux lectures des mêmes champs, donc deux endroits à
corriger au premier renommage, dont un invisible.

`entityDataOf()` fait donc **une** lecture et produit `EntityData` (union
discriminée par `kind`). `factsOf(data, locale)` en dérive l'affichage,
`lib/jsonld.ts` en dérive le schema.org. Le panneau visible et le JSON-LD
invisible ne peuvent plus diverger.

### `lib/jsonld.ts` + `components/JsonLd`

- `Organization` (startups, entreprises) · `Person` (personnalités) ·
  `Legislation` (textes) — `Legislation` et non `CreativeWork` : c'est ce qui
  conserve `legislationIdentifier` et `legislationDate`, les deux propriétés qui
  rendent un texte trouvable par sa référence plutôt que par son titre.
- `CollectionPage` + `ItemList` sur les quatre index de hub, et sur les pages
  dossier / tag / auteur. La page auteur porte en plus un `about: Person`.
- Un seul `@graph` par page, `mainEntity` pointant sur l'entité : c'est ce qui
  dit qu'une page **porte sur** la startup au lieu de simplement la mentionner.
- L'éditeur `NewsMediaOrganization` est déclaré une fois et repris par `@id`
  (`PUBLISHER_ID`). **Le Lot 7 devra y rattacher `WebSite` et les articles**,
  qui déclarent encore leur éditeur en toutes lettres.
- `components/JsonLd` échappe `<` en `<`. Un titre contenant `</script>`
  fermait sinon la balise et déversait la suite du document en markup ; les deux
  scripts déjà en place (article, podcast) sont passés par le composant.

**Rien n'est inventé** : chaque propriété vient de `EntityData`, et un champ non
saisi est `undefined`, donc absent du JSON (`JSON.stringify` le supprime). Une
propriété absente est correcte ; une propriété vide ou devinée est un mensonge
adressé à une machine qui ne peut pas le détecter. Les libellés de vocabulaire
passent par `vocabLabel()` : schema.org attend « Série A », pas `serie-a`.

### Le reste

- **Tableau des levées** sous la fiche startup (date, tour, montant,
  investisseurs, source) — la forme lisible de « Meilleures levées de fonds ».
  Un tour sans montant reste une ligne (« Non communiqué ») : le supprimer
  ferait croire que l'entreprise a levé moins souvent qu'en réalité.
- **Lien officiel** des textes juridiques enfin affiché, en `nofollow`, ainsi que
  la date de vérification du statut — ce qui rend la fiche fiable.
- `TOURS` sorti de `collections/Startups.ts` vers `lib/entity-vocab.ts` : dès
  qu'une valeur est rendue côté lecteur, la raison d'être de ce fichier
  s'applique à elle.
- **« À lire aussi » classé par entités partagées** d'abord, puis dossier, puis
  rubrique, puis récence. Quelqu'un qui termine un papier sur la loi 09-08 veut
  les autres papiers sur 09-08, pas la suite d'« Actus juridique ».

---

## 3. Ce qui a été vérifié, et comment

`pnpm build` → 112 routes prérendues, **0 clé `/ar` non encodée** (contrôle du
manifeste refait). Smoke `next start` : 19 URL, 0 échec.

JSON-LD **parsé** (pas grepé) sur 8 pages de hub — `Organization`,
`Legislation`, `Person`, `CollectionPage`, `ItemList` tous présents là où ils
doivent l'être, `mainEntity` pointant bien sur l'entité, `isAccessibleForFree:
true` partout (règle d'or #1). Tableau des levées rendu en FR **et** en AR,
2 lignes, liens de source présents ; aucune propriété `left`/`right` physique
dans la feuille du hub (règle d'or #3).

Les liaisons du seed ont été croisées pour que les hubs affichent réellement
plusieurs articles : 2 sur startup, entreprise et loi 09-08. Sans cela chaque
hub n'en montrait qu'un et la règle de classement n'était jamais exercée.

Le classement « À lire aussi » a été prouvé avec un **article de contrôle
jetable** — même rubrique que la référence, aucune entité — créé avant la
première requête (`loadRows` est mémoïsé par processus, une ligne créée après
la première lecture serait invisible), puis supprimé :

```
0. shared=1 rubrique=SAME  Plateformes numeriques ...
1. shared=1 rubrique=diff  Legaltech ...          <- entite, rubrique differente
2. shared=0 rubrique=SAME  ZZTEST controle        <- rubrique seule, apres
3. shared=0 rubrique=diff  Levees de fonds ...
ENTITY BEATS RUBRIQUE : true · teardown : 0 ligne restante
```

---

## 4. ➜ CE QUI RESTE — reprendre ici

- **Lot 6 — Newsletter et compte gratuit.** `NewsletterForm` existe côté UI ;
  la Server Action, `lib/brevo.ts` et l'ouverture de `Abonnes.access.create`
  (aujourd'hui `isAdmin`, fermé exprès) restent à faire. Ouvrir l'accès **en
  même temps** que le formulaire, avec son rate limiting.
- **Lot 7 — SEO.** `app/sitemap.ts` et `app/news-sitemap/` n'existent pas
  encore ; tant qu'ils n'existent pas, `ROOT_PATHS` dans `lib/revalidate.ts`
  reste vide et un article publié n'entre pas dans le sitemap Google News. À
  faire au passage : rattacher `WebSite` et le `NewsArticle` des articles au
  `PUBLISHER_ID` de `lib/jsonld.ts` (§2), et passer la skill `seo-audit`.
- **Lot 5 — Podcast.** Il ne reste que le choix de l'hébergeur audio et le flux
  RSS : la page, les notes, la transcription et le lecteur embarqué sont faits.

---

## 5. Rappels encore ouverts

- **Deux textes de démonstration codés en dur** deviendront faux le jour où la
  rédaction saisira du vrai contenu : `components/DemoBanner`, monté dans le
  layout, et le « Fiche de démonstration : les informations ci-dessus sont
  fictives » du panneau d'identité (`components/EntityHub`). Les deux restent
  vrais tant que le seed est en base. **À retirer ensemble à la passation du
  Lot 8**, et pas avant — un journal qui affiche des titres fabriqués sans
  marqueur est le seul échec que ce projet ne peut pas se permettre.
- `ROOT_PATHS` dans `lib/revalidate.ts` : tableau vide en attendant le Lot 7.
- `NEXT_PUBLIC_SERVER_URL` : à changer à l'hébergement — base des canonicals, du
  sitemap, des aperçus **et de tous les `@id` du JSON-LD**.
- Pas d'adaptateur e-mail : pas de « mot de passe oublié » (`BACK-OFFICE.md` §10).
- Les libellés arabes de `lib/entity-vocab.ts` (y compris les nouveaux `TOURS`)
  et les gabarits des deux pages juridiques du seed sont des premiers jets : à
  faire valider par le client avant le lancement.
- Les dates de publication au BO des deux textes du seed sont **volontairement
  vides** : mettre une référence officielle approximative sur un site
  d'information juridique est pire que ne rien mettre. C'est à la rédaction de
  les saisir.

---

## 6. Pièges de l'outillage (les pièges produit sont dans `CLAUDE.md` §9)

- **Un `next dev` / `next start` orphelin fausse tout.**
  `Get-NetTCPConnection -LocalPort 3000 -State Listen` en PowerShell.
  ⚠️ `netstat | grep "LISTENING.*:3000"` ne marche PAS : netstat imprime l'état
  APRÈS l'adresse.
- **`pnpm build` peut échouer sur un hoquet Atlas** — `payloadInitError: true`.
  Relancer avant de chercher.
- **`loadRows` / `loadDocs` sont mémoïsés par processus** (`cache` de React).
  Dans un script de vérification, créer les lignes **avant** la première requête,
  sinon la deuxième lecture rend la première, périmée.
- **`slugify` normalise l'arabe** (ة → ه) : relire le slug réellement stocké.
- **`grep` sur du texte accentué est peu fiable dans Git Bash ici.** Utiliser un
  marqueur ASCII (`ZZTEST`). Pour le JSON-LD, ne pas grepper du tout : parser.
- **Les heredocs Bash cassent sur ce contenu** (apostrophes, guillemets
  français, arabe) : écrire le script de patch dans un fichier et l'exécuter.
- **Un PDF de test doit être structurellement valide** (table `xref` comprise) :
  Payload refuse un fragment bricolé avec `Invalid PDF file.`
