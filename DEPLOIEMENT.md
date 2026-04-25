# NexLab LIMS — Guide de Déploiement

## Architecture recommandée

```
┌───────────────────────────────────────────┐
│             LAN du Laboratoire            │
│                                           │
│  PC Serveur (NexLab)   PC Poste 1        │
│  ┌─────────────────┐   ┌───────────┐     │
│  │  Docker          │   │ Navigateur│     │
│  │  NexLab :80     │◄──│ Chrome    │     │
│  │  SQLite (local) │   └───────────┘     │
│  └────────┬────────┘                     │
│           │         ┌───────────┐        │
│           └────────►│ PC Poste 2│        │
│                     │ Navigateur│        │
│                     └───────────┘        │
└───────────────────────────────────────────┘
```

**Un seul PC sert de serveur**, tous les autres accèdent via le navigateur sur le réseau local.

---

## 1. Prérequis (PC Serveur)

- **OS** : Windows 10/11 ou Linux Ubuntu 22.04+
- **RAM** : Minimum 2 Go (4 Go recommandé)
- **Docker Desktop** installé (Windows) ou Docker Engine (Linux)
- **Port 80** disponible (ou modifier dans `docker-compose.yml`)

---

## 2. Installation initiale

```bash
# 1. Cloner ou copier le dossier NexLab sur le PC serveur
cd /opt/nexlab   # ou C:\nexlab sur Windows

# 2. Créer le fichier de configuration
cp .env.example .env
```

Éditer `.env` et renseigner :
```env
AUTH_SECRET=<générer avec : openssl rand -base64 32>
NEXTAUTH_URL=http://<IP_DU_PC_SERVEUR>
AUTH_TRUST_HOST=true
```

```bash
# 3. Lancer l'application
docker compose up -d

# 4. Vérifier que tout fonctionne
docker logs nexlab-app --tail 30
```

---

## 3. Accès multi-postes (LAN)

### Trouver l'adresse IP du PC serveur

**Linux :**
```bash
hostname -I | awk '{print $1}'
```

**Windows :**
```cmd
ipconfig | findstr "IPv4"
```

### Accès depuis les autres postes

Sur chaque PC du labo, ouvrir le navigateur et aller sur :
```
http://192.168.1.XXX
```
*(remplacez par l'IP réelle du PC serveur)*

> **Conseil** : Configurer une IP fixe sur le PC serveur depuis le routeur (réservation DHCP par adresse MAC) pour que l'adresse ne change jamais.

---

## 4. Mise à jour

```bash
# Depuis le dossier NexLab sur le PC serveur :
chmod +x update.sh
./update.sh
```

Le script va automatiquement :
1. Sauvegarder la base de données avant la mise à jour
2. Arrêter proprement l'application
3. Télécharger et reconstruire la nouvelle version
4. Redémarrer et vérifier que tout fonctionne

---

## 5. Sauvegardes automatiques

Les sauvegardes s'exécutent **automatiquement chaque nuit** (5 minutes après le démarrage du conteneur, puis toutes les 24h).

Elles sont stockées dans le volume Docker `nexlab-db` et accessibles depuis :
- **Interface web** : `Paramètres → Maintenance Base de Données`
- **Cible externe** : configurer un chemin disque/NAS dans les paramètres pour copie automatique

### Sauvegarde manuelle d'urgence

```bash
# Copier la base de données directement
docker exec nexlab-app cp /app/data/nexlab.db /tmp/backup_urgence.db
docker cp nexlab-app:/tmp/backup_urgence.db ./backup_urgence_$(date +%Y%m%d).db
```

---

## 6. Restauration d'urgence

```bash
# 1. Arrêter l'application
docker compose down

# 2. Copier la sauvegarde dans le conteneur arrêté
docker run --rm \
  -v nexlab_nexlab-db:/data \
  -v $(pwd):/restore \
  alpine cp /restore/backup_urgence.db /data/nexlab.db

# 3. Redémarrer
docker compose up -d
```

## 7. Observabilité & Télémétrie (Nouveau)

L'application est dotée d'une page de supervision complète pour analyser la charge CPU, la mémoire RAM, la latence de Prisma et les _Logs_ d'erreur bruts de Node.js.
- **Accès** (Admin) : `http://<IP_SERVEUR>/dashboard/monitoring`
- **Fichier de Logs** : Monté dans le volume Docker à l'emplacement `/app/logs/server-YYYY-MM-DD.log`.

## 8. Commandes utiles

| Action | Commande |
|--------|----------|
| Voir les logs Docker bruts | `docker logs nexlab-app -f` |
| Voir les logs Applicatifs JSON | `cat logs/server-$(date +%F).log` |
| Redémarrer | `docker compose restart` |
| Arrêter | `docker compose down` |
| Statut | `docker ps` |
| Espace disque volumes | `docker system df` |

---

## 8. Configuration réseau avancée (HTTPS)

Si votre réseau dispose d'un nom de domaine local (ex: `nexlab.local`), vous pouvez activer HTTPS avec un certificat auto-signé :

```bash
# Générer un certificat auto-signé
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 3650 -nodes \
  -subj "/CN=nexlab.local"
```

Puis ajouter un reverse proxy (Nginx ou Traefik) devant le conteneur NexLab.

---

> **Support** : En cas de problème, joindre les logs (`docker logs nexlab-app --tail 100`) au rapport d'incident.
