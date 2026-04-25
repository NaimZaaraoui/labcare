# Analysis Status - Quick Reference

## Status Values (6 Total)

```
pending → in_progress → validated_tech → validated_bio → (LOCKED: read-only)
   ↓
   └→ cancelled
```

| Value | Display | Color | When | Read-Only |
|-------|---------|-------|------|-----------|
| `pending` | En attente | Amber | Fresh analysis | ❌ Editable |
| `in_progress` | En cours | Blue | After first result saved | ❌ Editable |
| `validated_tech` | Validé Tech | Cyan | Tech validation done | ❌ Editable |
| `validated_bio` | Validé Bio | Green | Bio validation done (FINAL) | ✅ LOCKED |
| `completed` | Validé | Green | Same as validated_bio | ✅ LOCKED |
| `cancelled` | Annulé | Red | Cancelled | ✅ LOCKED |

## Transitions

### 1️⃣ PENDING → IN_PROGRESS
- **When:** First result saved
- **Where:** `/api/analyses/{id}/results` (PUT)
- **Who:** ADMIN, TECHNICIEN, MEDECIN
- **Code:** [results/route.ts#L80](app/api/analyses/[id]/results/route.ts#L80)
- **Check:** None (automatic)

### 2️⃣ IN_PROGRESS → VALIDATED_TECH
- **When:** Click "Valider" button
- **Where:** `/api/analyses/{id}/validate` (PATCH, type='tech')
- **Who:** TECHNICIEN or ADMIN only
- **Code:** [validate/route.ts#L35-L120](app/api/analyses/[id]/validate/route.ts#L35-L120)
- **Checks:**
  - All results filled & saved
  - At least 1 result exists
  - QC lots compliant today
  - Stock sufficient for automatic consumption
- **Locks:** Stores `validatedTechAt`, `validatedTechBy`, `validatedTechName`
- **Notifies:** MEDECIN + ADMIN (ready for bio validation)

### 3️⃣ VALIDATED_TECH → VALIDATED_BIO (FINAL)
- **When:** Click "Signer" button
- **Where:** `/api/analyses/{id}/validate` (PATCH, type='bio')
- **Who:** MEDECIN or ADMIN only
- **Code:** [validate/route.ts#L135-L170](app/api/analyses/[id]/validate/route.ts#L135-L170)
- **Checks:** Status must be `validated_tech`
- **Locks:** 
  - Stores `validatedBioAt`, `validatedBioBy`, `validatedBioName`
  - Analysis becomes READ-ONLY (all edits blocked)
- **Notifies:** RECEPTIONNISTE + ADMIN (ready to print)

## Permissions Matrix

| Who | Save Results | Tech Validation | Bio Validation | Edit Metadata | Delete |
|-----|--------------|-----------------|----------------|---------------|--------|
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅* |
| TECHNICIEN | ✅ | ✅ | ❌ | ✅ | ✅* |
| MEDECIN | ✅ | ❌ | ✅ | ✅ | ✅* |
| RECEPTIONNISTE | ❌ | ❌ | ❌ | ❌ | ❌ |

*Can only delete if NOT `validated_bio` or `completed`

**Code Locations:**
- [AnalysisContext.tsx#L86-87](components/analyses/AnalysisContext.tsx#L86-L87) — `canTech`, `canBio` flags
- [validate/route.ts#L36-46](app/api/analyses/[id]/validate/route.ts#L36-L46) — Permission checks

## Blocked Transitions

| From | Action | Error | HTTP |
|------|--------|-------|------|
| `validated_bio` | Edit results | "Analyse validée: modification des résultats interdite" | 409 |
| `completed` | Edit results | Same | 409 |
| `validated_bio` | Edit metadata | "Analyse validée: modification interdite" | 409 |
| `completed` | Edit metadata | Same | 409 |
| `validated_bio` | Delete | "Analyse validée: suppression interdite" | 409 |
| `completed` | Delete | Same | 409 |

**Allowed after validation:**
- ✅ View/read
- ✅ Print
- ✅ Email
- ✅ Payment updates
- ❌ Result edits
- ❌ Metadata edits
- ❌ Delete

## UI Status Indicators

**Validation Workflow (2 Steps):**

```
Step 1: Validation Technique
─────────────────────────────────
pending        → In box circle, text "Saisie..."
in_progress    → In box circle, button "Valider" (if canTech)
validated_tech → Green checkmark circle, "Validée le {date}"

Step 2: Validation Biologique  
─────────────────────────────────
in_progress    → Gray circle, text "Verrouillée"
validated_tech → In box circle, button "Signer" (if canBio)
validated_bio  → Green checkmark circle, "Signée le {date}"
completed      → Same as validated_bio
```

**Status Badge Colors:**
- Pending: `bg-amber-50 text-amber-700` (orange/yellow)
- In Progress: `bg-blue-50 text-blue-700` (blue)
- Tech Validated: `bg-cyan-50 text-cyan-700` (cyan)
- Bio Validated/Completed: `bg-emerald-50 text-emerald-700` (green)
- Cancelled: `bg-rose-50 text-rose-700` (red)

## Files to Modify

### To Add/Change Status:
1. [lib/analysis-status.ts](lib/analysis-status.ts) — Add to `ANALYSIS_STATUSES` type & record
2. [components/analyses/AnalysisTableRow.tsx](components/analyses/AnalysisTableRow.tsx) — Update `STATUS_MAP`
3. [lib/types.ts](lib/types.ts) — Update `Analysis` interface if new fields needed
4. [prisma/schema.prisma](prisma/schema.prisma) — Update schema if needed
5. [app/api/analyses/[id]/validate/route.ts](app/api/analyses/[id]/validate/route.ts) — Add validation logic
6. [app/api/analyses/[id]/route.ts](app/api/analyses/[id]/route.ts) — Add lock checks
7. [components/analyses/AnalysisWorkflowActions.tsx](components/analyses/AnalysisWorkflowActions.tsx) — Update UI workflow

## Audit Trail

Every status change logged with:
- Action: `analysis.validate_tech` or `analysis.validate_bio`
- Severity: `INFO`
- User: `userId`, `userName`
- Timestamp: Now
- IP, UserAgent, OrderNumber, Patient info

Search logs: `action LIKE 'analysis.validate%'`

## Related Features

- **QC Readiness:** [lib/qc-readiness.ts](lib/qc-readiness.ts) — Checked during tech validation
- **Inventory:** [lib/inventory.ts](lib/inventory.ts) — Automatic consumption during tech validation
- **Notifications:** [lib/notifications.ts](lib/notifications.ts) — Sent to roles based on transition
- **Payment:** [lib/analysis-updates.ts](lib/analysis-updates.ts) — Can update after final validation
- **Printing:** Allowed from `validated_bio` onwards

## Common Errors & Fixes

### "Validation technique impossible..."
✅ Status must be `in_progress`. Ensure results are saved first.

### "Résultats manquants..."
✅ Fill ALL non-group test results and click Save before validating.

### "Validation technique bloquée: certains QC requis..."
✅ Required QC materials for today are not compliant. Check QC dashboard.

### "Analyse validée: modification interdite"
✅ Analysis is in `validated_bio` or `completed`. These are read-only states.

### "Rôle insuffisant"
✅ User is not authorized for this transition:
- Tech validation requires TECHNICIEN or ADMIN
- Bio validation requires MEDECIN or ADMIN

## Testing the Workflow

```bash
# 1. Create analysis (starts at pending)
POST /api/analyses

# 2. Add first result (auto-transitions to in_progress)
PUT /api/analyses/{id}/results { results: { resultId: "value" } }

# 3. Validate tech (only if TECHNICIEN/ADMIN & QC ready)
PATCH /api/analyses/{id}/validate { type: "tech" }

# 4. Validate bio (only if MEDECIN/ADMIN & status=validated_tech)
PATCH /api/analyses/{id}/validate { type: "bio" }

# 5. Verify locked (all writes now blocked)
PATCH /api/analyses/{id} { ... }  # Returns 409

# 6. Still allowed: print
GET /print/analyses/{id}

# 7. Still allowed: update payment
PATCH /api/analyses/{id} { amountPaid: 100 }
```

---

**Last Updated:** 2026-04-20  
**Audit Completeness:** 100%  
**Files Analyzed:** 15+  

