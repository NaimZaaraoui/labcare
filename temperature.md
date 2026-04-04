model Instrument {
  id          String    @id @default(cuid())
  name        String    // "Réfrigérateur Réactifs 1"
  type        String    // "Réfrigérateur" | "Congélateur" | etc.
  targetMin   Float     // minimum acceptable temperature
  targetMax   Float     // maximum acceptable temperature
  unit        String    @default("°C")
  location    String?   // "Paillasse principale"
  isActive    Boolean   @default(true)
  readings    TemperatureReading[]
  createdAt   DateTime  @default(now())
}

model TemperatureReading {
  id               String     @id @default(cuid())
  instrumentId     String
  instrument       Instrument @relation(...)
  value            Float
  period           String     // 'matin' | 'soir'
  isOutOfRange     Boolean    @default(false)
  correctiveAction String?    // required if isOutOfRange
  recordedBy       String     // user name snapshot
  recordedAt       DateTime   @default(now())
}
```

---

## The pages

**Temperature dashboard** (`/dashboard/temperature`) — grid of all active instruments. Each card shows the instrument name, target range, today's morning and evening readings (or "Non enregistré" if missing), and a colour status. This is the daily checklist view.

**Recording form** — click on an instrument card → quick modal to enter the reading. Immediately shows in range (green) or out of range (red). If out of range, a corrective action field appears and is required before submitting.

**History chart page** (`/dashboard/temperature/[id]`) — line chart of all readings for a selected month, with reference lines at targetMin and targetMax. Out of range readings shown as red dots.

**Monthly export** — printable table for ISO documentation.

---

Here is the prompt:

---
```
## Context
All roles can VIEW temperature readings.
ADMIN and TECHNICIEN can record readings.
Only ADMIN can create/edit/deactivate instruments.

---

## STEP 1 — schema.prisma

model Instrument {
  id        String               @id @default(cuid())
  name      String
  type      String
  targetMin Float
  targetMax Float
  unit      String               @default("°C")
  location  String?
  isActive  Boolean              @default(true)
  readings  TemperatureReading[]
  createdAt DateTime             @default(now())
  updatedAt DateTime             @updatedAt
}

model TemperatureReading {
  id               String     @id @default(cuid())
  instrumentId     String
  instrument       Instrument @relation(fields: [instrumentId],
                     references: [id], onDelete: Cascade)
  value            Float
  period           String     // 'matin' | 'soir'
  isOutOfRange     Boolean    @default(false)
  correctiveAction String?
  recordedBy       String
  recordedAt       DateTime   @default(now())
}

Give migration command after.

---

## STEP 2 — API routes

### GET /api/temperature/route.ts
  - All authenticated users
  - Returns all active instruments
  - Each instrument includes:
    * todayReadings: readings where recordedAt is today
      (between 00:00:00 and 23:59:59 local time)
      Use:
        const start = new Date(); start.setHours(0,0,0,0);
        const end   = new Date(); end.setHours(23,59,59,999);
    * lastReading: the most recent reading overall
      (for instruments with no reading today)
  - Compute per instrument:
    * morningDone: todayReadings.some(r => r.period === 'matin')
    * eveningDone: todayReadings.some(r => r.period === 'soir')
    * todayStatus: 
        'ok'      = all done readings are in range
        'alert'   = at least one reading today is out of range
        'missing' = at least one period not yet recorded today
        'empty'   = no readings at all today
  - Order: alert first, then missing, then ok

### GET /api/temperature/[id]/route.ts
  - Returns one instrument
  - Query params: month (YYYY-MM format, default current month)
  - Returns readings for the specified month
  - Order: recordedAt asc

### POST /api/temperature/route.ts (create instrument)
  - ADMIN only
  - Body: { name, type, targetMin, targetMax, unit?, location? }
  - Validate: name, type, targetMin, targetMax required
  - targetMin must be less than targetMax
  - Return 201

### PATCH /api/temperature/[id]/route.ts
  - ADMIN only
  - action: 'update' → update instrument fields
  - action: 'toggle-active' → flip isActive
  - Return updated instrument

### POST /api/temperature/[id]/readings/route.ts
  - ADMIN or TECHNICIEN
  - Body: { value, period, correctiveAction? }
  - Validate:
    * value is a number
    * period is 'matin' or 'soir'
    * Check if a reading for this period already exists today
      If yes: return 400 "Une mesure a déjà été enregistrée 
      pour cette période aujourd'hui"
  - Compute isOutOfRange:
      isOutOfRange = value < instrument.targetMin 
                  || value > instrument.targetMax
  - If isOutOfRange and no correctiveAction:
      return 400 "Une action corrective est requise pour une 
      valeur hors plage"
  - Create reading with recordedBy = session.user.name
  - Return created reading + updated instrument

### GET /api/temperature/today/route.ts
  - All authenticated users
  - Returns summary for dashboard alert:
    { 
      totalInstruments: number,
      missingCount: number,     // instruments missing a reading today
      alertCount: number,       // instruments with out-of-range today
      instruments: [{ id, name, morningDone, eveningDone, 
                      hasAlert }]
    }

---

## STEP 3 — Temperature dashboard page
## app/dashboard/temperature/page.tsx
## 'use client'

State:
  instruments, loading
  selectedInstrument (for recording modal)
  selectedPeriod: 'matin' | 'soir'
  showRecord: boolean
  showCreate: boolean (ADMIN)

Fetch on mount from GET /api/temperature

### Page header:
  Title: "Suivi des Températures"
  Subtitle: today's date
  Right: "Ajouter un instrument" button (ADMIN only)

### Today's summary strip (if any issues):
  Show a one-line summary:
    "X instrument(s) avec relevé manquant · Y alerte(s) 
     de température"
  Use .alert .alert-warning or .alert-danger

### Instruments grid (responsive, 2-3 columns):
  One card per instrument (.bento-panel) showing:

  CARD HEADER:
    Instrument name (bold)
    Type badge (Réfrigérateur/Congélateur/etc.) 
    Location if set (small muted text)

  TARGET RANGE:
    "Plage cible: {targetMin}°C à {targetMax}°C"
    Small text, centered

  TODAY'S READINGS (two slots side by side):
    
    MATIN slot:
      If recorded:
        Large temperature value (color: green if ok, red if alert)
        Small text: time of recording
        If out of range: small red "Hors plage" label
      If not recorded:
        Dashed border box with "—" and "Non enregistré" in grey

    SOIR slot: same pattern

  CARD FOOTER:
    "Enregistrer matin" button → opens record modal with 
      period='matin' pre-selected (disabled if already done)
    "Enregistrer soir" button → same for soir
    "Historique" link → navigates to /dashboard/temperature/[id]

  CARD STATUS BORDER:
    alert   → left border 3px solid red
    missing → left border 3px solid amber
    ok      → left border 3px solid green

### Record modal:
  Header: instrument name + period (Relevé du Matin / du Soir)
  
  Large temperature input (number, step=0.1):
    Prominent, centered, with °C suffix
    As user types, show LIVE range indicator:
      Below the input:
        Green bar if within range
        Red bar if out of range
        Text: "Dans la plage (X°C - Y°C)" or 
              "HORS PLAGE — {value}°C"

  Corrective action textarea:
    Hidden if value is in range
    Visible + required if value is out of range
    Label: "Action corrective *"
    Placeholder: "Décrivez l'action prise (vérification du 
    joint, déplacement des réactifs, appel technicien...)"

  Submit: POST /api/temperature/[id]/readings
  On success: close, reload, show notification
    If out of range: "Température hors plage enregistrée — 
    action corrective notée"
    If in range: "Relevé enregistré avec succès"

### Create instrument modal (ADMIN):
  Fields:
    Nom de l'instrument * (text)
    Type * (select: Réfrigérateur, Congélateur, Étuve, 
             Bain-marie, Température ambiante, Autre)
    Température minimale * (number, step=0.1) + °C
    Température maximale * (number, step=0.1) + °C
    Unité (pre-filled °C, readonly for now)
    Localisation (text, optional)
  
  Validate min < max before submit
  POST /api/temperature
  On success: close, reload

---

## STEP 4 — History and chart page
## app/dashboard/temperature/[id]/page.tsx
## 'use client'

State:
  instrument, readings, loading
  selectedMonth: string (YYYY-MM, default current month)
  showPrint: boolean

Fetch on mount and on month change from 
GET /api/temperature/[id]?month={selectedMonth}

### Page header:
  Back button → /dashboard/temperature
  Instrument name + type badge
  Month selector (previous/next month arrows + month display)
  "Imprimer le relevé" button

### Summary stats for selected month (4 small stat cards):
  Total relevés | Conformes | Hors plage | Manquants

  Manquants = (working days in month × 2) - total readings
  Use a simple calculation: days in month × 2 - readings.length

### Recharts line chart:
  Title: "Évolution des températures — {month}"
  
  Data: one point per reading, x=recordedAt, y=value
  
  Use ComposedChart from recharts with:
    XAxis: formatted date (dd/MM HH:mm)
    YAxis: temperature values, domain auto with padding
    
    ReferenceLine y={instrument.targetMin}:
      stroke="red" strokeDasharray="4 4" label="Min"
    ReferenceLine y={instrument.targetMax}:
      stroke="red" strokeDasharray="4 4" label="Max"
    ReferenceLine y={(targetMin + targetMax) / 2}:
      stroke="green" strokeOpacity={0.4} label="Cible"
    
    Line dataKey="value":
      stroke="#2563eb"
      dot: custom dot component:
        if reading.isOutOfRange: red filled circle, r=5
        else: blue filled circle, r=3
    
    Tooltip showing: date, value, period, recordedBy,
      correctiveAction if present

### Monthly readings table:
  Columns: Date | Période | Valeur | Statut | Enregistré par | 
           Action corrective
  
  Status column:
    In range → green pill "Conforme"
    Out of range → red pill "Hors plage"
  
  Corrective action column:
    Show text if present, "—" if none
    If out of range with no action: red "Manquante" pill
      (this should not happen due to API validation but 
       show defensively)
  
  Rows with isOutOfRange: highlighted with light red background

### Print layout:
  When showPrint is true, render a printable version:
    Lab name from settings (fetch /api/settings)
    Title: "Relevé de Température — {instrument.name} — {month}"
    The table above (all readings for the month)
    Footer: "Document généré le {today} par NexLab"
  
  Use useReactToPrint with pageStyle:
    '@page { size: A4; margin: 15mm; }'

---

## STEP 5 — Add temperature alerts to dashboard page.tsx

Fetch GET /api/temperature/today on dashboard load
(parallel with stats and QC fetches).

If missingCount > 0 OR alertCount > 0, show:

  alertCount > 0:
    <div className="alert alert-danger">
      {alertCount} relevé(s) de température hors plage 
      aujourd'hui
    </div>

  missingCount > 0 (and no alert):
    <div className="alert alert-warning">  
      {missingCount} relevé(s) de température manquants 
      aujourd'hui
    </div>

Place after QC alerts, before analysis alerts.
Priority order on dashboard: QC fail → temperature alert → 
TAT breach → urgent analyses.

---

## STEP 6 — Add to Navigation.tsx

In the 'Principal' section add:
  {
    label: 'Températures',
    icon: Thermometer,
    href: '/dashboard/temperature',
    roles: ['ADMIN', 'TECHNICIEN', 'RECEPTIONNISTE', 'MEDECIN']
  }

Import Thermometer from lucide-react.

---

## Constraints
- One reading per instrument per period per day (enforced server-side)
- correctiveAction required server-side when isOutOfRange — 
  never optional for out-of-range values
- recordedBy stores name string not userId — 
  preserved if user is deactivated
- targetMin must always be strictly less than targetMax
  (validate on create and update)
- The chart must use recharts only — already in the project
- Month selector must not allow future months
- Readings are never deleted — only instruments can be 
  deactivated (soft delete)
- Print layout must be a separate render mode in the same page
  not a separate route

---

## Deliverables
1.  schema.prisma 2 models + migration command
2.  app/api/temperature/route.ts (GET list + POST create)
3.  app/api/temperature/[id]/route.ts (GET one + PATCH)
4.  app/api/temperature/[id]/readings/route.ts (POST)
5.  app/api/temperature/today/route.ts (GET)
6.  app/dashboard/temperature/page.tsx
7.  app/dashboard/temperature/[id]/page.tsx
8.  Updated dashboard page.tsx temperature alert section
9.  Updated Navigation.tsx
