# NexLab Commercial Readiness Plan

Ce document décrit tout ce qu'il faut faire pour faire évoluer NexLab d'une application utile et prometteuse vers un produit commercial vendable à de petits laboratoires privés.

Le but n'est pas de "faire plus de fonctionnalités".  
Le but est de rendre l'application:

- fiable
- prévisible
- supportable
- installable
- maintenable
- vendable sans dépendre de vous à chaque incident

Ce plan est volontairement honnête.  
Aujourd'hui, NexLab est déjà un vrai produit métier, mais il n'est pas encore prêt à être commercialisé sereinement.

## 1. Vérité de départ

NexLab a déjà:

- une bonne profondeur métier
- une vraie logique laboratoire
- un périmètre fonctionnel riche
- une base produit crédible

Mais NexLab n'a pas encore:

- une fiabilité assez calme pour des clients payants
- un packaging assez autonome
- un support assez industrialisé
- un filet de sécurité assez fort
- une exploitation assez simple pour des petits labos

La priorité n'est donc plus d'ajouter beaucoup de modules.  
La priorité est de rendre le produit vendable sans le transformer en source de stress permanent.

## 2. Définir le produit commercial cible

Avant toute vente, il faut figer ce que vous vendez exactement.

### 2.1. Choisir un périmètre "Small Lab Edition"

Le produit commercial ne doit pas être "tout NexLab".  
Il doit être une version stable, simple et facile à supporter.

Pack de base recommandé:

- gestion patients
- création d'analyses
- saisie des résultats
- validation technique / biologique
- impression des rapports
- paiement / quittance
- gestion utilisateurs
- paramètres labo essentiels
- sauvegarde / restauration

Éléments à garder comme secondaires ou optionnels au début:

- exports avancés
- emailing automatisé
- import résultats multi-formats très large
- fonctionnalités très spécifiques à certains labos
- automatisations non encore complètement fiabilisées

### 2.2. Définir le profil client exact

NexLab ne doit pas viser "tous les labos".

Cible recommandée:

- petits laboratoires privés
- faible à moyenne volumétrie
- workflow simple
- peu de postes utilisateurs
- besoin principal: rapidité, clarté, impression, traçabilité

Ne pas viser au début:

- gros laboratoires multisites
- environnement réseau complexe
- intégrations multiples
- exigences réglementaires lourdes de niveau entreprise

### 2.3. Définir ce qui est vendu

Il faut pouvoir formuler le produit en une phrase simple:

"NexLab est une LIMS locale et légère pour petits laboratoires privés, centrée sur la gestion des analyses, la validation, l'impression et la traçabilité."

Si le produit ne peut pas être résumé simplement, il sera plus difficile à vendre, installer et supporter.

## 3. Stabiliser les flux critiques

Un produit commercial n'est pas jugé sur son nombre de pages.  
Il est jugé sur la fiabilité de quelques flux répétés tous les jours.

### 3.1. Flux à rendre irréprochables

1. connexion / déconnexion
2. création d'une analyse
3. sélection patient + tests
4. saisie des résultats
5. sauvegarde des résultats
6. validation technique
7. validation biologique / signature
8. impression du rapport
9. paiement complet / partiel
10. sauvegarde / restauration

### 3.2. Définition de "irréprochable"

Pour chacun de ces flux:

- aucun crash
- aucun comportement ambigu
- aucun bouton trompeur
- état UI cohérent
- message d'erreur clair
- résultat final prévisible

### 3.3. Travail à faire

- tester chaque flux avec une checklist réelle
- corriger les cas limites
- uniformiser les labels
- vérifier les transitions d'état
- supprimer les effets de bord implicites

## 4. Rendre l'installation commercialement acceptable

Aujourd'hui, c'est un des plus gros freins.

Un petit labo ne paie pas seulement pour des fonctionnalités.  
Il paie pour une installation qui ne lui fait pas peur.

### 4.1. Objectif d'installation

Une installation doit être:

- compréhensible
- répétable
- documentée
- testée
- récupérable en cas d'échec

### 4.2. Ce qu'il faut absolument avoir

1. kit d'installation offline stable
2. install Windows clair
3. install Linux clair
4. structure de fichiers documentée
5. configuration `.env` compréhensible
6. procédure de redémarrage simple
7. procédure de mise à jour simple
8. procédure de désinstallation ou de remplacement de machine

### 4.3. Minimum commercial attendu

Le labo doit pouvoir comprendre:

- où sont les données
- comment redémarrer l'app
- comment faire un backup
- comment restaurer
- comment changer le mot de passe admin
- comment configurer l'email si nécessaire

### 4.4. Ce qu'il faut éviter

- dépendre d'explications orales uniquement
- conteneurs aux noms conflictuels
- permissions fragiles
- scripts qui marchent "sur votre machine seulement"
- étapes cachées

## 5. Sauvegarde, restauration et continuité d'activité

Sans cela, il n'y a pas de produit vendable.

### 5.1. Ce qu'un labo doit pouvoir faire

- lancer une sauvegarde
- retrouver où sont les sauvegardes
- restaurer une sauvegarde
- migrer vers un nouveau PC
- redémarrer après incident

### 5.2. Ce qu'il faut prouver

- qu'un backup est réellement exploitable
- qu'une restauration rend l'application fonctionnelle
- que les données critiques sont bien reprises
- que l'utilisateur retrouve son environnement

### 5.3. Livrables à produire

- guide backup
- guide restore
- guide changement de machine
- guide reprise après panne

### 5.4. Vérifications à automatiser ou ritualiser

- test mensuel de restauration
- vérification de cohérence de base
- confirmation visuelle post-restore

## 6. Réduire fortement la dette structurelle

Un produit commercial fragile en interne finit toujours par coûter cher en support.

### 6.1. Travail déjà bien engagé

Vous avez déjà commencé à:

- découper les gros composants
- mutualiser les types
- extraire les logiques répétées
- alléger les pages lourdes

### 6.2. Travail à poursuivre

- sortir les types métier encore dispersés
- centraliser les conventions de statuts
- centraliser calculs et mappings
- réduire les `any`
- réduire les composants restants trop volumineux

### 6.3. Pourquoi c'est commercialement important

Parce qu'une dette structurelle élevée signifie:

- corrections plus lentes
- régressions plus fréquentes
- plus de peur avant chaque mise à jour
- support plus coûteux

## 7. Uniformiser l'expérience utilisateur

Pour un client, l'impression de qualité vient beaucoup de la cohérence.

### 7.1. Zones à uniformiser

- headers de pages
- boutons de retour
- wording
- badges de statut
- formulaires
- tableaux
- modales
- messages d'erreur
- impression

### 7.2. Objectif

L'utilisateur ne doit jamais se demander:

- si un bouton va vraiment faire ce qu'il pense
- si un statut veut dire autre chose selon la page
- si un écran suit des règles différentes

### 7.3. Travail concret

- dictionnaire de labels
- conventions communes de badges
- composants communs de page
- audit visuel des flux principaux

## 8. Fiabiliser l'impression et les documents

Pour de petits labos, l'impression est souvent l'élément le plus visible du produit.

### 8.1. Ce qui doit être stable

- rapport
- facture
- enveloppe
- étiquettes
- carte patient

### 8.2. Ce qui doit être garanti

- pagination correcte
- aperçu rapide
- pas d'artefacts de fond
- pas de clipping
- cohérence navigateur / imprimante
- rendu professionnel constant

### 8.3. Travail recommandé

- tests d'impression sur plusieurs cas
- rapports courts
- rapports longs
- NFS
- avec histogrammes
- avec / sans signature
- avec / sans note globale

## 9. Préparer l'import de résultats comme vraie valeur produit

Si vous voulez garder NexLab utile pour vous et potentiellement vendable, l'import des résultats est une excellente piste.

### 9.1. Objectif

Permettre l'import:

- texte
- CSV
- XLS/XLSX

avec:

- détection des codes connus
- variantes de codes
- variantes de valeurs
- aperçu avant application

### 9.2. Pourquoi c'est stratégique

Cette fonctionnalité:

- fait gagner du temps
- réduit les erreurs de ressaisie
- crée une vraie valeur quotidienne
- renforce NexLab sans l'élargir inutilement

### 9.3. Conditions pour la vendre

Elle doit être:

- tolérante
- claire
- non destructive
- vérifiable avant validation finale

## 10. Ajouter un vrai filet de sécurité automatisé

Sans tests, chaque évolution commerciale devient risquée.

### 10.1. Priorité

Pas besoin de couvrir tout le projet.  
Il faut couvrir les flux qui coûtent le plus cher s'ils cassent.

### 10.2. Tests à avoir

1. login
2. création analyse
3. saisie résultats
4. validation
5. impression
6. paiement
7. backup / restore
8. installation

### 10.3. Types de tests utiles

- tests E2E ciblés
- tests d'API critiques
- quelques tests unitaires sur les helpers métier

### 10.4. Objectif commercial

Réduire les régressions avant livraison chez un labo.

## 11. Standardiser le support

Un produit devient vendable quand il est supportable.

### 11.1. Ce qu'il faut préparer

- FAQ install
- FAQ impression
- FAQ backup
- FAQ restore
- FAQ utilisateurs
- FAQ email

### 11.2. Ce qu'il faut documenter

- comment redémarrer NexLab
- comment faire une sauvegarde
- comment restaurer
- où est la base
- où sont les uploads
- où est le `.env`
- comment changer l'admin
- comment configurer Resend

### 11.3. Ce qu'il faut éviter

- garder les procédures uniquement dans votre tête
- diagnostiquer chaque incident depuis zéro
- dépendre d'un dépannage improvisé

## 12. Définir une stratégie de mises à jour

Avant de vendre, il faut savoir comment on met le produit à jour sans faire peur au client.

### 12.1. Questions à résoudre

- comment versionner l'application
- comment faire les migrations base
- comment sauvegarder avant update
- comment revenir en arrière en cas d'échec

### 12.2. Minimum nécessaire

- une procédure de mise à jour documentée
- une sauvegarde obligatoire avant update
- un plan de rollback
- un changelog minimal

## 13. Clarifier le modèle commercial

Même pour de petits labos, il faut savoir ce qui est vendu.

### 13.1. Modèle simple recommandé au début

- frais d'installation
- frais de configuration initiale
- support mensuel léger ou annuel

### 13.2. Ce qu'il ne faut pas faire trop tôt

- promettre trop d'intégrations
- vendre à des clients trop différents
- accepter des personnalisations infinies

### 13.3. Garder une offre simple

Exemple:

- installation locale
- configuration labo
- formation courte
- support de base
- sauvegarde/restauration documentées

## 14. Définir le minimum avant premier client payant

Avant le premier vrai labo payant, NexLab devrait avoir:

### 14.1. Produit

- flux critiques fiables
- impression stable
- paiement fiable
- validation fiable
- messages clairs

### 14.2. Installation

- kit offline testé
- Windows testé
- Linux testé
- conflits Docker éliminés
- permissions stabilisées

### 14.3. Données

- sauvegarde testée
- restauration testée
- migration machine documentée

### 14.4. Support

- guide utilisateur
- guide installateur
- guide backup/restore
- guide update

### 14.5. Vérification

- tests E2E des flux critiques
- checklist manuelle de livraison

## 15. Ordre recommandé d'exécution

### Phase A. Figer le produit vendable

- définir le périmètre Small Lab Edition
- lister ce qui est dans le produit et ce qui est hors périmètre
- simplifier l'offre

### Phase B. Rendre les flux critiques boringly reliable

- login
- analyse
- résultats
- validation
- impression
- paiement

### Phase C. Solidifier installation et reprise

- kit offline
- Windows / Linux
- backup / restore
- update / rollback

### Phase D. Ajouter le filet de sécurité

- E2E critiques
- tests API critiques
- checklist pré-livraison

### Phase E. Préparer le support client

- documentation
- FAQ
- scripts et procédures

### Phase F. Seulement ensuite: vendre

- un ou deux labos maximum au début
- contexte simple
- faible complexité
- support contrôlé

## 16. Ce qu'il ne faut pas faire maintenant

- élargir fortement le périmètre
- viser de gros labos
- promettre de nombreuses intégrations
- faire trop de personnalisations client
- multiplier les modules avant stabilisation

## 17. Conclusion honnête

NexLab peut devenir un produit commercial pour petits laboratoires privés.  
Mais il ne le deviendra pas parce qu'il a beaucoup de fonctionnalités.

Il le deviendra si:

- le périmètre est clair
- les flux critiques sont fiables
- l'installation est simple
- la reprise est maîtrisée
- le support est documenté
- les changements sont sécurisés

La commercialisation ne dépend pas d'un "grand saut".  
Elle dépend d'une longue phase de réduction du chaos.

Le bon objectif n'est pas:

"faire une LIMS géante"

Le bon objectif est:

"faire une LIMS calme, fiable et utile, que de petits labos peuvent adopter sans peur"
