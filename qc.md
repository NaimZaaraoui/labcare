// A control material product
model QcMaterial {
  id          String    @id @default(cuid())
  name        String    // "Bio-Rad Liquichek Level 1"
  level       String    // "Normal" | "Pathologique" | "Critique"
  manufacturer String?
  isActive    Boolean   @default(true)
  lots        QcLot[]
  createdAt   DateTime  @default(now())
}

// A specific lot of a control material
model QcLot {
  id           String      @id @default(cuid())
  materialId   String
  material     QcMaterial  @relation(...)
  lotNumber    String
  expiryDate   DateTime
  isActive     Boolean     @default(true)
  targets      QcTarget[]  // target values per parameter
  results      QcResult[]
  openedAt     DateTime    @default(now())
}

// Target mean + SD for one parameter in one lot
model QcTarget {
  id        String  @id @default(cuid())
  lotId     String
  lot       QcLot   @relation(...)
  testCode  String  // "HB", "PLT", "GLU", etc.
  testName  String
  mean      Float
  sd        Float
  unit      String?
}

// One QC run — one recording session
model QcResult {
  id          String    @id @default(cuid())
  lotId       String
  lot         QcLot     @relation(...)
  values      QcValue[]
  performedBy String
  performedAt DateTime  @default(now())
  comment     String?
  status      String    // 'pass' | 'warn' | 'fail'
}

// One measured value within a QC run
model QcValue {
  id        String   @id @default(cuid())
  resultId  String
  result    QcResult @relation(...)
  testCode  String
  measured  Float
  // Computed and stored for fast Levey-Jennings rendering:
  zScore    Float    // (measured - mean) / sd
  flag      String   // 'ok' | 'warn' | 'fail'
}
```

---

## The Westgard rules (simplified for your first version)

When a new QC result comes in, evaluate these rules automatically:

| Rule | Meaning | Action |
|---|---|---|
| 1-3s | One value beyond ±3SD | Reject — error |
| 2-2s | Two consecutive values beyond same ±2SD | Reject — systematic error |
| 1-2s | One value beyond ±2SD | Warning — investigate |
| Within ±1SD | All good | Pass |

Store the computed `zScore` with each value so the Levey-Jennings chart can render without recalculating.

---

## The pages

**QC Dashboard** (`/dashboard/qc`) — shows today's QC status across all active lots. Green/amber/red per lot. The QC status pill in the header finally has real data behind it.

**QC entry form** — select a lot, enter measured values for each configured parameter, system immediately shows pass/warn/fail per parameter.

**Levey-Jennings chart** — for each parameter, a line chart of the last 30 results with mean and ±1SD/2SD/3SD reference lines. Uses `recharts` which is already in your ecosystem.

**Lot configuration** — create material, create lot, configure targets (mean + SD per parameter).

---

## The prompt
```
## Context
All roles can VIEW QC results.
ADMIN and TECHNICIEN can enter QC results.
Only ADMIN can configure materials, lots, and targets.

---

## STEP 1 — schema.prisma: add QC models

model QcMaterial {
  id           String   @id @default(cuid())
  name         String
  level        String   // 'Normal' | 'Pathologique' | 'Critique'
  manufacturer String?
  isActive     Boolean  @default(true)
  lots         QcLot[]
  createdAt    DateTime @default(now())
}

model QcLot {
  id         String     @id @default(cuid())
  materialId String
  material   QcMaterial @relation(fields: [materialId],
               references: [id], onDelete: Cascade)
  lotNumber  String
  expiryDate DateTime
  isActive   Boolean    @default(true)
  targets    QcTarget[]
  results    QcResult[]
  openedAt   DateTime   @default(now())
}

model QcTarget {
  id       String  @id @default(cuid())
  lotId    String
  lot      QcLot   @relation(fields: [lotId],
             references: [id], onDelete: Cascade)
  testCode String
  testName String
  mean     Float
  sd       Float
  unit     String?
}

model QcResult {
  id          String    @id @default(cuid())
  lotId       String
  lot         QcLot     @relation(fields: [lotId],
                references: [id], onDelete: Cascade)
  values      QcValue[]
  performedBy String
  performedAt DateTime  @default(now())
  comment     String?
  status      String    // 'pass' | 'warn' | 'fail'
}

model QcValue {
  id       String   @id @default(cuid())
  resultId String
  result   QcResult @relation(fields: [resultId],
             references: [id], onDelete: Cascade)
  testCode String
  testName String
  measured Float
  mean     Float    // snapshot from target at time of entry
  sd       Float    // snapshot from target at time of entry
  zScore   Float    // (measured - mean) / sd — stored for charts
  flag     String   // 'ok' | 'warn' | 'fail'
  unit     String?
}

Give migration command after.

---

## STEP 2 — lib/qc.ts: Westgard evaluation helper

Create this file:

  export function evaluateWestgard(
    zScore: number,
    previousZScores: number[]
  ): { flag: 'ok' | 'warn' | 'fail'; rule?: string } {

    // 1-3s rule: beyond ±3SD = reject
    if (Math.abs(zScore) > 3) {
      return { flag: 'fail', rule: '1-3s' };
    }

    // 2-2s rule: this AND previous both beyond ±2SD same side
    if (
      previousZScores.length >= 1 &&
      Math.abs(zScore) > 2 &&
      Math.abs(previousZScores[0]) > 2 &&
      Math.sign(zScore) === Math.sign(previousZScores[0])
    ) {
      return { flag: 'fail', rule: '2-2s' };
    }

    // 1-2s rule: warning
    if (Math.abs(zScore) > 2) {
      return { flag: 'warn', rule: '1-2s' };
    }

    return { flag: 'ok' };
  }

  export function evaluateRunStatus(
    flags: string[]
  ): 'pass' | 'warn' | 'fail' {
    if (flags.includes('fail')) return 'fail';
    if (flags.includes('warn')) return 'warn';
    return 'pass';
  }

---

## STEP 3 — API routes

### GET /api/qc/route.ts
  - All authenticated users
  - Returns all active QcMaterials with their active lots
  - Each lot includes: targets count, last result (status + date),
    results count for the last 30 days
  - Order: materials by name

### GET /api/qc/lots/[id]/route.ts
  - Returns one lot with all targets and last 60 results
  - Each result includes all its values
  - Order results by performedAt desc

### POST /api/qc/materials/route.ts
  - ADMIN only
  - Body: { name, level, manufacturer? }
  - Validate name and level required
  - Level must be one of: Normal, Pathologique, Critique
  - Return 201

### POST /api/qc/lots/route.ts
  - ADMIN only
  - Body: { materialId, lotNumber, expiryDate }
  - Validate all required, expiryDate must be future
  - Return 201 with created lot

### POST /api/qc/lots/[id]/targets/route.ts
  - ADMIN only
  - Body: { targets: [{ testCode, testName, mean, sd, unit? }] }
  - Validate each target: testCode, testName, mean, sd required
  - sd must be > 0
  - Upsert targets (allow reconfiguration):
    For each target, check if testCode already exists for this lot,
    update if yes, create if no
  - Return updated lot with all targets

### POST /api/qc/lots/[id]/results/route.ts
  - ADMIN or TECHNICIEN
  - Body: { values: [{ testCode, measured }], comment? }
  - Fetch lot with targets to get mean/sd per testCode
  - For each value:
    * Find matching target by testCode
    * If no target found: skip this value
    * Compute zScore = (measured - target.mean) / target.sd
    * Get last 2 zScores for same testCode from previous results
    * Call evaluateWestgard(zScore, previousZScores)
    * Build QcValue with all fields including snapshots
  - Compute overall status with evaluateRunStatus(all flags)
  - Create QcResult + all QcValues in one transaction
  - Return created result with values

### GET /api/qc/today/route.ts
  - All authenticated users
  - Returns QC status for today:
    * Active lots that have at least one result today: their status
    * Active lots with NO result today: status = 'missing'
  - This powers the QC pill in the header
  - Response: { allPass: boolean, missing: number,
                warn: number, fail: number }

---

## STEP 4 — Update Header.tsx QC status pill

Currently the QC pill calls /api/analyses?filter=qc which is wrong.
Replace with a call to GET /api/qc/today:

  useEffect(() => {
    const loadQcStatus = async () => {
      try {
        const res = await fetch('/api/qc/today');
        if (res.ok) {
          const data = await res.json();
          setHasQcFlag(!data.allPass || data.missing > 0);
          setQcSummary(data);
        }
      } catch {}
    };
    loadQcStatus();
    const t = setInterval(loadQcStatus, 300_000); // every 5 min
    return () => clearInterval(t);
  }, []);

Add qcSummary state: { allPass, missing, warn, fail }

Update the pill tooltip to show:
  If allPass && missing === 0: "Tous les contrôles sont conformes"
  If missing > 0: "X contrôle(s) non effectué(s) aujourd'hui"
  If fail > 0: "X contrôle(s) en échec"
  If warn > 0: "X contrôle(s) en avertissement"

---

## STEP 5 — QC dashboard page
## app/dashboard/qc/page.tsx
## 'use client'

State: materials (with lots), loading, selectedLot, 
       showEntry, showConfig (ADMIN)

Fetch on mount from GET /api/qc

### Page header:
  Title: "Contrôle Qualité"
  Subtitle: today's date
  Right: "Configurer" button (ADMIN) + today's overall status pill

### Materials grid:
  One card per material (.bento-panel) showing:
  - Material name + level badge
    (Normal=blue, Pathologique=amber, Critique=red)
  - Active lot number and expiry date
  - Today's QC status:
    * If result exists today: pass/warn/fail pill with time
    * If no result today: "Non effectué" amber pill
  - "Saisir QC" button → opens entry modal for this lot
  - "Voir le graphique" button → navigates to /dashboard/qc/[lotId]

### Entry modal:
  Header: material name + lot number
  For each target in the selected lot, one input row:
    [testName] [testCode] [input field] [unit] [reference: mean ±2SD]
  
  As the user types each value, show LIVE feedback:
    Compute zScore client-side = (value - mean) / sd
    If |zScore| <= 1: green dot
    If |zScore| <= 2: amber dot  
    If |zScore| <= 3: red dot "Avertissement"
    If |zScore| > 3:  red dot "REJET"

  Optional comment textarea at bottom
  Submit: POST /api/qc/lots/[id]/results
  On success: close, reload, show notification with overall status

---

## STEP 6 — Levey-Jennings chart page
## app/dashboard/qc/[lotId]/page.tsx
## 'use client'

Fetch lot data from GET /api/qc/lots/[id]

### For each parameter (QcTarget), render a Levey-Jennings chart:

Use recharts LineChart.

X axis: date of each result (last 30 results)
Y axis: zScore (dimensionless, shows deviation from mean)

Reference lines (use recharts ReferenceLine):
  y=0    → mean (solid line, blue, label "X̄")
  y=1    → +1SD (dashed, light grey)
  y=-1   → -1SD (dashed, light grey)
  y=2    → +2SD (dashed, amber, label "+2SD")
  y=-2   → -2SD (dashed, amber, label "-2SD")
  y=3    → +3SD (dashed, red, label "+3SD")
  y=-3   → -3SD (dashed, red, label "-3SD")

Data points:
  Dot color based on flag:
    ok   → green filled circle
    warn → amber filled circle
    fail → red filled circle, larger

Show the actual measured value and date in tooltip on hover.

Below the chart, show a small table of the last 10 results
for this parameter: date, measured, zScore, flag.

---

## STEP 7 — QC configuration page (ADMIN)
## app/dashboard/qc/config/page.tsx
## 'use client'

Three sections:

### Section 1 — Materials
  List of all QcMaterials (including inactive)
  Create new material form: name, level, manufacturer
  Toggle active/inactive button per material

### Section 2 — Lots
  For each material: its lots list with lotNumber, expiry, isActive
  "Nouveau lot" form: materialId (select), lotNumber, expiryDate

### Section 3 — Targets
  Select a lot → shows its current targets
  Form to add/update targets:
    One row per parameter: testCode, testName, mean, sd, unit
    "Ajouter un paramètre" button to add rows dynamically
  Submit: POST /api/qc/lots/[id]/targets
  
  Pre-fill button: "Importer depuis mes tests" 
    Fetches /api/tests and lets admin select tests to
    add as targets (just fills the form, they still enter mean/sd)

---

## STEP 8 — Add QC to Navigation.tsx

In the 'Principal' section of SECTIONS, add:
  {
    label: 'Contrôle Qualité',
    icon: ShieldCheck,
    href: '/dashboard/qc',
    roles: ['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE', 'MEDECIN']
  }

Import ShieldCheck from lucide-react.

---

## STEP 9 — Add QC alerts to dashboard page.tsx

Fetch GET /api/qc/today on dashboard load.
If missing > 0 OR fail > 0, show alert strip:

  fail > 0:
    <div className="alert alert-danger">
      X contrôle(s) qualité en échec — vérifiez l'analyseur
      avant tout résultat patient
    </div>

  missing > 0 (and no fail):
    <div className="alert alert-warning">
      X contrôle(s) qualité non effectués aujourd'hui
    </div>

Place this ABOVE the analysis alert strip (QC takes priority
over TAT alerts — you should never process patient samples
if QC has failed).

---

## Constraints
- zScore and flag MUST be stored in QcValue — never recompute
  from raw data (mean/sd could change if targets are updated)
- Store mean and sd snapshots in QcValue for the same reason
- Westgard evaluation uses the 2 most recent results for the
  SAME testCode in the SAME lot — fetch these before inserting
- Never allow entry for an expired lot (validate server-side)
- Never allow entry for an inactive lot
- The Levey-Jennings chart must work with recharts only —
  no additional charting library
- QC status in header updates every 5 minutes maximum —
  do not poll more frequently
- RECEPTIONNISTE and MEDECIN: read-only (GET only on all routes)

---

## Deliverables
1.  schema.prisma 4 new models + migration command
2.  lib/qc.ts (Westgard helper)
3.  app/api/qc/route.ts
4.  app/api/qc/today/route.ts
5.  app/api/qc/materials/route.ts
6.  app/api/qc/lots/route.ts
7.  app/api/qc/lots/[id]/route.ts
8.  app/api/qc/lots/[id]/targets/route.ts
9.  app/api/qc/lots/[id]/results/route.ts
10. Updated Header.tsx QC pill section
11. app/dashboard/qc/page.tsx
12. app/dashboard/qc/[lotId]/page.tsx (Levey-Jennings)
13. app/dashboard/qc/config/page.tsx
14. Updated Navigation.tsx
15. Updated dashboard page.tsx QC alert section