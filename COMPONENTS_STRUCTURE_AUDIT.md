# Components Structure Audit

Ce document reflète l'état réel du codebase après les dernières vagues de décomposition.

## Objectif

On cherche à garder une base :

1. lisible
2. maintenable seul
3. cohérente côté types et props
4. plus simple à faire évoluer sans recréer de gros fichiers monolithiques

## État actuel

La dette structurelle a déjà nettement reculé sur plusieurs zones importantes :

1. `components/analyses/`
   - `ResultatsForm` a été allégé par extraction de hooks, helpers et sous-composants
   - ses couches `data`, `persistence` et `ui` sont maintenant séparées
   - `AnalyseForm` a été cassé en panels patient/tests
   - `AnalysisResultsPanel` a maintenant sa toolbar et ses rows dédiées

2. `components/tests/`
   - `TestsList` a été recoupé en toolbar, table, modales et types partagés

3. `components/print/`
   - types partagés mutualisés
   - helpers de préparation de données sortis
   - rapport, facture et enveloppe alignés sur la même base

4. dashboard
   - `temperature`, `qc`, `patients`, `inventory`, `exports`, `settings/audit`, `settings/bilans`, `settings/database` ont tous subi une vraie décomposition

5. layout
   - `Header` et `Navigation` ne sont plus des gros blocs uniques

## Tailles actuelles utiles

### Composants encore les plus lourds

1. [RapportImpression.tsx](/home/naim/labcare-cssb/components/print/RapportImpression.tsx) — `639` lignes
2. [AnalysesList.tsx](/home/naim/labcare-cssb/components/analyses/AnalysesList.tsx) — `439` lignes
3. [TestsList.tsx](/home/naim/labcare-cssb/components/tests/TestsList.tsx) — `410` lignes
4. [AnalyseForm.tsx](/home/naim/labcare-cssb/components/analyses/AnalyseForm.tsx) — `384` lignes
5. [ResultatsForm.tsx](/home/naim/labcare-cssb/components/analyses/ResultatsForm.tsx) — `345` lignes
6. [Header.tsx](/home/naim/labcare-cssb/components/layout/Header.tsx) — `211` lignes
7. [AnalysisResultsPanel.tsx](/home/naim/labcare-cssb/components/analyses/AnalysisResultsPanel.tsx) — `176` lignes
8. [Navigation.tsx](/home/naim/labcare-cssb/components/layout/Navigation.tsx) — `109` lignes

### Pages dashboard encore notables

1. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/settings/database/page.tsx) — `832` lignes
2. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/inventory/[id]/page.tsx) — `635` lignes
3. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/temperature/page.tsx) — `391` lignes
4. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/inventory/page.tsx) — `384` lignes
5. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/exports/page.tsx) — `349` lignes
6. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/patients/[id]/page.tsx) — `307` lignes
7. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/settings/audit/page.tsx) — `305` lignes
8. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/temperature/[id]/page.tsx) — `234` lignes
9. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/settings/bilans/page.tsx) — `234` lignes
10. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/patients/page.tsx) — `221` lignes
11. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/qc/page.tsx) — `208` lignes

## Décompositions déjà faites

### Analyses

1. types partagés dans [types.ts](/home/naim/labcare-cssb/components/analyses/types.ts)
2. import Diatron dans [useDiatronImport.ts](/home/naim/labcare-cssb/components/analyses/useDiatronImport.ts)
3. validation/QC dans [useAnalysisValidation.ts](/home/naim/labcare-cssb/components/analyses/useAnalysisValidation.ts)
4. métriques et statuts dans [resultats-metrics.ts](/home/naim/labcare-cssb/components/analyses/resultats-metrics.ts)
5. interactions de liste dans [useResultInteractions.ts](/home/naim/labcare-cssb/components/analyses/useResultInteractions.ts)
6. tri dans [resultats-sorting.ts](/home/naim/labcare-cssb/components/analyses/resultats-sorting.ts)
7. UI workflow dans [AnalysisWorkflowActions.tsx](/home/naim/labcare-cssb/components/analyses/AnalysisWorkflowActions.tsx)
8. toolbar résultats dans [AnalysisResultsToolbar.tsx](/home/naim/labcare-cssb/components/analyses/AnalysisResultsToolbar.tsx)
9. row résultat dans [AnalysisResultRow.tsx](/home/naim/labcare-cssb/components/analyses/AnalysisResultRow.tsx)
10. panels d'`AnalyseForm` dans [AnalysePatientPanel.tsx](/home/naim/labcare-cssb/components/analyses/AnalysePatientPanel.tsx) et [AnalyseTestsPanel.tsx](/home/naim/labcare-cssb/components/analyses/AnalyseTestsPanel.tsx)
11. chargement de `ResultatsForm` dans [useResultatsData.ts](/home/naim/labcare-cssb/components/analyses/useResultatsData.ts)
12. persistance de `ResultatsForm` dans [useResultatsPersistence.ts](/home/naim/labcare-cssb/components/analyses/useResultatsPersistence.ts)
13. utilitaires UI de `ResultatsForm` dans [useResultatsUi.ts](/home/naim/labcare-cssb/components/analyses/useResultatsUi.ts)

### Tests

1. types dans [types.ts](/home/naim/labcare-cssb/components/tests/types.ts)
2. toolbar dans [TestCatalogToolbar.tsx](/home/naim/labcare-cssb/components/tests/TestCatalogToolbar.tsx)
3. table dans [TestCatalogTable.tsx](/home/naim/labcare-cssb/components/tests/TestCatalogTable.tsx)
4. modale éditeur dans [TestEditorModal.tsx](/home/naim/labcare-cssb/components/tests/TestEditorModal.tsx)
5. règles inventaire dans [TestInventoryRulesModal.tsx](/home/naim/labcare-cssb/components/tests/TestInventoryRulesModal.tsx)

### Print

1. types dans [types.ts](/home/naim/labcare-cssb/components/print/types.ts)
2. helpers dans [report-helpers.ts](/home/naim/labcare-cssb/components/print/report-helpers.ts)
3. composants alignés :
   - [RapportImpression.tsx](/home/naim/labcare-cssb/components/print/RapportImpression.tsx)
   - [FactureImpression.tsx](/home/naim/labcare-cssb/components/print/FactureImpression.tsx)
   - [EnvelopeImpression.tsx](/home/naim/labcare-cssb/components/print/EnvelopeImpression.tsx)

### Layout

1. `Header` recoupé avec :
   - [GlobalSearchBox.tsx](/home/naim/labcare-cssb/components/layout/GlobalSearchBox.tsx)
   - [NotificationsMenu.tsx](/home/naim/labcare-cssb/components/layout/NotificationsMenu.tsx)
   - [QcStatusChip.tsx](/home/naim/labcare-cssb/components/layout/QcStatusChip.tsx)
   - [types.ts](/home/naim/labcare-cssb/components/layout/types.ts)
2. `Navigation` recoupée avec :
   - [NavigationBrand.tsx](/home/naim/labcare-cssb/components/layout/NavigationBrand.tsx)
   - [NavigationGroups.tsx](/home/naim/labcare-cssb/components/layout/NavigationGroups.tsx)
   - [NavigationFooter.tsx](/home/naim/labcare-cssb/components/layout/NavigationFooter.tsx)
   - [navigation-helpers.ts](/home/naim/labcare-cssb/components/layout/navigation-helpers.ts)

### Dashboard et modules métier

1. `temperature/`
2. `inventory/`
3. `patients/`
4. `qc/`
5. `audit/`
6. `bilans/`
7. `exports/`
8. `database-settings/`

Ces zones ont désormais des composants et types dédiés au lieu de tout laisser dans les pages.

## Types et props déjà bien harmonisés

1. `components/analyses/types.ts`
2. `components/analyses/analyse-form-types.ts`
3. `components/tests/types.ts`
4. `components/print/types.ts`
5. `components/layout/types.ts`
6. `components/temperature/types.ts`
7. `components/inventory/types.ts`
8. `components/patients/types.ts`
9. `components/qc/types.ts`
10. `components/audit/types.ts`
11. `components/bilans/types.ts`
12. `components/database-settings/types.ts`
13. [settings-schema.ts](/home/naim/labcare-cssb/lib/settings-schema.ts)

## Faiblesses structurelles restantes

### Priorité A

1. [ResultatsForm.tsx](/home/naim/labcare-cssb/components/analyses/ResultatsForm.tsx)
   - n'est plus monolithique
   - reste un centre d'orchestration important, mais la dette a beaucoup reculé
   - la prochaine passe serait surtout de calmer les derniers handlers locaux et le flux de notifications

2. [RapportImpression.tsx](/home/naim/labcare-cssb/components/print/RapportImpression.tsx)
   - beaucoup mieux qu'avant
   - reste malgré tout un template dense avec une hiérarchie métier lourde

3. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/settings/database/page.tsx)
   - grosse page malgré les extractions déjà faites
   - encore candidate à une deuxième vague de découpage

4. [page.tsx](/home/naim/labcare-cssb/app/(app)/dashboard/inventory/[id]/page.tsx)
   - toujours riche en logique métier et actions

### Priorité B

1. [AnalysesList.tsx](/home/naim/labcare-cssb/components/analyses/AnalysesList.tsx)
2. [AnalyseForm.tsx](/home/naim/labcare-cssb/components/analyses/AnalyseForm.tsx)
3. [LeveyJenningsChart.tsx](/home/naim/labcare-cssb/components/qc/LeveyJenningsChart.tsx)
4. [TemperatureMonthlyReport.tsx](/home/naim/labcare-cssb/components/print/TemperatureMonthlyReport.tsx)
5. [QcMonthlyReport.tsx](/home/naim/labcare-cssb/components/print/QcMonthlyReport.tsx)
6. [select.tsx](/home/naim/labcare-cssb/components/ui/select.tsx)

## Recommandation de suite

Le prochain ordre rationnel est :

1. continuer `settings/database`
2. poursuivre `inventory/[id]`
3. revenir sur `RapportImpression`
4. seulement ensuite attaquer les autres composants moyens

## Conclusion honnête

Le codebase n'est plus dans l'état où quelques gros fichiers opaques contrôlent tout.

La situation actuelle est meilleure :

1. les types partagés existent dans la plupart des modules
2. plusieurs zones critiques ont déjà été découpées
3. les priorités restantes sont maintenant plus claires et plus limitées

Le travail à venir est encore réel, mais il est beaucoup plus ciblé qu'au début du chantier.
