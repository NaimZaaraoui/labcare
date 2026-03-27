# NexLab CSSB - Laboratory Information Management System

## Project Overview

NexLab CSSB is a comprehensive Laboratory Information Management System (LIMS) designed for primary healthcare center laboratories. Built with Next.js 16, it enables managing patient analyses, entering results, validating workflows, and printing professional laboratory reports.

### Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Database | SQLite with Prisma ORM |
| Styling | Tailwind CSS v4 (Bento Design) |
| Icons | Lucide React |
| Authentication | NextAuth.js v5 |
| Excel Export | xlsx library |
| PDF/Print | react-to-print |

---

## Current Features

### 1. Authentication & Authorization

- [x] **User authentication** with credentials provider
- [x] **Role-based access control** with 4 roles:
  - `ADMIN` - Full system access
  - `TECHNICIEN` - Lab technicians (result entry, QC)
  - `RECEPTIONNISTE` - Reception (analysis creation)
  - `MEDECIN` - Physicians (biological validation)
- [x] **Password management** with change functionality
- [x] **Session management** with JWT tokens
- [x] **Internal print tokens** for secure printing without re-auth

### 2. Patient Management

- [x] **Patient registry** with search and filters
- [x] **Patient profile** with demographics
- [x] **Patient history** showing all analyses
- [x] **Trend charts** for tracking results over time
- [x] **Unique patient identification** with auto-generated IDs

### 3. Analysis Management

- [x] **Analysis creation** with patient search/selection
- [x] **Unique order numbering** (YYYYMMDD-NNNN format)
- [x] **Receipt generation** with auto-numbering
- [x] **Individual test selection** from catalog
- [x] **Bilan (package) shortcuts** for common test panels
- [x] **Dynamic pricing** based on selected tests
- [x] **Analysis list** with advanced filtering:
  - By status
  - By date range
  - By patient
  - By priority/urgency
- [x] **Analysis deletion** with confirmation

### 4. Result Entry

- [x] **Comprehensive result form** with all test types
- [x] **Auto-calculation** of derived values:
  - VGM (Volume Globulaire Moyen)
  - TGMH (Teneur Globulaire Moyenne en Hémoglobine)
  - CCMH (Concentration Corpusculaire Moyenne en Hémoglobine)
- [x] **Reference range validation** with gender-specific ranges
- [x] **Abnormal value flagging** (H/L indicators)
- [x] **Delta check** - Compare with previous results for same patient
- [x] **Hematology interpretation** - Automatic text interpretations
- [x] **Keyboard navigation** - Enter key moves to next field
- [x] **Global notes** per analysis
- [x] **Diatron import** - Parse files from Diatron hematology analyzer
- [x] **Payment status tracking** (pending/partial/paid)

### 5. Validation Workflow

- [x] **Two-step validation process**:
  1. **Technical validation** - Technician confirms correct execution
  2. **Biological validation** - Physician approves results
- [x] **QC readiness check** - Block validation if QC non-compliant
- [x] **Automatic notifications** on status changes
- [x] **Role-based validation** - Only MEDECIN/ADMIN can bio-validate

### 6. Quality Control (QC)

- [x] **QC materials management** (control sera)
- [x] **Lot/batch tracking** with expiry dates
- [x] **Statistical targets** (mean, SD) for statistical mode
- [x] **Acceptance range** mode for fixed limits
- [x] **Daily QC entry** with multi-test values
- [x] **Westgard rules evaluation** (13s, 22s, R4s, 41s, 10x)
- [x] **Levey-Jennings charts** with SD zones visualization
- [x] **QC status dashboard** with today's summary
- [x] **Lot status overview** - Active/expired/pending
- [x] **Result invalidation** for invalid QC runs
- [x] **Z-score calculation** and zone classification

### 7. Inventory Management

- [x] **Reagent/consumable catalog** with categories
- [x] **Batch/lot tracking** with expiry dates
- [x] **Stock levels** with minimum thresholds
- [x] **Stock movements** (received, consumption, adjustment, waste)
- [x] **Per-test consumption rules** (quantity per test)
- [x] **Automatic consumption** on technical validation
- [x] **FIFO consumption** (First In, First Out)
- [x] **Status alerts** (Critical/Low/Expired/Expiring Soon)
- [x] **Reorder suggestions** based on consumption trends
- [x] **Supplier and storage tracking**
- [x] **Inventory analytics** (consumption rates, trends)

### 8. Printing & Reports

- [x] **Professional A4 report template**
- [x] **Laboratory header/footer** customization
- [x] **Results table** with reference ranges
- [x] **Abnormal flags** prominently displayed
- [x] **Previous results column** for comparison
- [x] **Signature and stamp zones**
- [x] **Histogram pages** for NFS (hematology)
- [x] **Draft watermark** until validated
- [x] **Multi-page support** for extensive results
- [x] **Invoice printing** with itemized list
- [x] **Envelope printing** for mailing
- [x] **Print template settings** customization

### 9. Excel Exports

- [x] **Analyses list export**
- [x] **Detailed results export**
- [x] **Daily/monthly summaries**
- [x] **Category breakdowns**
- [x] **Patient histories**
- [x] **Patient registry**
- [x] **Test catalog export**

### 10. Settings & Configuration

- [x] **Lab information** (name, address, contacts)
- [x] **Print template settings** (header, footer, logos)
- [x] **Bilan/packages management** (create test bundles)
- [x] **Database maintenance** (backup, prune)
- [x] **Audit log viewer** with filtering
- [x] **Audit log archival** with retention policy

### 11. Test Catalog

- [x] **Test categories** (hierarchical structure)
- [x] **Test management** (name, unit, reference ranges)
- [x] **Gender-specific ranges** (male/female/neutral)
- [x] **Panel tests** (parent/child relationships)
- [x] **Test ordering/categories** interface
- [x] **Result types** (numeric, text, select)

### 12. Notifications

- [x] **Real-time notifications** via header bell icon
- [x] **Analysis alerts** (new, urgent)
- [x] **Validation notifications** (tech/bio complete)
- [x] **Role-based notifications** (target appropriate users)
- [x] **Mark all as read** functionality

### 13. Audit Logging

- [x] **Comprehensive action logging** (create, update, delete)
- [x] **Severity levels** (INFO, WARN, CRITICAL)
- [x] **User tracking** (who, when)
- [x] **IP address and user-agent** capture
- [x] **Retention policy** with archival
- [x] **Filtered audit viewer** in settings

### 14. Dashboard

- [x] **KPI cards** (today's analyses, pending, validated)
- [x] **Recent analyses** list
- [x] **Quick alerts** (low stock, expired QC, pending validations)
- [x] **Status overview** for QC and inventory

---

## Database Schema

### Core Entities

```
User ──────────────── Notification
  │                        │
  │                        ▼
  │                   Analysis
  │                   ↙     ↘
  │              Result   Patient
  │                 │
  │                Test
  │              ↙    ↘
  │          Bilan   Category
  │
  └── AuditLog
```

### Models Overview

| Model | Purpose |
|-------|---------|
| `User` | Authentication & authorization |
| `Patient` | Patient demographics |
| `Analysis` | Laboratory orders |
| `Result` | Individual test results |
| `Test` | Biological parameters catalog |
| `Category` | Hierarchical test categories |
| `Bilan` | Test packages/panels |
| `Setting` | Key-value lab configuration |
| `Notification` | User alerts |
| `AuditLog` | Security/action logging |
| `InventoryItem` | Reagents & consumables |
| `InventoryLot` | Batch tracking |
| `StockMovement` | Inventory transactions |
| `ItemTestRule` | Per-test consumption rules |
| `AnalysisConsumption` | Per-analysis consumption |
| `QcMaterial` | QC control sera |
| `QcLot` | QC material batches |
| `QcTarget` | QC target values |
| `QcResult` | QC run results |
| `QcValue` | Individual QC measurements |

---

## UI/UX Design

### Design System: "Bento Premium"

- Soft shadows with `rounded-3xl` borders
- CSS variable theming
- Generous padding and spacing
- Status pills/badges for visual feedback
- Skeleton loading states
- Toast notifications (bottom-right)
- Modal overlays with backdrop blur
- Confirmation dialogs

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Move to next input field |
| `Ctrl+K` | Global search focus |
| `Escape` | Close dropdowns/modals |

### Responsive Design

- Mobile-first approach
- Collapsible sidebar navigation
- Sticky headers
- Adaptive grids

---

## API Routes

### Analysis Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/analyses` | GET, POST | List/create analyses |
| `/api/analyses/[id]` | GET, PATCH, DELETE | Single analysis CRUD |
| `/api/analyses/[id]/results` | PUT, PATCH | Save results, add tests |
| `/api/analyses/[id]/validate` | PATCH | Tech/bio validation |
| `/api/analyses/[id]/qc-readiness` | GET | Check QC compliance |
| `/api/analyses/[id]/email` | POST | Send email report |
| `/api/analyses/[id]/import/diatron` | POST | Import Diatron file |

### Patient Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/patients` | GET, POST | List/create patients |
| `/api/patients/[id]` | GET, PUT, DELETE | Patient CRUD |
| `/api/patients/[id]/history` | GET | Patient analysis history |

### QC Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/qc` | GET | List QC materials/lots |
| `/api/qc/today` | GET | Today's QC summary |
| `/api/qc/lots` | POST | Create QC lot |
| `/api/qc/lots/[id]` | GET, DELETE | QC lot operations |
| `/api/qc/lots/[id]/results` | GET, POST | QC results |
| `/api/qc/lots/[id]/targets` | GET | QC targets |
| `/api/qc/lots/[id]/status` | GET | Lot status |
| `/api/qc/materials` | GET, POST | QC materials |
| `/api/qc/results/[resultId]/invalidate` | POST | Invalidate result |

### Inventory Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/inventory` | GET, POST | Inventory CRUD |
| `/api/inventory/analytics` | GET | Consumption analytics |
| `/api/inventory/categories` | GET, PUT | Inventory categories |

### Other Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/tests` | GET, POST | Test catalog |
| `/api/bilans` | GET, POST | Bilans management |
| `/api/users` | GET, POST | User management |
| `/api/notifications` | GET, POST | Notifications |
| `/api/search` | GET | Global search |
| `/api/stats` | GET | Dashboard statistics |

---

## Future Feature Ideas

### High Priority

1. **Multi-analyzer Integration**
   - Bidirectional communication with laboratory instruments
   - Auto-import results from supported devices (Diatron already in progress)
   - Support for additional analyzers (chemistry, immunoassay)

2. **Barcode/QR Code System**
   - Generate patient/analysis barcodes
   - Scanner integration for sample tracking
   - Label printing for sample tubes

3. **Sample Tracking**
   - Sample reception workflow
   - Chain of custody logging
   - Sample status tracking (received, processing, stored, disposed)

4. **Internal Messaging System**
   - Communication between lab staff
   - Notes and comments on analyses
   - @mentions for notifications

5. **Advanced Analytics & Reporting**
   - Trend analysis for test values
   - Predictive analytics for inventory needs
   - Business intelligence dashboards
   - Monthly/quarterly reports generation

6. **Insurance/Billing Integration**
   - Insurance company management
   - Third-party payer billing
   - Invoice generation and tracking
   - Payment tracking

### Medium Priority

7. **Document Management**
   - Upload supporting documents (prescriptions, images)
   - Document templates
   - Digital signature integration

8. **External API/Webhooks**
   - Connect with hospital information systems (HIS)
   - Connect with health information exchanges (HIE)
   - Webhook notifications for external systems

9. **Mobile App / Responsive Enhancements**
   - Native mobile app for result viewing
   - Push notifications for mobile
   - Offline capability for field collection

10. **Quality Management Enhancements**
    - Non-conformance tracking
    - CAP/ISO compliance checklists
    - Document control system
    - Staff competency tracking

11. **Reference Lab Integration**
    - Send tests to external labs
    - Receive results from reference labs
    - Subcontracting management

12. **Auto-validation Rules**
    - Rule-based auto-validation for routine tests
    - Delta check automation
    - Critical value alerting rules

### Lower Priority / Nice to Have

13. **Patient Portal**
    - Patient self-registration
    - View results online
    - Download reports
    - Appointment scheduling

14. **Physician Portal**
    - Order entry by physicians
    - Results viewing
    - Custom test panels

15. **Multi-site Support**
    - Centralized database for multiple labs
    - Branch management
    - Inter-site sample transfer

16. **AI/ML Enhancements**
    - Flag unusual results
    - Drug interaction warnings
    - Reference range customization based on demographics

17. **Environmental Monitoring**
    - Temperature monitoring for sample storage
    - Equipment maintenance scheduling
    - Calibration tracking

18. **Waste Management**
    - Biohazard waste tracking
    - Compliance reporting

19. **Training Module**
    - SOP management
    - Training records
    - Quiz/assessment system

20. **Financial Reports**
    - Revenue tracking
    - Cost analysis per test
    - Profitability reports

---

## Project Structure

```
/home/naim/labcare-cssb/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Authenticated routes
│   │   ├── page.tsx              # Dashboard
│   │   ├── analyses/             # Analysis management
│   │   ├── dashboard/            # Admin dashboards
│   │   │   ├── patients/
│   │   │   ├── qc/
│   │   │   ├── inventory/
│   │   │   ├── exports/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   └── tests/                # Test catalog
│   ├── api/                      # API routes
│   ├── login/                    # Authentication
│   └── print/                    # Print-only routes
├── components/
│   ├── analyses/                 # Analysis components
│   ├── layout/                   # Layout components
│   ├── patients/                 # Patient components
│   ├── print/                    # Print templates
│   ├── qc/                       # QC components
│   ├── tests/                    # Test components
│   └── ui/                       # Shared UI components
├── lib/                          # Utilities
│   ├── parsers/                  # File parsers
│   ├── prisma.ts                 # Database client
│   ├── auth.ts                   # NextAuth config
│   ├── authz.ts                  # Authorization
│   ├── qc.ts                     # QC logic
│   ├── inventory.ts              # Inventory logic
│   └── ...
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── seed.ts                   # Initial data
└── public/                       # Static assets
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Setup database
npx prisma db push
npx prisma db seed

# Run development server
npm run dev

# Build for production
npm run build
```

---

*Documentation generated on: 2026-03-27*
