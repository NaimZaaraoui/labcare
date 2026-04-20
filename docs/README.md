# Documentation NexLab

Ce dossier centralise la documentation fonctionnelle et technique des features importantes de NexLab.

## Principe

Chaque feature peut avoir 2 documents :

1. `USER.md`
   - explique à l'utilisateur ce que fait la feature
   - explique comment l'utiliser
   - reste simple et opérationnel

2. `DEV.md`
   - explique au développeur comment la feature fonctionne
   - explique les fichiers clés
   - explique les endpoints, scripts, états, limites et points de vigilance

## Structure recommandée

```text
docs/
  features/
    backup-recovery/
      USER.md
      DEV.md
  ui/
    LIS_UI_DIRECTION.md
```

## Features documentées

1. `backup-recovery`

## Documentation transverse

1. `ui/LIS_UI_DIRECTION.md`
   - diagnostic visuel honnête de NexLab
   - direction cible pour un style plus crédible de vrai LIS
   - règles concrètes pour les futurs refactors UI

Ce format a été choisi pour que la documentation reste :

1. simple à retrouver
2. facile à maintenir
3. utile à la fois pour l’exploitation et pour le développement
