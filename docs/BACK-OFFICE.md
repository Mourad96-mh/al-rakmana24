# Le back-office Al-Raqmana24 — comment il fonctionne

Document de référence sur `/admin` : qui y entre, ce que chacun peut y faire,
comment l'écran d'accueil est construit, et ce qui n'est pas encore branché.

Les règles d'or sont dans `/CLAUDE.md` — elles priment sur ce document.

> Vous cherchez juste à **créer les comptes de votre équipe** ? C'est
> `GUIDE-EQUIPE.md`, écrit pour être suivi sans rien connaître au code.

---

## 1. En une phrase

`/admin` est le panneau Payload 3, servi par **le même processus Node que le
site** (route group `app/(payload)/`) ; il authentifie contre la collection
`Users` et **uniquement** elle ; son écran d'accueil a été remplacé par un
tableau de bord de rédaction qui répond à « qu'est-ce que je publie ce matin ? »
plutôt qu'à « quelles collections existent ? ».

Il n'y a **rien à déployer séparément** : les pages publiques et le back-office
sortent du même serveur. Un article enregistré est en base immédiatement.

---

## 2. Qui entre — et pourquoi il y a deux collections de comptes

| Collection | Qui | Accès à `/admin` |
| --- | --- | --- |
| `Users` | la rédaction (staff) | oui, selon le rôle |
| `Abonnes` | les lecteurs, comptes gratuits | **jamais**, structurellement |

`payload.config.ts` déclare `admin.user: Users.slug`. Payload authentifie le
formulaire `/admin/login` contre **cette seule collection**. Un lecteur n'est
donc pas « un utilisateur au rôle faible » : son mot de passe **n'entre pas dans
la serrure**. Le refus ne dépend plus d'une règle d'accès correcte.

Conséquences concrètes :

- `Abonnes` n'a **aucun champ `role`** — un lecteur ne peut pas être promu.
- Sur une requête publique, `req.user` est un `Abonne`, sans `role` : tous les
  helpers de `lib/payload-access.ts` échouent en fermé sans cas particulier.
- `staffAdminPanel` (dans `access.admin` de `Users`) reste une **seconde
  serrure**, pour le cas d'un compte staff dont on a réduit le rôle après coup.
- La liste des abonnés est **consultable par les rôles éditoriaux seulement**
  (`read: isEditorial`) et modifiable par un admin. Ce sont des adresses e-mail
  de lecteurs, donc des données personnelles au sens de la loi 09-08 : un
  contributeur extérieur n'en a aucun besoin pour écrire, et l'entrée
  « Abonnés » ne s'affiche même pas dans sa barre latérale.

### Le premier compte

**Ne jamais** créer le premier admin via `/admin/create-first-user` sur un hôte
joignable : Payload sert cet écran tant que `users` est vide, donc la fenêtre
appartient à qui trouve `/admin` en premier.

```
ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NOM=... pnpm create-admin
```

Idempotent, ne réécrit jamais un mot de passe existant, refuse de tourner si la
collection n'est pas vide. À lancer **avant** que le DNS pointe sur la machine.

Le hook `beforeChange` de `collections/Users.ts` force `role: 'admin'` sur le
tout premier enregistrement — filet de sécurité, parce que `adminFieldOnly`
retire `role` d'un formulaire sans session et que le défaut `contributeur`
laisserait le propriétaire enfermé dehors. Il ne se déclenche **que** tant que la
collection est vide.

---

## 3. Les rôles

Quatre rôles, tous staff (`lib/payload-access.ts`) :

| Rôle | Rédiger | Publier | Éditer le travail d'un autre | Supprimer | Gérer les comptes |
| --- | --- | --- | --- | --- | --- |
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `redacteur-en-chef` | ✅ | ✅ | ✅ | ✅ | — |
| `journaliste` | ✅ | ✅ | ✅ | ✅ | — |
| `contributeur` | ✅ (brouillons) | ❌ | ❌ | ❌ | — |

Le contributeur est confiné à **ses propres documents non publiés**
(`canUpdateContent` renvoie un `Where` : `creePar = lui` ET `_status ≠ published`).
Une fois l'article publié, il lui échappe : le rouvrir est une décision d'éditeur.

Deux détails qui comptent :

- Le verrou est **côté serveur, pas dans l'UI**. Payload n'a pas de contrôle
  d'accès au niveau du champ `_status`, donc sans le hook
  `enforceDraftForContributors`, un contributeur publierait en POSTant
  `{"_status":"published"}` directement sur l'API REST, bouton grisé ou pas.
- `creePar` (champ caché, lecture seule) est de la **donnée d'autorisation**, pas
  une signature. La signature affichée au lecteur, c'est la relation `auteurs`,
  qui est autre chose : un journaliste peut déposer le texte d'un contributeur
  extérieur, et inversement.

`Auteurs` est une **signature, pas un compte** : on peut créditer quelqu'un qui
n'a jamais de login, et un `Users` n'est pas automatiquement un auteur.

---

## 4. L'écran d'accueil — le tableau de bord

Le tableau de bord par défaut de Payload est la liste à plat de toutes les
collections, par ordre alphabétique dans chaque groupe. C'est une carte de **la
base de données**, pas du métier : un rédacteur qui arrive à 7h veut publier, pas
parcourir dix-huit collections.

Le nôtre est monté **au-dessus** de cette liste
(`admin.components.beforeDashboard`) — la liste Payload reste en dessous, intacte.

De haut en bas :

**1. Salutation** — « Bonjour, {nom}. » Le nom vient de `user.nom`. Vide, la
virgule disparaît.

**2. Quatre actions** — publier un article · ajouter une vidéo · déposer un
document · réserver un espace publicitaire. Ce sont des liens directs vers le
formulaire de création. C'est 90 % du travail quotidien.

**3. État du site** — cinq compteurs cliquables : articles publiés (avec le
nombre de brouillons en indice), vidéos, documents & modèles, textes légaux,
publicités actives.

> `null` ≠ `0`. Une requête qui échoue affiche un **tiret cadratin** ; une
> collection vide affiche **0**. Un tableau de bord qui jetterait une exception
> enfermerait toute la rédaction dehors pour un chiffre dont personne n'a
> besoin : chaque requête est donc enveloppée dans un `try/catch` qui dégrade
> vers `null`.

**4. « Publiés dans une seule langue »** — le panneau qui justifie l'écran.

`localization.fallback` est à `false` (règle d'or #2) : un article sans version
arabe n'est pas « partiellement traduit », il est **absent de `/ar`**, en
silence. Rien dans l'UI Payload ne le dit — l'éditeur voit un article publié et
suppose qu'il est en ligne dans les deux langues. Ici, ça devient une liste de
travail.

Chaque ligne affiche le titre dans la langue **qui existe**, un badge « Arabe
manquant » / « Français manquant », et le lien ouvre l'article
**`?locale=<langue manquante>`** — donc directement le formulaire vide à
remplir, pas la version déjà écrite.

La détection se fait en **une seule requête** grâce à `locale: 'all'` : Payload
renvoie alors chaque champ localisé sous la forme `{ fr, ar }` au lieu d'en
résoudre un, et la comparaison se fait en mémoire. Un article vide des deux côtés
n'est pas un trou de traduction — il est ignoré.

Le scan est plafonné aux **100 articles publiés les plus récents** (`GAP_SCAN`) :
ça tourne à chaque chargement du tableau de bord, et balayer cinq ans d'archives
pour remplir un panneau de cinq lignes serait une taxe sur chaque matinée. Le
créneau récent est aussi le plus utile — un article de 2027 jamais traduit est
une décision, un article de cette semaine est un oubli.

Si la vérification elle-même échoue, le panneau dit **« Vérification des
traductions indisponible »**. « On n'a pas pu vérifier » ne doit jamais
s'afficher comme « tout est traduit ».

**5. « Brouillons récents »** — les cinq derniers articles en `draft`, triés par
`updatedAt`, titrés dans la langue disponible.

> **Sauf pour un contributeur**, à qui le panneau montre **ses** brouillons et
> s'intitule « Mes brouillons ». `canUpdateContent` le confine aux documents
> qu'il a créés et n'a pas publiés : la liste complète était donc une suite de
> titres qu'il ne peut pas ouvrir en écriture, et du travail inachevé de ses
> collègues qu'il n'a aucune raison de lire. Le compteur « brouillons » et
> l'alerte « À vérifier » utilisent **la même clause** que la liste — un panneau
> « Mes brouillons » au-dessus d'un chiffre comptant tout le journal serait pire
> que l'un ou l'autre seul. Les chiffres de **publiés** ne sont jamais réduits :
> un article publié est sur le site.

**6. « À vérifier »** — des phrases, pas des chiffres : « N article(s) en
brouillon… », « N emplacement(s) publicitaire(s) sans campagne active ». Rien à
signaler → une ligne qui le dit.

**7. Rappel bilingue** en pied d'écran : un contenu sans version arabe
**n'apparaît pas** sur `/ar` et ne bascule jamais en français. C'est voulu.

### Comment c'est construit

Deux fichiers, et la séparation est intentionnelle :

| Fichier | Rôle |
| --- | --- |
| `components/admin/Dashboard/Welcome.tsx` | **Données.** Server component, tourne dans l'admin, fait les requêtes Payload. |
| `components/admin/Dashboard/DashboardView.tsx` | **Mise en page pure.** N'importe rien de Payload, ne connaît ni la base ni la requête. |

Pourquoi : `DashboardView` peut être monté avec des données d'exemple, **sans
base de données** (§9), et chaque état — rédaction active, installation neuve,
requête en échec — peut être regardé côte à côte au lieu d'être attendu.

**Ajouter un panneau = l'ajouter aux deux.** Le type et le markup dans
`DashboardView`, la requête dans `Welcome`.

Les libellés vivent dans l'objet `T` de `DashboardView`, en FR et AR, choisis par
`i18n.language`. L'écran passe en RTL via `dir` sur sa section.

> ⚠️ Les chemins de `admin.components` sont résolus par le loader Payload contre
> `importMap.baseDir`, **pas** par le résolveur de modules — la règle d'or #5
> (imports relatifs) ne s'y applique donc pas, mais il faut relancer
> `pnpm payload -- --use-swc generate:importmap` après chaque modification de ce
> bloc. Sinon l'admin rend le composant par défaut **et rien ne dit pourquoi**.

---

## 5. La barre latérale — 18 collections, 6 groupes

L'ordre du tableau `collections` de `payload.config.ts` **est** l'ordre de la
barre latérale, dans chaque groupe. Il suit la fréquence à laquelle la rédaction
y touche, pas l'alphabet.

| Groupe | Collections |
| --- | --- |
| **Contenu** | `Articles` `Podcasts` `Videos` `Documents` `Dossiers` `Pages` `Media` `Fichiers` |
| **Entités** | `Startups` `Entreprises` `Personnalites` `TextesJuridiques` |
| **Rédaction** | `Auteurs` `Tags` |
| **Régie** | `Publicites` |
| **Audience** | `Newsletter` `Abonnes` |
| **Administration** | `Users` |

Le groupe **Entités** n'est pas de la documentation : chaque relation posée sur
un article fait apparaître cet article sur `/{lang}/startups/{slug}`,
`/{lang}/textes-juridiques/{slug}`, etc., **automatiquement**. Rien n'est curé à
la main. Un article qui cite une startup sans la lier est une page manquée.

---

## 6. La boucle d'édition d'un article

1. **Créer** — `Articles` a `versions.drafts` avec `autosave` toutes les
   **800 ms**. Le texte est sauvegardé pendant la frappe ; il n'y a pas de bouton
   « enregistrer le brouillon » à oublier.
2. **Écrire** — titre, chapeau (320 caractères max), corps en Lexical. Les champs
   `required` localisés sont validés **par locale** : requis dans la langue qu'on
   écrit, absents dans celle qu'on n'écrit pas. Personne n'est forcé d'inventer
   un titre arabe pour enregistrer un article français.
3. **Classer** — dans la colonne latérale : format, rubrique, sous-rubrique, date
   de publication, « À la une », signature, image de couverture.
4. **Lier** — le bloc dépliable « Entités citées » (startups, entreprises,
   personnalités, textes juridiques), plus dossiers et mots-clés.
5. **Publier** — un seul bouton, sauf pour un contributeur.

`maxPerDoc: 50` : l'historique garde les cinquante dernières versions par
document, consultables et restaurables depuis l'onglet « Versions ».

Champs **localisés** : `title`, `slug`, `excerpt`, `body`, `seo`.
Champs **partagés** entre FR et AR : `publishedAt`, `rubrique`, `sousRubrique`,
`coverImage`, `format`, `aLaUne`, `accessLevel` et **toutes** les relations.
Changer la rubrique côté arabe la change côté français — c'est le même article.

Le sélecteur de langue de l'admin bascule entre les deux versions du **même**
document. Il n'y a pas deux articles.

### `accessLevel`

Le champ existe, il est **dormant**, et il le reste (règle d'or #1 : pas de
paywall, « s'abonner gratuitement »). Défaut `public`. Ne rien construire dessus.

---

## 7. Médias, fichiers, régie

**`Media` = images uniquement.** Payload génère des rendus (redimensionnements)
pour ce qui y atterrit, ce qui n'a aucun sens pour un PDF, et la médiathèque doit
rester consultable par un photographe.

**`Fichiers` = PDF / DOC / XLS / ZIP.** Même mécanique, corpus séparé.

Les deux montent sur **Cloudinary**, jamais sur le disque du serveur applicatif :
ce disque est éphémère sur tous les hébergeurs envisagés.
`lib/cloudinary-storage.ts` implémente l'interface officielle
`plugin-cloud-storage` à la main (les deux paquets communautaires sont des
impasses). Limite : **25 Mo** — relevée de 10 pour la bibliothèque de
téléchargements, un *Bulletin officiel* scanné passe couramment les 10 Mo, et un
upload qui échoue dans le back-office, une rédaction le contourne en envoyant le
fichier par mail — c'est exactement ce que la fonctionnalité remplace.

**Deux bibliothèques de téléchargement, et elles ne fusionnent jamais**
(instruction client) : `Documents` (contrats types, attestations, études — notre
matériel, sur `/{lang}/documents`) d'un côté ; le texte officiel accroché à
`TextesJuridiques.fichier` de l'autre, pour qu'un texte garde **une seule URL**
avec son résumé, son statut et nos articles.

**`Publicites`** : trois emplacements (bandeau de tête 970 × 90, colonne de
droite 300 × 250, colonne de droite 300 × 600). Le format est imposé par
l'emplacement — une image au mauvais rapport est centrée dans le cadre, pas
étirée. Pour éteindre une campagne, on **décoche « Active »** : rien à supprimer.
Un emplacement sans campagne active affiche côté site « Espace publicitaire —
réserver cet espace », et c'est le compteur que surveille le panneau
« À vérifier ».

---

## 8. L'habillage du panneau

- `components/admin/Graphics/Logo.tsx` et `Icon.tsx` remplacent les graphiques
  Payload (les chevrons `<>` du logo).
- `app/(payload)/custom.css` applique la charte.

> ⚠️ **Piège, il a déjà coûté une session.** Les variables Payload sont déclarées
> dans `@layer payload-default`. Une déclaration **sans layer** — tout
> `custom.css` — l'emporte toujours sur une déclaration dans un layer, quelle que
> soit la spécificité. Une règle `:root` écrite ici s'applique donc **aussi au
> thème sombre** et écrase la valeur inversée que Payload y met. Sans conséquence
> pour une couleur de marque ; **bug** pour toute variable que Payload inverse en
> sombre (`--theme-elevation-1000` est la couleur du **texte** de tout l'admin :
> la forcer partout rendait le back-office noir sur noir). Ces variables-là
> doivent être limitées au thème clair, et via `html:not([data-theme='dark'])` —
> pas `[data-theme='light']`, parce que tant que l'utilisateur n'a pas choisi de
> thème, Payload ne pose aucun attribut.

L'interface de l'admin est en **français**, l'arabe disponible
(`i18n.supportedLanguages`, `fallbackLanguage: 'fr'`).

---

## 9. `/apercu-admin` — l'aperçu hors base

`app/(preview)/apercu-admin/` monte le même `DashboardView` que l'admin, avec des
données d'exemple et **aucune connexion à MongoDB**.

Raison d'être : Payload refuse de démarrer sans base, donc tant que
`DATABASE_URI` est vide, **rien** sous `/admin` ne rend — pas même le balisage.
Cette page permet de travailler la maquette maintenant.

C'est un **échafaudage, pas une fonctionnalité** : `dynamic = 'force-static'`,
`notFound()` en production, `robots: noindex`, et son propre `<html>` minimal qui
n'importe ni `globals.css` ni le CSS Payload (l'importer ramènerait tout le
runtime admin, ce qui annulerait l'intérêt). **À supprimer dès que `/admin`
tourne.**

---

## 10. Ce qui n'est pas encore branché

À la date de ce document, et pour éviter de promettre au client ce qui n'existe
pas :

- **Les pages publiques ne lisent pas encore la base.** C'est le point le plus
  important de cette liste. Les routes de `app/(frontend)/` s'alimentent à
  `lib/demo/` — des données de démonstration en dur — et non à Payload : il n'y
  a ni `lib/payload.ts` ni `lib/queries.ts` (Lot 3, toujours ⬜). Concrètement :
  un article publié depuis `/admin` est bien en base, mais **n'apparaît pas sur
  le site**, et un article du jeu de démonstration s'y affiche même s'il
  n'existe dans aucune collection. Vérifié : le slug réel
  `plateformes-numeriques-cadre-juridique-dedie` répond 404 en ligne, tandis que
  le slug de démonstration `reforme-cadre-juridique-plateformes-numeriques` est
  prérendu.
- **La revalidation après publication existe et fonctionne**
  (`lib/revalidate.ts`, branchée sur les 12 collections publiques) : une
  publication, une dépublication ou une suppression marque tout l'arbre
  `/[lang]` comme périmé, dans les deux locales. Un autosave de brouillon ne
  déclenche rien. Mais tant que le point précédent tient, elle ne peut faire
  réapparaître que des données de démonstration : la boucle est prête, elle
  n'est pas encore branchée sur du vrai contenu.
- **L'aperçu en direct.** `Articles.admin.preview` renvoie `() => null` : pas de
  bouton « Aperçu » vers le site depuis le formulaire.
- **La publication programmée.** Une `publishedAt` future **ne programme rien** :
  elle date l'article, c'est tout. Le champ le dit dans sa description.
- **L'inscription publique des abonnés.** `Abonnes.access.create` est `isAdmin`,
  volontairement fermé jusqu'au **Lot 6** : la route d'inscription doit arriver
  **avec** son rate limiting et sa capture de consentement, pas des mois avant.
  Une route de création de compte ouverte sur une collection qu'aucune
  fonctionnalité n'utilise encore n'est que de la surface d'attaque.
- **Les envois de fichiers.** `DATABASE_URI` est désormais renseigné — `/admin`
  démarre et `pnpm build` prérend les pages depuis la base — mais
  **`CLOUDINARY_URL` est vide**. Le plugin de stockage n'a donc pas de
  destination : tant qu'elle manque, tout upload dans `Media` ou `Fichiers`
  échouera, et avec lui l'image de couverture d'un article.
- **Pas d'adaptateur e-mail.** `payload.config.ts` n'en déclare aucun, donc
  Payload ne peut envoyer ni invitation ni lien « mot de passe oublié » : le mot
  de passe initial d'un compte est celui que l'admin saisit dans le formulaire,
  et la personne le change ensuite depuis `/admin/account`. Brevo est déjà prévu
  pour la newsletter — c'est le transport évident le jour où on branche ça.

---

## 11. Checklist avant de toucher au tableau de bord

- [ ] Nouveau panneau → type + markup dans `DashboardView`, requête dans
      `Welcome`.
- [ ] Toute requête nouvelle est dans un `try/catch` qui dégrade vers `null` /
      `undefined` — jamais vers un zéro mensonger.
- [ ] Libellés ajoutés **dans les deux langues** dans l'objet `T`.
- [ ] `admin.components` modifié → `pnpm payload -- --use-swc generate:importmap`.
- [ ] CSS : aucune couleur en dur, et relire le piège des `@layer` du §8.
- [ ] Écran vérifié en RTL (`ar`) autant qu'en LTR.
- [ ] `pnpm lint` ✓, `pnpm build` ✓, smoke sur `next start` — **jamais** de build
      pendant qu'un `next dev` tourne (règle d'or #6 et §9 de `/CLAUDE.md`).
