# NexLab Hardening Plan

Ce document transforme les faiblesses identifiées dans `WEAKNESSES_ROADMAP.md` en ordre d'exécution.

## Phase 1. Stabiliser les flux quotidiens critiques
- [ ] Résultats: alléger et découper `ResultatsForm`
- [ ] Impression: confirmer la fiabilité des pages print dédiées
- [ ] Paiement: vérifier les cas complets, partiels et tiers payant
- [ ] Validation: tester et verrouiller les transitions `in_progress -> validated_tech -> validated_bio`
- [ ] Analyses: vérifier compteurs, badges et statuts affichés

## Phase 2. Réduire la dette structurelle
- [ ] Sortir les types métier locaux dispersés vers des modules partagés
- [ ] Réduire les `any` des zones critiques
- [ ] Extraire les logiques dupliquées de calcul, mapping et statut
- [ ] Réduire les composants trop volumineux

## Phase 3. Solidifier installation et reprise
- [ ] Rendre le kit offline plus autonome et prévisible
- [ ] Tester installation Linux
- [ ] Tester installation Windows
- [ ] Tester un cycle complet backup -> restore
- [ ] Documenter la mise à jour d'une instance déjà installée

## Phase 4. Renforcer la précision métier
- [ ] Centraliser les conventions de mapping codes/valeurs pour imports
- [ ] Revoir TAT, comptages et statuts dérivés pour cohérence totale
- [ ] Vérifier l'alignement QC / inventaire / température avec les usages réels

## Phase 5. Ajouter un filet de sécurité
- [ ] Introduire une vérification automatisée des flux critiques
- [ ] Ajouter des tests ciblés sur impression, paiement, validation et import
- [ ] Réduire la dépendance aux tests manuels de mémoire

## Travail en cours
1. Première passe de durcissement sur `ResultatsForm`
2. Réduction de dette de typage autour de l'édition d'analyse
