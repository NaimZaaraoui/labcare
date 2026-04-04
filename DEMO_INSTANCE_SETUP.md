# NexLab Demo Instance Setup

Ce guide sert à préparer une **vraie instance d’essai** que votre collègue ou un laboratoire peut utiliser à distance sans toucher à vos vraies données.

## Objectif

Créer une instance :

1. séparée de votre poste principal
2. séparée de votre vraie base
3. accessible en ligne
4. suffisamment stable pour un essai réel

## Recommandation

Utiliser :

1. un VPS Ubuntu
2. Docker + Docker Compose
3. une base de démonstration uniquement
4. un sous-domaine du type `demo.votredomaine.com`

## Ce qu’il ne faut pas faire

1. ne pas exposer votre poste principal
2. ne pas utiliser vos vraies données patients
3. ne pas donner accès à votre base locale de travail

## Fichiers préparés

Pour la démo, utilisez :

1. `docker-compose.demo.yml`
2. `.env.demo.example`

## Étape 1 : préparer une base de démonstration

Le plus sûr est d’utiliser une base **fictive** ou **nettoyée**.

Idéalement :

1. quelques patients fictifs
2. quelques analyses
3. quelques résultats
4. quelques stocks / QC si vous voulez impressionner
5. aucun vrai patient

### Option simple

Créer une base démo locale, puis l’utiliser pour construire l’image.

Un script a été préparé pour ça :

```bash
npm run demo:prepare-db -- dev.db demo.db
```

Ce script :

1. copie la base source
2. anonymise les patients
3. anonymise les champs patient dans les analyses
4. vide les notifications et les logs d’audit
5. remplace le nom du laboratoire par un libellé de démonstration
6. prépare deux comptes de test

Comptes générés :

1. `admin.demo@nexlab.local` / `DemoLab2026!`
2. `tech.demo@nexlab.local` / `DemoLab2026!`

Important :

Le `Dockerfile` actuel copie `dev.db` dans l’image. Donc avant le build de démo, il faut que `dev.db` corresponde bien à votre **base de démonstration**, pas à des données réelles.

Le plus simple pour la démo est :

```bash
cp demo.db dev.db
```

Puis seulement ensuite faire le build Docker de démonstration.

Si votre `dev.db` actuelle contient des données réelles :

1. faites une copie de sécurité
2. préparez une version de démonstration propre
3. ne poussez jamais de vraie base vers le serveur

## Étape 2 : préparer le VPS Ubuntu

Sur le serveur :

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo systemctl enable docker
sudo systemctl start docker
```

## Étape 3 : copier le projet

```bash
git clone <votre-repo> nexlab-demo
cd nexlab-demo
```

Ou bien transférez votre projet manuellement si le repo n’est pas encore public.

## Étape 4 : préparer l’environnement

Copier le fichier exemple :

```bash
cp .env.demo.example .env.demo
```

Puis remplissez :

1. `AUTH_SECRET`
2. `NEXTAUTH_URL`
3. `INTERNAL_PRINT_TOKEN`
4. `RESEND_API_KEY` seulement si vous voulez tester l’envoi d’emails

Exemple :

```env
AUTH_SECRET=une_cle_tres_longue_et_secrete
NEXTAUTH_URL=https://demo.votredomaine.com
AUTH_TRUST_HOST=true
RESEND_API_KEY=
INTERNAL_PRINT_TOKEN=une_autre_cle_secrete
```

## Étape 5 : lancer l’instance de démo

```bash
docker compose --env-file .env.demo -f docker-compose.demo.yml up -d --build
```

## Étape 6 : vérifier que l’app répond

```bash
docker compose -f docker-compose.demo.yml ps
docker compose -f docker-compose.demo.yml logs -f
```

Puis ouvrez :

```text
http://IP_DU_SERVEUR:3000
```

## Étape 7 : domaine et HTTPS

Pour une vraie impression professionnelle :

1. pointez `demo.votredomaine.com` vers le VPS
2. ajoutez un reverse proxy avec HTTPS

Deux options simples :

1. Nginx + Certbot
2. Caddy

Si vous voulez aller vite, Caddy est souvent plus simple.

## Comptes de démonstration recommandés

Préparez au minimum :

1. un compte `ADMIN`
2. un compte `TECHNICIEN`

Exemple de présentation au collègue :

1. compte admin pour voir toute la plateforme
2. compte technicien pour voir le vrai quotidien labo

## Ce qu’il faut tester avant de donner l’accès

1. connexion / déconnexion
2. création d’un patient
3. création d’une analyse
4. saisie de résultat
5. impression rapport
6. page QC
7. page stock
8. page température

## Limites à annoncer honnêtement

Comme c’est une instance de démonstration :

1. les emails peuvent être désactivés
2. les sauvegardes ne sont pas forcément le point central de la démo
3. les données sont fictives

## Script de lancement utile

Pour redémarrer après une mise à jour :

```bash
docker compose --env-file .env.demo -f docker-compose.demo.yml up -d --build
```

Pour arrêter :

```bash
docker compose -f docker-compose.demo.yml down
```

## Message simple à garder en tête

Le but de l’instance d’essai n’est pas de montrer une infrastructure parfaite.
Le but est de donner au collègue une vraie expérience de NexLab, avec une base de démonstration propre, sur une URL accessible, sans exposer vos vraies données.
