# Système de Sauvegarde et Restauration NexLab

Ce document résume ce qu’il faut savoir pour présenter, installer et expliquer le système de sauvegarde et de reprise de NexLab à un client.

## 1. Philosophie générale

NexLab fonctionne en mode **local-first** :

1. le laboratoire travaille localement sur son propre poste ou serveur
2. l’activité quotidienne ne dépend pas d’Internet
3. les données sont protégées par des sauvegardes automatiques et des bundles de reprise

Ce choix est particulièrement adapté aux petits et moyens laboratoires qui ont besoin de :

1. stabilité
2. simplicité
3. rapidité
4. autonomie en cas d’Internet instable

## 2. Ce que NexLab protège

Le système de reprise protège principalement :

1. les patients
2. les analyses
3. les résultats
4. les utilisateurs
5. les paramètres
6. le stock / inventaire
7. le contrôle qualité
8. la température
9. les journaux d’audit contenus dans la base
10. les fichiers utiles dans `public/uploads` comme signatures ou cachets

## 3. Les deux niveaux de protection

### Sauvegarde

La sauvegarde est une **copie de la base SQLite**.

Elle sert à :

1. protéger rapidement les données principales
2. restaurer la base après une erreur ou une corruption
3. conserver plusieurs versions selon la politique de rétention

### Bundle de reprise

Le bundle de reprise est un **paquet complet de récupération**.

Il contient :

1. la base SQLite
2. les fichiers `public/uploads`
3. un manifeste
4. des instructions de restauration

Il sert à :

1. reconstruire le système après panne du poste
2. transférer NexLab vers une autre machine
3. restaurer plus complètement qu’une simple base

## 4. Ce qui existe aujourd’hui dans NexLab

Le système actuel permet :

1. créer une sauvegarde locale
2. créer un bundle de reprise
3. télécharger une sauvegarde
4. télécharger un bundle
5. restaurer depuis l’interface admin
6. importer un bundle provenant d’un autre poste
7. appliquer une politique de rétention
8. copier les fichiers vers une cible externe
9. afficher l’état des sauvegardes dans le LIMS
10. journaliser les actions sensibles dans l’audit log

## 5. Cas d’usage à expliquer au client

### Cas 1 : l’application marche encore, mais les données doivent être restaurées

L’admin peut :

1. ouvrir `Paramètres > Base de données`
2. choisir une sauvegarde ou un bundle
3. cliquer sur `Restaurer`

Dans ce cas, la reprise se fait directement dans l’interface.

### Cas 2 : le poste principal est perdu ou remplacé

Le laboratoire peut :

1. réinstaller NexLab sur une nouvelle machine
2. se connecter en admin
3. aller dans `Paramètres > Base de données`
4. importer le bundle `.tar.gz`
5. cliquer sur `Restaurer`

Ainsi, le directeur n’a pas besoin de vous appeler pour chaque incident tant que le bundle de reprise est disponible.

## 6. Pourquoi on ne dépend pas d’un cloud

Le système n’est pas centré sur un cloud obligatoire parce que :

1. beaucoup de laboratoires ont une connexion instable
2. les données médicales sont sensibles
3. le travail quotidien doit rester possible même hors ligne
4. un système local bien sauvegardé est souvent plus réaliste pour un petit laboratoire

Le modèle retenu est donc :

1. LIMS local
2. sauvegarde nocturne
3. copie vers disque externe ou dossier réseau

## 7. Ce que vous devez recommander aux clients

Pour une installation sérieuse :

1. laisser NexLab fonctionner localement
2. programmer la sauvegarde automatique chaque nuit
3. utiliser un disque externe dédié ou un dossier réseau
4. vérifier régulièrement que la copie externe est accessible
5. faire un test de reprise de temps en temps

## 8. Message simple pour un directeur de laboratoire

Vous pouvez présenter le système ainsi :

> NexLab fonctionne localement pour rester rapide et indépendant d’Internet. Chaque nuit, il peut créer automatiquement une sauvegarde et un bundle de reprise. Ces fichiers peuvent être copiés sur un disque externe. Si le poste principal tombe en panne, le laboratoire peut être restauré sur une nouvelle machine.

## 9. Commande technique principale

La commande de sauvegarde automatique est :

```bash
npm run backup:run
```

Elle :

1. crée une sauvegarde SQLite
2. crée un bundle de reprise
3. applique la rétention
4. copie les fichiers vers la cible externe si elle est configurée

## 10. Ce que montre l’interface NexLab

La page `Paramètres > Base de données` affiche :

1. le dernier backup
2. l’état des sauvegardes
3. les alertes si la sauvegarde est trop ancienne
4. l’état du chemin externe
5. les bundles disponibles
6. l’historique des actions liées aux backups

## 11. Limite importante à expliquer honnêtement

Si les sauvegardes restent uniquement sur le même poste, elles peuvent être perdues avec lui.

Donc la vraie sécurité nécessite :

1. des sauvegardes régulières
2. une copie vers un emplacement externe

## 12. Position commerciale honnête

Ce système n’est pas juste un bouton export.  
C’est une vraie stratégie de continuité pour petit laboratoire :

1. travail local
2. protection régulière
3. reprise autonome
4. historique des opérations

Pour un petit ou moyen laboratoire, c’est une base sérieuse et crédible.
