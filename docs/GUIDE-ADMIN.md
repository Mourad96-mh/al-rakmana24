# Le back-office au quotidien — guide pratique

Comment se servir de `/admin` pour faire vivre le journal : se connecter, publier
un article, le traduire, ajouter une vidéo, un document, une publicité.

> Les autres documents :
> - **`GUIDE-EQUIPE.md`** — créer les comptes de l'équipe et leur donner un rôle.
> - **`BACK-OFFICE.md`** — la référence technique (comment c'est construit, pour
>   le développeur).

---

## 1. Entrer

Adresse : **`https://al-raqmana24.ma/admin`**
(avant la mise en service du domaine : `http://72.62.155.76/admin`).

On se connecte avec son e-mail et son mot de passe **de la rédaction**. Les
comptes lecteurs (abonnés gratuits) ne fonctionnent pas ici : ce n'est pas une
erreur, c'est voulu.

Mot de passe oublié : il n'y a pas encore d'envoi d'e-mail. Demandez à
l'administrateur de vous en fixer un nouveau ; changez-le ensuite vous-même
depuis **votre compte** (en bas de la barre latérale).

Le site et le back-office tournent sur **le même serveur** : il n'y a rien
d'autre à ouvrir, rien à « mettre en ligne » à part.

---

## 2. L'écran d'accueil

C'est un tableau de bord de rédaction. De haut en bas :

| Bloc | À quoi il sert |
| --- | --- |
| **Bonjour, {nom}.** | Vérifie que vous êtes sur le bon compte. |
| **Quatre boutons** | Publier un article · Ajouter une vidéo · Déposer un document · Réserver un espace publicitaire. 90 % du travail part d'ici. |
| **État du site** | Compteurs cliquables : articles publiés (et brouillons), vidéos, documents, textes légaux, publicités actives. Un **tiret « — »** veut dire « pas pu compter », pas zéro. |
| **Publiés dans une seule langue** | La liste de travail la plus importante — voir §5. |
| **Brouillons récents** | Les 5 derniers brouillons. Un contributeur ne voit que **les siens**. |
| **À vérifier** | Brouillons en attente, emplacements publicitaires vides. |

Sous ce tableau de bord, la liste complète de toutes les rubriques du back-office.

---

## 3. La barre latérale

Rangée par fréquence d'usage, pas par ordre alphabétique :

| Groupe | Ce qu'on y trouve |
| --- | --- |
| **Contenu** | Articles, Podcasts, Vidéos, Documents, Dossiers, Pages (qui sommes-nous, mentions…), **Médias** (images), **Fichiers** (PDF, Word, Excel, ZIP) |
| **Entités** | Startups, Entreprises, Personnalités, Textes juridiques — les fiches qui génèrent automatiquement des pages sur le site (§6) |
| **Rédaction** | Auteurs (les signatures), Mots-clés |
| **Régie** | Publicités |
| **Audience** | Inscrits newsletter, Abonnés (comptes lecteurs) |
| **Administration** | Utilisateurs — les comptes de la rédaction |

Selon votre rôle, certaines entrées n'apparaissent pas : c'est normal.

---

## 4. Publier un article — pas à pas

1. **Articles → Créer** (ou le bouton « Publier un article » de l'accueil).
2. **Titre**, **Chapeau** (320 caractères max), **Corps de l'article**.
   - Le texte est **enregistré tout seul** pendant que vous tapez. Pas de bouton
     « enregistrer » à oublier : fermer l'onglet ne perd rien.
3. Dans la **colonne de droite** :
   - **Format** — Actualité, Analyse, Décryptage, Interview, Tribune, Infographie.
   - **Rubrique** puis **Sous-rubrique** (facultative, mais elle doit appartenir à
     la rubrique choisie, sinon l'enregistrement est refusé).
   - **Date de publication** — ⚠️ une date future **ne programme pas** la
     publication : elle date seulement l'article.
   - **À la une** — pour le mettre en avant sur la page d'accueil.
   - **Signature** — le ou les auteurs affichés au lecteur (voir `Auteurs`).
   - **Image de couverture** — choisissez une image de la médiathèque ou
     téléversez-en une.
4. **Entités citées** (bloc dépliable) : liez les startups, entreprises,
   personnalités et textes juridiques dont parle l'article. Ajoutez dossiers et
   mots-clés. Voir §6 : c'est ce qui fait remonter l'article ailleurs sur le site.
5. **Référencement (SEO)** — facultatif. Vide = le titre et le chapeau servent
   pour Google.
6. **Slug (URL)** — laissez-le vide : il est fabriqué à partir du titre. Une fois
   l'article en ligne, **ne le changez plus** : les liens partagés casseraient.
7. **Publier.** L'article est en ligne **en quelques secondes**, dans la langue où
   il est écrit.

**Contributeur** : vous n'avez pas de bouton « Publier ». Votre article reste en
brouillon jusqu'à ce qu'un journaliste ou le rédacteur en chef le publie. Une
fois publié, vous ne pouvez plus le modifier.

### Corriger un article déjà en ligne

Ouvrez-le, corrigez, **Publier les modifications**. La correction est en ligne en
quelques secondes. Tant que vous n'avez pas republié, le site garde l'ancienne
version — vos modifications restent en brouillon.

### Revenir en arrière

Onglet **Versions** en haut de l'article : les 50 dernières versions, chacune
consultable et restaurable.

### Retirer un article

**Dépublier** le fait disparaître du site (il redevient brouillon). **Supprimer**
l'efface définitivement. Dans les deux cas, sa page cesse de s'afficher.

---

## 5. Français et arabe

C'est **le** point à comprendre.

Un article n'est pas « un article français » et « un article arabe » : c'est
**un seul article, avec deux versions**. On passe de l'une à l'autre avec le
**sélecteur de langue** en haut de l'écran (Français / العربية).

| Partagé entre les deux langues | Propre à chaque langue |
| --- | --- |
| rubrique, sous-rubrique, format, date, « À la une », image de couverture, signature, entités, mots-clés | titre, slug, chapeau, corps, SEO |

Changer la rubrique en arabe la change donc aussi en français.

**Un article sans version arabe n'apparaît pas sur le site arabe.** Il ne s'y
affiche pas en français à la place — c'est voulu : une page arabe en français
serait mal classée par Google et incompréhensible pour le lecteur.

Pour traduire :

1. Tableau de bord → **Publiés dans une seule langue** → cliquez sur l'article.
   Il s'ouvre directement **sur la langue manquante**, formulaire vide.
2. Remplissez titre, chapeau, corps. Laissez le slug vide : il sera généré en
   arabe (les URL arabes sont en arabe, c'est meilleur pour Google).
3. **Publier.** La version arabe est en ligne, et les deux versions se
   signalent l'une l'autre aux moteurs de recherche.

---

## 6. Les fiches « Entités » — le travail qui rapporte le plus

Startups, Entreprises, Personnalités, Textes juridiques : chaque fiche a **sa
propre page** sur le site (`/startups/…`, `/entreprises/…`, etc.).

**Ces pages se remplissent toutes seules** : elles listent tous les articles qui
**lient** l'entité (§4, étape 4). On n'y ajoute jamais d'articles à la main.

Donc : un article qui parle d'une startup **sans la lier** est une page qui ne se
nourrit pas. Si l'entité n'existe pas encore, créez sa fiche (nom, présentation,
logo…), puis liez-la.

- **Startups** : saisissez les **levées de fonds** (une ligne par tour ; montant
  en chiffres, sans espace ni symbole ; vide si non communiqué).
- **Textes juridiques** : c'est ici qu'on dépose le **texte officiel** en
  téléchargement (loi, décret, *Bulletin officiel*), avec son statut et son
  résumé.

---

## 7. Les autres contenus

### Vidéos

On **colle l'URL** YouTube ou Vimeo (lien de partage, lien « watch » ou lien
d'intégration : tous marchent). **Ne jamais téléverser le fichier vidéo.**
Ajoutez une image de couverture en 16:9 ; sinon, une image aux couleurs du
journal s'affiche. La vidéo ne se charge que quand le lecteur clique sur
« lecture » — le site reste rapide.

### Podcasts

Même principe : l'**URL du lecteur** fournie par Ausha ou Acast, jamais le MP3.
Remplissez les notes d'épisode et, si possible, la **transcription** — c'est le
seul texte que Google peut lire.

### Documents (contrats types, attestations, études, synthèses)

Ce sont **nos** documents, sur la page « Documents & modèles ».
- **Description** : deux lignes, ce que contient le document et à qui il sert
  (le PDF lui-même n'est pas lu par Google).
- **Catégorie** : décide la section où il apparaît.
- **Fichier à télécharger** : obligatoire **dans chaque langue**. Pour publier
  la version arabe d'un document, il faut son fichier arabe — le site ne propose
  jamais un PDF français à un lecteur arabe.

⚠️ Les **textes de loi officiels ne vont pas ici** : ils vont dans la fiche
**Textes juridiques** (§6). Deux bibliothèques, qui ne se mélangent jamais.

### Médias et Fichiers

- **Médias** = images uniquement (photos, logos, visuels).
- **Fichiers** = PDF, Word, Excel, ZIP.
- Taille maximale : **25 Mo** par fichier.
- Tout est stocké sur Cloudinary, pas sur le serveur : rien ne se perd lors
  d'une mise à jour du site.

### Pages

Les pages institutionnelles (Qui sommes-nous, La rédaction, Nous rejoindre,
Nous contacter, Confidentialité, Mentions). Elles existent déjà : on les
**modifie**, on n'en crée pas de nouvelles et on ne change pas leur **clé**.

---

## 8. Publicités

**Régie → Publicités → Créer.**

| Emplacement | Format exact de l'image |
| --- | --- |
| Bandeau en tête de page | 970 × 90 |
| Colonne de droite, haut | 300 × 250 |
| Colonne de droite, bas | 300 × 600 |

- **Annonceur** : son vrai nom (il est lu par les lecteurs d'écran).
- **Lien de destination** : URL complète avec `https://`.
- **Début / fin de diffusion** : fin vide = sans échéance.
- **Active** : décochez pour **arrêter** une campagne. Rien à supprimer.
- **Note interne** : contact, bon de commande, montant — jamais affichée.

Un emplacement sans campagne active affiche « Espace publicitaire — réserver
cet espace », avec un lien vers la page contact.

---

## 9. Qui peut faire quoi

| Rôle | Écrire | Publier | Modifier le travail des autres | Supprimer | Gérer les comptes |
| --- | --- | --- | --- | --- | --- |
| Administrateur | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rédacteur en chef | ✅ | ✅ | ✅ | ✅ | — |
| Journaliste | ✅ | ✅ | ✅ | ✅ | — |
| Contributeur | ✅ brouillons | ❌ | ❌ | ❌ | — |

Créer les comptes : `GUIDE-EQUIPE.md`.

---

## 10. Ce qui n'existe pas (encore)

Pour ne pas le chercher :

- **Publication programmée** — une date future ne déclenche rien ; il faut
  cliquer « Publier » au moment voulu.
- **Bouton « Aperçu »** vers le site depuis le formulaire — pour voir le rendu,
  publiez puis ouvrez la page.
- **E-mails automatiques** (invitation, mot de passe oublié) — voir §1.
- **Abonnement payant** — il n'y en aura pas : « S'abonner gratuitement ».

---

## 11. En cas de problème

| Symptôme | Cause probable |
| --- | --- |
| L'article n'apparaît pas sur `/ar` | Il n'a pas de version arabe (§5). |
| L'article n'apparaît pas du tout | Il est encore en **brouillon** — cherchez le bouton « Publier ». |
| « Sous-rubrique invalide » | Elle n'appartient pas à la rubrique choisie. |
| Impossible d'enregistrer un document en arabe | Il manque le **fichier arabe** (§7). |
| L'image refuse de se téléverser | Plus de 25 Mo, ou ce n'est pas une image (→ **Fichiers**). |
| Vous ne voyez pas « Publier » | Vous êtes contributeur : un éditeur publiera. |
| Un lien partagé ne marche plus | Le slug a été modifié après publication. Remettez l'ancien. |
