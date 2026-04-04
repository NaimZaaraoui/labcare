# NexLab Weaknesses Roadmap

Ce document liste les faiblesses actuelles de NexLab de la façon la plus honnête possible, pour servir de base de travail.  
Le but n'est pas de dévaloriser l'application, mais d'identifier ce qui limite aujourd'hui sa robustesse, sa maintenabilité et sa crédibilité produit.

## 1. Product Maturity

### 1.1. Le produit est large mais encore inégal
- NexLab couvre beaucoup de domaines: analyses, résultats, QC, inventaire, température, audit, exports, impression, sauvegarde.
- Mais la qualité n'est pas encore homogène entre les modules.
- Certaines zones paraissent solides, d'autres paraissent encore en construction.

### 1.2. Trop de fonctionnalités ont grandi avant la stabilisation
- L'application a gagné vite en profondeur.
- La dette principale n'est plus le manque de modules, mais le manque de consolidation.
- Le risque est que chaque nouvelle fonctionnalité augmente la fragilité globale.

### 1.3. Le comportement produit n'est pas encore toujours prévisible
- Certaines actions semblent simples côté utilisateur, mais déclenchent des effets secondaires complexes.
- On découvre encore des cas où le comportement réel n'est pas exactement celui attendu.

## 2. Reliability and Runtime Stability

### 2.1. L'application reste sensible à des bugs transverses
- Plusieurs problèmes rencontrés récemment n'étaient pas dans la logique labo elle-même, mais dans:
- impression
- build
- migrations
- Docker
- permissions
- params async de Next.js
- typage TypeScript

### 2.2. Les flux critiques ne sont pas encore "boringly reliable"
- Un bon produit labo doit rendre ennuyeux les flux critiques:
- ouvrir une analyse
- saisir
- valider
- imprimer
- payer
- sauvegarder
- restaurer
- installer
- aujourd'hui, ces flux fonctionnent, mais pas encore avec une fiabilité assez routinière

### 2.3. Certaines régressions réapparaissent facilement
- petits problèmes de styling
- compteurs faux
- labels incohérents
- imports/exports partiellement alignés
- boutons ou modales avec comportement inattendu

## 3. Architecture and Code Quality

### 3.1. L'architecture a plus "poussé" qu'elle n'a été conçue globalement
- C'est normal dans un projet solo ambitieux.
- Mais cela produit:
- logique dispersée
- conventions parfois variables
- patterns non uniformes

### 3.2. Certaines logiques métier sont dupliquées
- calculs
- affichage de statuts
- unités/devise
- navigation retour
- impression
- règles de comptage ou de mapping
- cela augmente le risque d'incohérence

### 3.3. Beaucoup de composants sont trop chargés
- `ResultatsForm` en particulier concentre beaucoup de responsabilités:
- chargement de données
- saisie
- impression
- notes
- paiement
- validation
- email
- import
- QC readiness
- édition de méta-données
- plus un composant grossit, plus il devient fragile à faire évoluer

### 3.4. Le typage TypeScript n'est pas encore homogène
- il reste des `any`
- des castings défensifs
- des ajustements au cas par cas
- cela rend le code moins sûr qu'il pourrait l'être

### 3.5. Le codebase contient encore des zones patchées
- certaines corrections ont été faites en réaction à des bugs précis
- elles sont utiles, mais le système global manque encore de refactorisation stratégique

## 4. UX and Design System Consistency

### 4.1. Le design system est meilleur qu'avant, mais pas encore totalement systématique
- il y a maintenant un langage visuel clair
- mais certains écrans ou composants s'en écartent encore

### 4.2. L'uniformité des interactions n'est pas complète
- boutons retour
- labels
- wording
- panels
- badges
- formulaires
- comportement mobile
- impressions

### 4.3. Certaines pages ont encore une densité ou hiérarchie discutable
- certains écrans métiers sont très puissants mais très chargés
- certains blocs sont encore plus fonctionnels qu'élégants

### 4.4. L'expérience d'impression a été trop liée au contexte applicatif
- l'impression depuis des pages lourdes a montré que le flux n'était pas assez isolé
- cela a créé une expérience lente et peu rassurante

## 5. Printing and Document Workflows

### 5.1. Les documents imprimés sont visuellement forts mais techniquement sensibles
- rapports
- factures
- enveloppes
- cartes
- étiquettes
- ce sont des parties très visibles, mais aussi très faciles à fragiliser

### 5.2. Le moteur d'impression a montré plusieurs fragilités
- preview lente
- dépendance au contexte React lourd
- nécessité d'isoler les pages print

### 5.3. Le système d'impression est encore trop artisanal
- il fonctionne
- mais il demande encore des ajustements fins au lieu d'être complètement industrialisé

## 6. Installation, Deployment, and Environment Management

### 6.1. L'installation n'est pas encore assez autonome
- elle est bien meilleure qu'avant
- mais elle dépend encore beaucoup de votre compréhension technique

### 6.2. Docker marche, mais le packaging n'est pas encore "plug and trust"
- droits sur fichiers exportés
- comportement de démarrage
- Prisma au runtime
- compatibilité offline
- détails Linux/Windows
- raccourcis bureau

### 6.3. Le système est encore trop sensible à l'environnement d'exécution
- machine Linux vs Windows
- Docker permissions
- chemins
- port bind
- fichiers locaux
- ce genre de sensibilité nuit à la tranquillité d'un vrai déploiement

### 6.4. Les mises à jour futures risquent d'être délicates
- sans stratégie claire de versioning/migration utilisateur
- chaque update peut devenir stressante

## 7. Database, Migrations, and Data Safety

### 7.1. Les migrations Prisma ont déjà montré des états cassés
- c'est un signal important
- un produit labo ne peut pas dépendre d'une chaîne de migration fragile

### 7.2. SQLite est adapté à votre contexte actuel, mais demande de la discipline
- SQLite n'est pas le problème principal
- le vrai enjeu est:
- backup
- restore
- volume Docker
- copie externe
- test de reprise

### 7.3. Le système de sauvegarde est bon, mais encore jeune
- il existe vraiment
- mais il demande encore:
- automatisation bien cadrée
- vérification régulière
- pédagogie installateur
- simplicité d'usage

### 7.4. Le restore doit être considéré comme un flux critique à tester régulièrement
- un backup non testé n'est jamais totalement rassurant

## 8. Business Logic and Domain Precision

### 8.1. Certaines règles métier restent implicites ou locales
- TAT
- comptage des analyses
- paiement
- affichages dérivés
- importation automate
- le danger est que la règle soit correcte à un endroit et différente ailleurs

### 8.2. Les conventions de mapping labo doivent être centralisées
- alias de codes
- unités
- valeurs qualitatives
- normalisation
- règles de panels
- sinon, le système devient difficile à maintenir

### 8.3. Certains modules sont fonctionnels mais pas encore vraiment "institutionnalisés"
- QC
- inventaire
- température
- audit
- ils existent, mais leurs workflows doivent encore être polis pour devenir vraiment calmes et évidents

## 9. Testing and Verification

### 9.1. Le projet n'a pas encore un filet de sécurité assez fort
- trop de bugs sont découverts en usage manuel
- cela ralentit énormément la confiance

### 9.2. Il manque encore des tests ciblés sur les flux les plus importants
- analyses
- résultats
- paiement
- validation
- impression
- backup/restore
- installation

### 9.3. Trop de vérifications reposent encore sur votre mémoire
- cela devient dangereux à mesure que l'app grandit

## 10. Maintainability for a Solo Developer

### 10.1. Le projet est déjà lourd pour une seule personne
- pas seulement en code
- aussi en support mental
- chaque module ajouté crée une responsabilité permanente

### 10.2. Certaines zones sont coûteuses à modifier
- résultats
- impression
- build/deploy
- Prisma/runtime
- auth/roles

### 10.3. Le projet risque de devenir fatiguant s'il n'est pas simplifié
- ce n'est pas un problème d'ambition
- c'est un problème de soutenabilité

## 11. Commercial Readiness Weaknesses

### 11.1. Le produit n'est pas encore assez autonome pour des clients multiples
- install
- support
- diagnostics
- update
- recovery
- configuration

### 11.2. Il dépend encore trop de vous
- si chaque labo a besoin de vous pour:
- installer
- configurer
- dépanner
- restaurer
- adapter
- alors ce n'est pas encore un vrai produit scalable

### 11.3. Le coût caché de support serait énorme
- ce point seul peut tuer une tentative commerciale solo

## 12. Documentation and Operational Clarity

### 12.1. La documentation s'améliore, mais elle reste encore partielle
- certaines parties sont bien expliquées
- d'autres restent connues surtout par vous

### 12.2. Il manque encore une séparation nette entre:
- documentation utilisateur
- documentation installateur
- documentation technique
- documentation de reprise

## 13. What These Weaknesses Mean in Practice

Ces faiblesses ne veulent pas dire que NexLab est mauvais.  
Elles veulent dire que NexLab est:

- fonctionnellement ambitieux
- métierment pertinent
- techniquement encore jeune
- structurellement encore inégal
- trop dépendant de son créateur

## 14. Main Strategic Truth

Le problème principal de NexLab aujourd'hui n'est plus:
- "il manque encore beaucoup de fonctionnalités"

Le problème principal est devenu:
- "les fonctionnalités existantes doivent devenir fiables, cohérentes et supportables"

## 15. Summary of Priority Weakness Families

Si on résume toutes les faiblesses en grands blocs:

1. fiabilité quotidienne insuffisamment stable
2. architecture encore trop dispersée
3. composants critiques trop lourds
4. installation et déploiement encore fragiles
5. dette de cohérence UX
6. dépendance excessive à vous
7. tests insuffisants
8. packaging/support non encore assez autonomes

## 16. Working Principle for the Next Phase

La bonne question pour la suite n'est pas:
- "quelle nouvelle feature peut-on ajouter ?"

La bonne question est:
- "qu'est-ce qui empêche NexLab d'être calme, prévisible et solide dans les flux déjà présents ?"

