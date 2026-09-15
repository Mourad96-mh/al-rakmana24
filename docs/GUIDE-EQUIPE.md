# Donner un rôle à chaque membre de l'équipe — guide pas à pas

Pour l'administrateur du site. Aucune connaissance technique requise : que des
clics.

Situation : vous êtes le propriétaire du journal, vous avez **4 personnes** dans
votre équipe, et vous voulez que chacune puisse travailler dans le site — sans
que tout le monde puisse tout faire.

> Le détail technique de tout ça est dans `BACK-OFFICE.md`. Ici, on clique.

---

## 1. L'idée en trente secondes

Le site a une porte de service : **`votre-site.ma/admin`**. C'est là que l'équipe
écrit les articles.

Vous ne distribuez pas « le mot de passe du site ». Vous **créez un compte par
personne**, et à chaque compte vous attachez un **rôle**. Le rôle décide de ce
que la personne peut faire une fois entrée.

Pensez-y comme à un immeuble : tout le monde entre par la même porte, mais le
badge de chacun n'ouvre pas les mêmes étages.

**Quatre badges existent :**

| Le badge | Ce que la personne peut faire |
| --- | --- |
| **Administrateur** | Tout, y compris créer des comptes et distribuer les badges. C'est le vôtre. |
| **Rédacteur en chef** | Écrire, publier, corriger et supprimer les articles de tout le monde. Voir la liste des abonnés. |
| **Journaliste** | Exactement la même chose que le rédacteur en chef. |
| **Contributeur** | Écrire des brouillons, **les siens uniquement**. Ne peut jamais publier, ni toucher au travail des autres. |

> ⚠️ **À savoir dès maintenant** : aujourd'hui, « Rédacteur en chef » et
> « Journaliste » donnent **exactement les mêmes droits** dans le logiciel. La
> différence est hiérarchique, pas technique. Si vous voulez qu'un journaliste
> ne puisse **pas** supprimer ou publier sans validation, c'est possible — mais
> c'est une modification à demander, ce n'est pas le cas par défaut.

---

## 2. Avant de commencer

Il vous faut trois choses :

1. **Votre compte administrateur.** C'est le tout premier compte créé sur le
   site. Il est automatiquement administrateur. Si vous n'en avez pas encore,
   c'est l'étape d'installation (`pnpm create-admin`) — voir `BACK-OFFICE.md`.
2. **L'adresse e-mail de chacune des 4 personnes.** C'est leur identifiant de
   connexion.
3. **Un mot de passe de départ pour chacune.** Vous le choisissez vous-même,
   maintenant. Prenez long : 12 caractères ou plus, pas le nom du journal.

> **Important à comprendre avant de continuer.** Le site **n'envoie aucun
> e-mail** pour l'instant. Il n'y aura donc **pas** de mail d'invitation
> automatique, et le lien « mot de passe oublié » **ne fonctionnera pas**. C'est
> vous qui transmettez le mot de passe de départ à chaque personne, de la main à
> la main. Ce n'est pas une panne : l'envoi d'e-mails sera branché plus tard.

---

## 3. Exemple : votre équipe de 4

On va prendre une équipe imaginaire pour rendre ça concret. Remplacez par vos
vraies personnes.

| La personne | Son travail | Le badge à lui donner |
| --- | --- | --- |
| **Salma** | Elle dirige la rédaction, elle valide ce qui part en ligne | Rédacteur en chef |
| **Youssef** | Journaliste à plein temps, il publie seul | Journaliste |
| **Imane** | Journaliste à plein temps, elle publie seule | Journaliste |
| **Karim** | Avocat, il écrit une tribune de temps en temps, il n'est pas de la maison | **Contributeur** |

**La règle qui vous évitera 90 % des problèmes :** quelqu'un qui n'est pas
salarié de la rédaction — un pigiste, un expert extérieur, un stagiaire de
première semaine — est un **Contributeur**. Il écrit, quelqu'un de la maison
relit et publie. Rien de ce qu'il fait ne peut partir en ligne tout seul.

---

## 4. Créer le compte de Salma — pas à pas

On le fait une fois en détail. Les trois autres, c'est exactement pareil.

**1.** Ouvrez votre navigateur et allez sur **`votre-site.ma/admin`**.

**2.** Connectez-vous avec **votre** e-mail et **votre** mot de passe
d'administrateur.

**3.** Vous arrivez sur le tableau de bord (« Bonjour, … »). Dans la colonne de
gauche, descendez jusqu'au groupe **Administration**, et cliquez sur
**Utilisateurs**.

> Vous ne voyez pas « Utilisateurs » ? Alors vous n'êtes pas connecté avec un
> compte administrateur. Déconnectez-vous et reconnectez-vous avec le bon.

**4.** Cliquez sur le bouton **Créer**, en haut.

**5.** Remplissez le formulaire :

| Le champ | Ce que vous mettez |
| --- | --- |
| **Nom complet** | `Salma Bennani` — c'est ce qui s'affichera dans le back-office |
| **E-mail** | son adresse professionnelle, c'est son identifiant |
| **Mot de passe** | le mot de passe de départ que vous avez choisi |
| **Confirmer le mot de passe** | le même, à nouveau |
| **Rôle** | ouvrez la liste, choisissez **Rédacteur en chef** |
| **Biographie** | facultatif — à remplir seulement si elle signe des articles |

**6.** Cliquez sur **Enregistrer** (ou **Créer**), en bas ou à droite.

**7.** Envoyez à Salma : l'adresse `votre-site.ma/admin`, son e-mail, et son mot
de passe de départ. **Pas par e-mail en clair** : WhatsApp, un appel, ou
en personne. Et dites-lui de le changer dès sa première connexion (étape 6 plus
bas).

**C'est fait.** Salma peut se connecter tout de suite, il n'y a rien à valider.

---

## 5. Les trois autres

Refaites exactement les étapes 4 à 7, en changeant le rôle :

- **Youssef** → Rôle : **Journaliste**
- **Imane** → Rôle : **Journaliste**
- **Karim** → Rôle : **Contributeur**

Quand vous avez terminé, la page **Utilisateurs** doit afficher **5 lignes** :
vous, Salma, Youssef, Imane, Karim.

---

## 6. Ce que chacun doit faire à sa première connexion

Dites-le à vos 4 personnes, c'est la seule chose qu'on leur demande :

1. Aller sur `votre-site.ma/admin`
2. Se connecter avec l'e-mail et le mot de passe que vous avez donnés
3. Aller sur **`votre-site.ma/admin/account`** (la page « Compte »)
4. Y saisir **un nouveau mot de passe, à elles**, et enregistrer

Personne ne peut modifier son propre rôle depuis cette page — le champ n'est même
pas modifiable pour elles. Elles ne peuvent changer que leur nom, leur
biographie et leur mot de passe. C'est voulu : c'est ce qui empêche quelqu'un de
se donner tout seul les droits d'administrateur.

---

## 7. Ce que chacun verra, concrètement

**Salma, Youssef et Imane** (rédacteur en chef / journalistes) voient :

- le tableau de bord complet : articles publiés, brouillons de toute l'équipe,
  les articles publiés dans une seule langue ;
- toutes les rubriques de la colonne de gauche : Articles, Podcasts, Vidéos,
  Documents, Dossiers, Médias, les entités (Startups, Entreprises,
  Personnalités, Textes juridiques), Auteurs, Mots-clés, Publicités, Newsletter,
  Abonnés ;
- le bouton **Publier** sur chaque article.

**Karim** (contributeur) voit :

- le même tableau de bord, mais le panneau des brouillons s'intitule **« Mes
  brouillons »** et ne contient que les siens ;
- il peut créer un article et l'écrire ;
- il **n'a pas** de bouton pour publier : son texte reste en brouillon, et il
  attend que Salma, Youssef ou Imane le relise et le mette en ligne ;
- il ne voit **ni** la liste des abonnés, **ni** la newsletter, **ni** les
  publicités ;
- dans « Utilisateurs », il ne voit **que sa propre fiche** — pas la liste de
  l'équipe.

**Tout le monde**, y compris vous, voit le site en français, avec l'arabe
disponible.

---

## 8. Plus tard : changer un rôle, ou faire partir quelqu'un

**Karim fait ses preuves, vous voulez qu'il publie seul :**
Utilisateurs → cliquez sur sa ligne → champ **Rôle** → choisissez
**Journaliste** → Enregistrer. C'est immédiat, il n'a rien à faire de son côté
(au pire, se déconnecter et se reconnecter).

**Youssef quitte le journal :**
deux possibilités.

- *Le plus simple et le plus sûr* : Utilisateurs → sa ligne → **Supprimer**. Son
  compte disparaît, il ne peut plus entrer. **Ses articles restent en ligne** —
  ils ne sont pas attachés à son compte mais à sa fiche d'auteur, qui est une
  autre chose (voir plus bas).
- *Si vous hésitez* : passez-le en **Contributeur**. Il garde un accès, mais ne
  peut plus rien publier ni supprimer, en attendant que vous décidiez.

**Quelqu'un a perdu son mot de passe :**
le lien « mot de passe oublié » **ne marchera pas** (pas d'envoi d'e-mail, voir
§2). C'est à vous de le faire : Utilisateurs → sa ligne → saisissez un nouveau
mot de passe → Enregistrer → transmettez-le-lui.

---

## 9. Les 6 erreurs à ne pas commettre

**1. Ne restez jamais le seul administrateur.**
Si votre compte est le seul « Administrateur » et que vous le supprimez, ou que
vous vous rétrogradez par erreur, **plus personne ne peut créer de compte** — il
faudra une intervention technique dans la base de données pour rentrer. Donnez
le rôle Administrateur à **une deuxième personne de confiance**, et à une seule.

**2. Ne donnez pas « Administrateur » à toute l'équipe.**
Un journaliste n'a pas besoin de créer des comptes. Administrateur, c'est vous
et votre bras droit. Point.

**3. Ne créez jamais de compte lecteur ici.**
« Utilisateurs », c'est **la rédaction**. Les lecteurs du site — les gens qui
s'inscrivent gratuitement — sont dans une collection complètement séparée,
« Abonnés ». Ce n'est pas un détail de rangement : c'est ce qui fait que le mot
de passe d'un lecteur **n'ouvre pas du tout** la porte `/admin`. Ne mélangez
jamais les deux.

**4. Un compte = une personne.**
Ne créez pas un compte « redaction@… » partagé à quatre. Le jour où un article
est supprimé par erreur, vous voudrez savoir qui. Et le jour où quelqu'un part,
vous voudrez couper **son** accès, pas celui de tout le monde.

**5. Ne transmettez pas les mots de passe par e-mail en clair.**
Et exigez que chacun change le sien à la première connexion (§6).

**6. « Auteur » et « Utilisateur », ce n'est pas la même chose.**
« Utilisateurs » = qui peut **entrer** dans le back-office.
« Auteurs » = la **signature** affichée au lecteur, en bas de l'article.
Vous pouvez créditer un auteur qui n'a aucun compte (un invité qui envoie sa
tribune par mail), et à l'inverse, créer un compte à quelqu'un qui ne signe
jamais rien (un secrétaire de rédaction). Quand vous supprimez un utilisateur,
vous ne supprimez donc **pas** les signatures de ses articles.

---

## 10. Questions rapides

**« Est-ce que je dois installer quelque chose sur leurs ordinateurs ? »**
Non. Un navigateur et l'adresse `votre-site.ma/admin`. Ça marche aussi depuis un
téléphone, même si écrire un article sur mobile reste inconfortable.

**« Est-ce qu'ils peuvent travailler en même temps ? »**
Oui. En revanche, évitez que deux personnes ouvrent **le même** article en
écriture au même moment : le texte est sauvegardé automatiquement pendant la
frappe, et le dernier qui écrit gagne.

**« Un contributeur peut-il lire les brouillons des autres ? »**
Il ne les voit pas sur son tableau de bord, qui ne montre que les siens. S'il va
fouiller dans la liste complète des articles, il peut les **ouvrir en lecture**,
mais pas les modifier. Si vous voulez un cloisonnement total, c'est une
modification à demander.

**« Et si je veux qu'un journaliste ne puisse pas supprimer d'articles ? »**
Ce n'est pas le comportement actuel — aujourd'hui, journaliste et rédacteur en
chef peuvent supprimer. C'est modifiable, il faut le demander.

**« Combien de personnes puis-je ajouter ? »**
Autant que vous voulez. Il n'y a ni licence ni limite de sièges : le site est le
vôtre.
