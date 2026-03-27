
## STEP 1 — schema.prisma: add three models

model Reagent {
  id           String   @id @default(cuid())
  name         String
  reference    String?  // manufacturer ref
  testsIds       String[] or categoryIds or both maybe, what you think is suitable
  

  unit         String   // mL, tests, boîtes, kits
  currentStock Float    @default(0)
  minThreshold Float    // alert below this
  storage      String?  // Réfrigérateur, Congélateur, Ambiant
  supplier     String?
  notes        String?
  isActive     Boolean  @default(true)
  lots         ReagentLot[]
  movements    StockMovement[]
  createdAt    DateTime @default(now())
}

model ReagentLot {
  id          String   @id @default(cuid())
  reagentId   String
  reagent     Reagent  @relation(fields: [reagentId], references: [id])
  lotNumber   String
  expiryDate  DateTime
  quantity    Float    // quantity received in this lot
  remaining   Float    // current remaining in this lot
  receivedAt  DateTime @default(now())
  isActive    Boolean  @default(true)
}

model StockMovement {
  id          String   @id @default(cuid())
  reagentId   String
  reagent     Reagent  @relation(fields: [reagentId], references: [id])
  type        String   // reception | consumption | adjustment | waste
  quantity    Float    // positive = in, negative = out
  lotNumber   String?  // which lot this movement applies to
  reason      String?  // free text
  performedBy String   // user name
  performedAt DateTime @default(now())
}
```

---

### The pages

**Inventory dashboard** (`/dashboard/inventory`) — the main view. A table of all reagents showing name, category, current stock vs threshold (with a visual progress bar), nearest expiry date across all active lots, and status indicator (OK / Low / Critical / Expired). This is the morning checklist view.

**Reagent detail** (`/dashboard/inventory/[id]`) — full detail of one reagent: all active lots with their expiry dates and remaining quantities, full movement history, and action buttons.

**Two modal actions from the detail page:**
- "Réceptionner un lot" — receive new stock: enter lot number, expiry date, quantity
- "Enregistrer une consommation" — record usage: select which lot, enter quantity used, optional reason

**Reagent configuration** — create and edit reagents (name, category, unit, threshold, storage, supplier). ADMIN only.

---

Here is the prompt:

---
```
## ContextN
All roles can VIEW inventory. Only ADMIN and TECHNICIEN can 
record movements. Only ADMIN can create/edit/deactivate reagents.

---

## STEP 1 — schema.prisma: add three models

model Reagent {
  id           String          @id @default(cuid())
  name         String
  reference    String?
  category     String
  unit         String
  currentStock Float           @default(0)
  minThreshold Float
  storage      String?
  supplier     String?
  notes        String?
  isActive     Boolean         @default(true)
  lots         ReagentLot[]
  movements    StockMovement[]
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
}

model ReagentLot {
  id          String   @id @default(cuid())
  reagentId   String
  reagent     Reagent  @relation(fields: [reagentId], 
                         references: [id], onDelete: Cascade)
  lotNumber   String
  expiryDate  DateTime
  quantity    Float
  remaining   Float
  receivedAt  DateTime @default(now())
  isActive    Boolean  @default(true)
}

model StockMovement {
  id          String   @id @default(cuid())
  reagentId   String
  reagent     Reagent  @relation(fields: [reagentId], 
                         references: [id], onDelete: Cascade)
  type        String   // 'reception'|'consumption'|'adjustment'|'waste'
  quantity    Float    // positive=in, negative=out
  lotNumber   String?
  reason      String?
  performedBy String
  performedAt DateTime @default(now())
}

Give migration command after.

---

## STEP 2 — API routes

### GET /api/inventory/route.ts
- No role restriction (all authenticated users)
- Returns all active reagents with:
  * All fields
  * lots: active lots only, ordered by expiryDate asc
  * _count of movements
  * Computed fields (do in JS after query, not in Prisma):
    - status: 'ok' | 'low' | 'critical' | 'expired'
      * expired = any active lot has expiryDate < today
      * critical = currentStock <= 0
      * low = currentStock > 0 && currentStock < minThreshold
      * ok = currentStock >= minThreshold
    - nearestExpiry: the earliest expiryDate across active lots
      (null if no lots)
    - daysUntilExpiry: Math.ceil((nearestExpiry - now) / 86400000)
- Order: critical/expired first, then low, then ok
  Sort within each group by name alphabetically

### GET /api/inventory/[id]/route.ts
- Returns one reagent with all lots and last 50 movements
- movements ordered by performedAt desc

### POST /api/inventory/route.ts
- ADMIN only
- Body: { name, reference?, category, unit, currentStock?,
          minThreshold, storage?, supplier?, notes? }
- Validate: name, category, unit, minThreshold required
- Return 201 with created reagent

### PATCH /api/inventory/[id]/route.ts
- ADMIN only
- Handles two actions based on body:

  action: 'update' — update reagent fields
    Body: { action:'update', name, reference, category, unit,
            minThreshold, storage, supplier, notes }
    Update the reagent fields only
    Return updated reagent

  action: 'toggle-active' — deactivate/reactivate
    Flip isActive boolean
    Return updated reagent

### POST /api/inventory/[id]/receive/route.ts
- ADMIN or TECHNICIEN
- Body: { lotNumber, expiryDate, quantity }
- Validate all fields required, quantity > 0
- Validate expiryDate is in the future
- In a Prisma transaction:
  * Create ReagentLot with remaining = quantity
  * Create StockMovement type='reception', quantity=+quantity,
    lotNumber, performedBy=session.user.name
  * Update Reagent.currentStock += quantity
- Return updated reagent with new lot

### POST /api/inventory/[id]/consume/route.ts
- ADMIN or TECHNICIEN
- Body: { quantity, lotNumber?, reason? }
- Validate quantity > 0
- Validate currentStock >= quantity (return 400 if insufficient)
- In a Prisma transaction:
  * Create StockMovement type='consumption', quantity=-quantity,
    lotNumber, reason, performedBy=session.user.name
  * Update Reagent.currentStock -= quantity
  * If lotNumber provided: update that ReagentLot.remaining -= quantity
    If remaining <= 0: set lot isActive = false
- Return updated reagent

### POST /api/inventory/[id]/adjust/route.ts
- ADMIN only
- Body: { newStock, reason }
- Compute delta = newStock - currentStock
- In a transaction:
  * Create StockMovement type='adjustment', quantity=delta,
    reason, performedBy=session.user.name
  * Update Reagent.currentStock = newStock
- Return updated reagent

---

## STEP 3 — Inventory dashboard page
## app/dashboard/inventory/page.tsx
## 'use client'

State:
  const [reagents, setReagents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState('all')
    // 'all' | 'low' | 'critical' | 'expired'
  const [search, setSearch]     = useState('')
  const [showCreate, setShowCreate] = useState(false)

Fetch on mount from GET /api/inventory

### Page header:
  Title: "Inventaire des Réactifs"
  Right side: "Ajouter un réactif" button (ADMIN only, 
  check role from session)

### Filter tabs (4 tabs, show count badge on each):
  Tous | En alerte | Stock critique | Expirés

### Search input (filter by name or category client-side)

### Reagent table inside .bento-panel:
  Columns: Réactif | Catégorie | Stock actuel | Seuil | 
           Statut | Prochaine expiration | Actions

  Stock column: show as "X unité" with a small horizontal 
  progress bar below:
    width = Math.min((currentStock / minThreshold) * 100, 100)%
    color: green if ok, amber if low, red if critical/expired

  Status column: use .status-pill:
    ok       → bg-emerald-50 text-emerald-600 "Conforme"
    low      → bg-amber-50 text-amber-600 "Stock faible"
    critical → bg-red-50 text-red-600 "Stock critique"
    expired  → bg-rose-50 text-rose-800 "Périmé"

  Expiry column:
    if daysUntilExpiry <= 30 → show in amber with warning icon
    if daysUntilExpiry <= 0  → show in red "EXPIRÉ"
    if null → "—"

  Actions column:
    "Voir" button → navigates to /dashboard/inventory/[id]

### Empty state: 
  If no reagents: show icon + "Aucun réactif configuré" 
  + "Ajouter le premier réactif" button

### Create reagent modal (when showCreate is true):
  Fields using .input-premium:
    Nom du réactif * 
    Référence fabricant
    Catégorie * (select: Hématologie, Biochimie, Immunologie,
                 Microbiologie, Coagulation, Urologie, Autre)
    Unité * (select: mL, Tests, Boîtes, Kits, Flacons, Unités)
    Seuil minimum * (number)
    Stock initial (number, default 0)
    Stockage (select: Réfrigérateur 2-8°C, Congélateur -20°C,
              Température ambiante, Protégé de la lumière)
    Fournisseur
    Notes
  
  Submit: POST /api/inventory
  On success: close modal, refresh list, show success notification

---

## STEP 4 — Reagent detail page
## app/dashboard/inventory/[id]/page.tsx
## 'use client'

State:
  reagent, loading, showReceive, showConsume, showAdjust (ADMIN)

Fetch on mount from GET /api/inventory/[id]

### Layout: two columns

LEFT COLUMN (wider):
  ### Reagent info card (.bento-panel):
    Header with reagent name, category badge, storage badge
    Grid of info: Reference, Supplier, Unit, Min threshold, Notes
    "Modifier" button (ADMIN only) → opens edit modal

  ### Lots actifs section:
    Title: "Lots en cours"
    Table: N° Lot | Quantité reçue | Restant | Expiration | Statut
    Status per lot:
      expiryDate < today → "Expiré" red pill
      daysUntil <= 30    → "Expire bientôt" amber pill
      else               → "Conforme" green pill
    If no active lots: "Aucun lot actif"

  ### Historique des mouvements:
    Title: "Historique"
    Table: Date | Type | Quantité | N° Lot | Raison | Par
    Type display:
      reception   → green "+X unité" with arrow up icon
      consumption → red "-X unité" with arrow down icon  
      adjustment  → blue "±X unité" with edit icon
      waste       → slate "-X unité" with trash icon
    Show last 50 movements

RIGHT COLUMN (narrower):
  ### Stock actuel card:
    Large number showing currentStock + unit
    Progress bar vs minThreshold
    Status pill (same as list page)
    Nearest expiry date

  ### Actions card:
    "Réceptionner un lot" button → opens receive modal
    "Enregistrer consommation" button → opens consume modal
    "Ajustement manuel" button (ADMIN only) → opens adjust modal

### Receive modal:
  Fields: N° de lot *, Date d'expiration *, Quantité reçue *
  Validate expiry is future date
  Submit: POST /api/inventory/[id]/receive
  On success: reload, show notification "Lot réceptionné — 
  stock mis à jour"

### Consume modal:
  Fields:
    Quantité consommée * (number, max = currentStock)
    N° de lot (select from active lots, optional)
    Motif (text, optional — ex: "Analyse patient", "Contrôle QC")
  Submit: POST /api/inventory/[id]/consume
  On success: reload, show notification

### Adjust modal (ADMIN only):
  Fields:
    Nouveau stock total * (number)
    Raison * (required for adjustments)
  Show computed delta: "Variation: +X unité" or "-X unité"
  Submit: POST /api/inventory/[id]/adjust
  On success: reload, show notification

---

## STEP 5 — Add inventory to Navigation.tsx

In the sidebar SECTIONS, add to 'Principal' group:
  { 
    label: 'Inventaire', 
    icon: FlaskConical,  // or TestTube
    href: '/dashboard/inventory', 
    roles: ['ADMIN','TECHNICIEN','RECEPTIONNISTE','MEDECIN'] 
  }

Import the icon at the top.

---

## STEP 6 — Add inventory alerts to dashboard page.tsx

In the existing dashboard, after the stat cards section,
add a collapsible alert panel that shows when any reagent
needs attention.

Fetch from GET /api/inventory on dashboard load (parallel 
with existing stats fetch).

Show only if there are reagents with status !== 'ok':

  <div style alert-warning or alert-danger styling>
    "X réactifs nécessitent votre attention"
    List up to 3: [name] — [status reason]
    "Voir l'inventaire →" link
  </div>

Use the existing .alert .alert-warning classes.

---

## Constraints
- currentStock on Reagent is always updated in transactions 
  alongside the StockMovement — never update one without the other
- Never allow currentStock to go below 0 from consumption
  (validate server-side, return 400 with French error)
- Expiry validation: never accept a lot with expiryDate in the past
  (return 400 "La date d'expiration est déjà dépassée")
- All movements require performedBy = session.user.name (not id)
  so the name is preserved even if the user is later deactivated
- isActive on Reagent: false = soft delete, never physically delete
- isActive on ReagentLot: set to false when remaining reaches 0,
  or manually by ADMIN
- RECEPTIONNISTE and MEDECIN: read-only access (GET only)
- The category list and unit list are fixed enums in the UI
  but stored as plain strings in the DB for flexibility

---

## Deliverables
1. schema.prisma three new models + migration command
2. app/api/inventory/route.ts (GET list + POST create)
3. app/api/inventory/[id]/route.ts (GET one + PATCH)
4. app/api/inventory/[id]/receive/route.ts (POST)
5. app/api/inventory/[id]/consume/route.ts (POST)
6. app/api/inventory/[id]/adjust/route.ts (POST)
7. app/dashboard/inventory/page.tsx (list + create modal)
8. app/dashboard/inventory/[id]/page.tsx (detail + action modals)
9. Updated Navigation.tsx with inventory link
10. Updated dashboard page.tsx with inventory alert panel