# Guide du Système de Licence NexLab (LIMS B2B)

Ce document décrit le fonctionnement global, l'architecture et les procédures d'utilisation du système de licence "Hors Ligne" (Offline Licensing) implémenté dans l'application NexLab CSSB. 

Ce système a été créé pour empêcher la copie non autorisée du logiciel et assurer la rentabilité sous un modèle de facturation par abonnement (SaaS On-Premise).

---

## 1. Comment ça marche ? (Vue d'ensemble)

NexLab LIMS étant déployé de manière **locale (On-Premise)** via Docker dans le laboratoire du client, vous (le développeur) n'avez pas de contrôle à distance direct sur l'extinction du serveur.

Pour pallier cela, le système fonctionne de la manière suivante :
1. **Verrouillage Matériel (Machine ID)** : Lors de sa première installation, l'application génère un identifiant unique stocké de manière persistante (Lié à sa base de données unique).
2. **Le Chiffrement (JWT)** : Vous utilisez un script secret sur votre propre ordinateur (« Générateur ») pour fabriquer un ticket crypté contenant le `MachineId` et la `Date d'Expiration`. C'est la **Clé de Licence**.
3. **Activation** : Le client colle cette clé dans son interface Admin. NexLab la décrypte grâce à un secret partagé interne. Si la clé matche avec la machine et que la date n'est pas passée, l'application se déverrouille (Statut: `ACTIVE`).
4. **Verrouillage Passif (Expiration)** : Si le temps expire, l'interface affiche un bandeau rouge impossible à désactiver, et le serveur API bloque toute tentative de création d'une nouvelle analyse (Code `402 Payment Required`). Le laboratoire peut toujours consulter et imprimer d'anciens dossiers, mais ne peut plus en saisir de nouveaux.

---

## 2. Procédure pour le Vendeur (Vous)

Lorsque vous vendez NexLab à un laboratoire, ou que vous effectuez un renouvellement annuel, voici votre procédure :

### Étape 1 : Obtenir l'Installation ID
Demandez à l'administrateur du laboratoire de se connecter à son compte NexLab et de :
1. Aller dans **Paramètres Système > Licence NexLab**.
2. Copier le **Machine ID** affiché à l'écran (ex: `NXL-4F8A-9B2D`) et vous l'envoyer.

### Étape 2 : Générer la Clé Secret (JWT)
Sur votre propre ordinateur contenant le code source original, ouvrez un terminal et utilisez le script Node généré pour l'occasion.

**Commande :**
```bash
# Dans le dossier de votre projet NexLab
node scripts/generate-license.js <MACHINE_ID_DU_CLIENT> <NOMBRE_DE_JOURS>

# Exemple pour 1 an d'abonnement :
node scripts/generate-license.js NXL-4F8A-9B2D 365
```

Le script va calculer mathématiquement un bloc de texte codé long (commençant généralement par `eyJ...`). C'est votre Clé de Licence !

### Étape 3 : Délivrer au Client
Envoyez cette clé par email (ou par WhatsApp) au client.
Il devra aller dans **Paramètres > Licence NexLab**, coller ce gros bloc de texte dans le champ de texte et cliquer sur **Appliquer**. Le système validera la signature, retirera le bandeau rouge instantanément, et relancera les permissions d'écritures (`POST`).

---

## 3. Comprendre ce qui est bloqué (Read-Only Mode)

Le droit médical européen et maghrébin **interdit de bloquer l'accès aux antécédents médicaux** des patients, même si la clinique refuse de payer.
C'est pourquoi NexLab ne possède pas "d'écran de blocage global". 

**En mode "Licence Expirée"** :
- **🟢 Autorisé :** Connexion, recherche patient, consultation des statistiques financières, impression des anciens bilans et tickets, historique de températures.
- **🔴 Bloqué (Frontend) :** Un large bandeau rouge gâche l'expérience utilisateur de façon permanente.
- **🔴 Bloqué (Backend) :** Le bouton "+" pour enregistrer un nouveau dossier patient échouera systématiquement, rendant impossible l'utilisation commerciale courante du laboratoire.

---

## 4. Architecture Interne (Pour le Développeur)

- **Librairie cryptographique** : L'environnement utilise `jose` (Javascript Object Signing and Encryption). C'est la bibliothèque la plus légère et compatible avec Edge Runtime (Next.js).
- **Le Secret (Salt)** : Dans vos fichiers `lib/license.ts` et `scripts/generate-license.js`, se trouve la phrase de salage (Secret) (`NEXLAB_SECRET_VENDOR...`). **Vous ne devez jamais donner ce script aux clients**, sinon ils pourraient utiliser la phrase de salage pour s'auto-générer des licences valides de 10 ans ! Gardez ce script de génération bien au chaud chez vous.
- **Base de données** : Le statut n'utilise pas de nouvelle table, il s'enregistre de manière élégante et invisible dans la table `Settings` (`key: "machine_id"`, et `key: "license_key"`).
- **Interception** : L'interception est protégée côté Serveur dans `/api/analyses/route.ts` au niveau de la requête `POST()`.

---

## 5. Conseil Marketing & Déploiement

Pour votre **premier* ou *deuxième client**, vous pouvez générer une licence de **3650 jours (10 ans)** pour éviter d'être dérangé, le but étant qu'ils testent et stabilisent le logiciel.
Lorsque vous passerez à la vente commerciale massive d'abonnement, générez des clés exactes de **365 jours**. Envoyez-leur un email d'avertissement automatique (ou manuel) 1 mois avant la fin de leur licence pour qu'ils aient le temps de planifier le paiement.
