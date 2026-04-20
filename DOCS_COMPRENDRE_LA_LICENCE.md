# Comprendre la Technologie de Licence NexLab (Guide Simplifié)

Ce document explique les concepts techniques de votre système de licence en utilisant des analogies simples pour que vous puissiez maîtriser le fonctionnement de votre produit.

---

## 1. Le Secret Partagé (La "Clé de Voûte")

Le cœur du système repose sur une **phrase secrète** (appelée `LICENSE_SECRET`) cachée dans votre code. 

*   **Le concept** : C'est comme une recette de cuisine très complexe que vous seul connaissez. 
*   **Où se trouve-t-elle ?** Elle est écrite sur votre ordinateur (dans le script qui génère la licence) et elle est gravée dans le code de NexLab (dans le programme qui vérifie la licence).
*   **Sécurité** : Si quelqu'un ne possède pas cette phrase exacte, il ne pourra jamais fabriquer une clé que NexLab acceptera.

---

## 2. Le Machine ID (Le "Tatouage" du Serveur)

Puisque NexLab est installé localement chez le client, nous devons être sûrs qu'une licence vendue au "Laboratoire A" ne fonctionnera pas si elle est copiée au "Laboratoire B".

*   **L'analogie** : C'est comme le numéro de châssis d'une voiture.
*   **Le fonctionnement** : À l'installation, NexLab génère un code unique (ex: `NXL-A1B2`). Ce code est propre à la base de données du client.
*   **L'utilité** : Chaque clé de licence que vous allez créer contiendra ce code à l'intérieur. Si NexLab voit que le code dans la licence ne correspond pas à son propre ID, il se bloque.

---

## 3. Le JWT & La Signature (Le "Sceau de Cire")

La clé de licence que vous donnez au client est un **JWT** (JSON Web Token). C'est un bloc de texte qui ressemble à du charabia (`eyJ...`), mais il est composé de deux parties :

1.  **Le Message (Lisible)** : "Cette machine ID `NXL-A1B2` est autorisée jusqu'au 31/12/2026".
2.  **La Signature (Invisible)** : C'est un calcul mathématique qui mélange le **Message** + votre **Phrase Secrète**.

**Analogie du Sceau Royale :**
Imaginez que vous envoyez une lettre. Le Message est le texte de la lettre. La Signature est un **sceau de cire** que vous apposez avec votre bague familiale unique. 
*   Puisque NexLab possède une copie de votre bague (le Secret), il peut vérifier si le sceau est authentique.
*   Si le client change la date dans la lettre (le Message), le sceau de cire se brisera mathématiquement et NexLab verra que la lettre a été falsifiée.

---

## 4. Pourquoi est-ce impossible à "Hacker" par un utilisateur normal ?

### "Peuvent-ils inventer une clé ?"
Non. Pour inventer une clé, ils auraient besoin de votre **Phrase Secrète**. Sans elle, la signature mathématique produite sera toujours fausse.

### "Peuvent-ils changer la date d'expiration ?"
Non. S'ils modifient ne serait-ce qu'un seul pixel de la clé pour essayer de rallonger la date, la **Signature** ne correspondra plus au message. NexLab dira : "Erreur de signature, clé corrompue".

### "Peuvent-ils copier la licence d'un autre labo ?"
Non. NexLab vérifiera le **Machine ID** inscrit dans la clé volée. Comme il ne correspondra pas à l'ID de leur propre machine, la licence sera rejetée.

---

## 5. Le Mode "Consultation" (Read-Only)

C'est votre levier commercial. Une licence expirée ne détruit pas les données (ce qui serait dangereux et illégal), mais elle rend le logiciel **inutile pour travailler**.

*   **Verrouillage API** : Nous avons placé un garde à l'entrée de la fonction "Créer une Analyse". Si la licence n'est pas valide, le serveur répond : *"Erreur 402 : Licence requise"*.
*   **Psychologie** : Le bandeau rouge permanent en haut de l'écran rappelle chaque seconde au personnel que le laboratoire n'est pas en règle, ce qui pousse le directeur à payer rapidement.

---

### En résumé :
Vous êtes le **seul** à détenir le "tampon de cire" (le script générateur). Le client vous envoie son "ID de châssis" (Machine ID), et vous lui renvoyez un "ticket scellé" (JWT) qu'il ne peut ni modifier, ni copier ailleurs.
