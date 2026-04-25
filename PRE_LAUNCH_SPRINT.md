# NexLab — Pre-Launch Sprint

Les 4 points critiques à résoudre avant de vendre la première licence.

---

## Fix 1 — Catalogue de Tests Complet 🧪

**Problème** : Le seed de démo contient 6 tests. Un laboratoire CSSB réel en a entre 60 et 120. Quand un acheteur ouvre la démo, il voit une page quasi-vide et n'imagine pas la puissance de l'outil.

**Solution** : Enrichir `api/setup/route.ts` avec un catalogue médical complet :
- NFS complète (12 paramètres : Hb, VGM, TGMH, CCMH, GB avec différentielle, PLT)
- Bilan rénal (Créatinine, Urée, Acide Urique, Clairance)
- Ionogramme (Na, K, Cl, Ca, Mg)
- Bilan hépatique (ASAT, ALAT, GGT, PAL, Bilirubine)
- Bilan thyroïdien (TSH, T3, T4)
- Sérologies (CRP, VS, ASLO, Widal)
- Bilan lipidique (Cholestérol, Triglycérides, HDL, LDL)

**Statut** : [ ] À faire

---

## Fix 2 — Setup Wizard UI Polishing 🎨

**Problème** : Le wizard d'initialisation (`/app/setup/wizard/page.tsx`) est un fond sombre avec des champs basiques. Le reste de l'app est Premium Bento. La première impression d'un acheteur ou d'un technicien IT doit être aussi bonne que le dashboard.

**Solution** :
- Refaire le fond avec le beau gradient `indigo` brand de NexLab
- Ajouter une `Stepper Bar` visuelle au-dessus propre
- Améliorer les champs avec labels et transitions Tailwind premium
- Ajouter une étape de "Prévisualisation" avant la soumission finale

**Statut** : [ ] À faire (sera abordé séparément)

---

## Fix 3 — Error Monitoring en Production 🚨

**Problème** : Des `console.error()` partout, mais aucune alerte réelle. Si une analyse plante silencieusement à 3h du matin, personne ne le sait jusqu'au lendemain matin. Pour un dispositif médical, c'est une vraie responsabilité.

**Solution** :
- Créer un `lib/logger.ts` robuste (déjà partiellement fait) avec capture des erreurs critiques
- Ajouter un webhook `Error Handler` global dans Next.js (`app/error.tsx` + `app/global-error.tsx`)
- Intégrer un alerting visuel admin sur le dashboard monitoring (badge rouge si des erreurs critiques sont loggées dans les 24h)

**Statut** : [x] Terminé — `app/(app)/error.tsx`, `app/global-error.tsx` et `api/log-client-error/route.ts` créés

---

## Fix 4 — Print Workflow Hardening 🖨️

**Problème** : L'impression repose sur une iframe cachée (`printToken` en URL). Ça fonctionne à 95% mais l'automate ou le navigateur peut bloquer la requête silencieusement, et le technicien croit avoir imprimé alors que ce n'est pas le cas.

**Solution** :
- Ajouter un `onLoad` + `timeout` à l'iframe d'impression avec détection d'échec
- Afficher une notification Toast `Impression réussie ✓` ou `Impression échouée — réessayer`
- Proposer un bouton "Ouvrir dans un nouvel onglet" comme fallback visible

**Statut** : [ ] À faire

---

## Ordre d'exécution recommandé

| # | Fix | Impact Commercial | Effort Est. |
|---|-----|-------------------|-------------|
| 1 | Catalogue de tests complet | ⭐⭐⭐⭐⭐ Critique | 3h |
| 2 | Setup Wizard UI | ⭐⭐⭐ Modéré | 2h |
| 3 | Error Monitoring | ⭐⭐⭐⭐ Élevé | 4h |
| 4 | Print Hardening | ⭐⭐⭐⭐ Élevé | 2h |
