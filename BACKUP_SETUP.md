# NexLab Backup Setup Guide

Ce guide sert à configurer les sauvegardes automatiques sur les postes où vous installez NexLab.

## Objectif

Chaque installation doit avoir :

1. une base locale qui fonctionne même sans Internet
2. une sauvegarde automatique chaque nuit
3. une copie sur un disque externe ou un dossier réseau

Le commandement principal est toujours :

```bash
npm run backup:run
```

Cette commande :

1. crée une sauvegarde SQLite
2. crée un bundle de reprise complet
3. applique la rétention
4. copie les fichiers vers la cible externe si elle est configurée

## Avant de commencer

Vérifier sur chaque machine :

1. le projet NexLab fonctionne correctement
2. `npm run backup:run` fonctionne manuellement
3. le chemin de copie externe est configuré dans `Paramètres > Base de données`
4. le disque externe ou le partage réseau est accessible

## Linux

Linux utilise généralement `cron` pour lancer une commande à heure fixe.

### Étapes

1. Ouvrir le terminal sur la machine hôte
2. Aller dans le dossier du projet
3. Tester manuellement :

```bash
cd /chemin/vers/nexlab
npm run backup:run
```

4. Ouvrir la configuration cron :

```bash
crontab -e
```

5. Ajouter cette ligne :

```bash
0 2 * * * cd /chemin/vers/nexlab && npm run backup:run >> backups/backup.log 2>&1
```

### Signification

- `0 2` = à 02:00
- `* * *` = tous les jours
- `>> backups/backup.log 2>&1` = enregistre le résultat dans un journal

### Vérification

Le lendemain :

```bash
tail -n 50 /chemin/vers/nexlab/backups/backup.log
```

## Windows

Sous Windows, utiliser le Planificateur de tâches.

### Étapes

1. Créer un fichier `run-backup.bat` dans le dossier du projet :

```bat
@echo off
cd /d C:\nexlab
npm run backup:run >> backups\backup.log 2>&1
```

2. Ouvrir `Planificateur de tâches`
3. Créer une tâche de base
4. Nom conseillé : `NexLab Nightly Backup`
5. Déclencheur : tous les jours à 02:00
6. Action : démarrer un programme
7. Programme/script :

```text
C:\nexlab\run-backup.bat
```

### Vérification

Le lendemain, vérifier :

```text
C:\nexlab\backups\backup.log
```

## macOS

Sur macOS, vous pouvez utiliser `launchd` ou `cron`. Pour une installation simple, `cron` reste acceptable.

### Option simple avec cron

1. Tester :

```bash
cd /Users/installateur/nexlab
npm run backup:run
```

2. Ouvrir cron :

```bash
crontab -e
```

3. Ajouter :

```bash
0 2 * * * cd /Users/installateur/nexlab && npm run backup:run >> backups/backup.log 2>&1
```

### Option plus propre avec launchd

Créer un fichier plist si vous voulez une intégration plus native macOS. Si nécessaire, vous pourrez le faire plus tard, mais pour de petites installations le cron suffit souvent.

## Que faut-il sauvegarder

Le système protège principalement :

1. la base de données SQLite
2. les fichiers `public/uploads`
3. les bundles de reprise
4. les paramètres utiles à la restauration

## Recommandation terrain

Pour les petits laboratoires :

1. laisser NexLab fonctionner localement
2. brancher un disque externe dédié aux sauvegardes
3. programmer la sauvegarde chaque nuit à 02:00
4. vérifier une fois par semaine que les backups existent

## Test pratique après installation

Après configuration, faire ce contrôle :

1. lancer manuellement `npm run backup:run`
2. vérifier qu’une sauvegarde apparaît dans `Paramètres > Base de données`
3. vérifier qu’un bundle de reprise apparaît aussi
4. vérifier que la cible externe est marquée accessible
5. vérifier que le journal `backup.log` se remplit

## Message simple pour le directeur

Le laboratoire fonctionne localement, sans dépendre d’Internet pour le travail quotidien. Chaque nuit, une sauvegarde automatique est créée et peut être copiée sur un disque externe. Ainsi, si le poste principal tombe en panne, les données du laboratoire peuvent être restaurées.
