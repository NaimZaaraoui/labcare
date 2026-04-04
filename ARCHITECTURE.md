# NexLab CSSB - Laboratory Information Management System

## Project Overview

NexLab CSSB is a professional, enterprise-grade Laboratory Information Management System (LIMS) designed for high-performance clinical laboratories. Built with a modern "Bento" aesthetic and a robust Next.js 16 architecture, it provides an end-to-end solution for patient management, advanced data entry, clinical quality control, and automated reagent tracking.

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 16 (App Router) |
| **Backend** | React Server Actions & Web APIs |
| **Database** | SQLite with Prisma ORM |
| **Design** | Tailwind CSS v4 (Bento Premium Design) |
| **Auth** | NextAuth.js v5 (Secure RBAC) |
| **Analytics** | D3-based SVG Charts |
| **Compliance** | Integrated Audit Trail & Insurance Tier Payant |

---

## Core Modules & Clinical Compliance

### 1. Advanced Quality Control (QC)
- [x] **Levey-Jennings Visualization**: Interactive charts with 1SD, 2SD, 3SD zones.
- [x] **Westgard Rules**: Automated multi-rule evaluation (13s, 22s, R4s, 41s, 10x).
- [x] **QC Readiness Enforcement**: Blocks clinical validation if daily QC fails.
- [x] **Z-Score Analytics**: Interactive inspection of control runs.

### 2. Professional Temperature Monitoring
- [x] **Compliance Logs**: Automated morning/evening tracking for cold chain integrity.
- [x] **Safety Zones**: Visual "Acceptance Ranges" with shaded zones in trend charts.
- [x] **Monthly Reports**: Professional A4 reports mirroring the laboratory's branding.
- [x] **Corrective Actions**: Integrated logging for audit-ready documentation.

### 3. Smart Inventory & Reagents
- [x] **Automated Depletion**: Stock is deducted in real-time upon technical validation.
- [x] **FEFO Management**: "First Expired, First Out" logic for lot allocation.
- [x] **Reorder Suggestions**: Dynamic calculations based on 30-day usage and lead time.
- [x] **Expiry Radar**: Active monitoring of reagent lots with visual alerts.

### 4. Financial & Insurance (Tier Payant)
- [x] **Tunisian Insurance Integration**: CNAM and private insurer billing splits.
- [x] **Tier Payant Automation**: Direct billing for supported partners.
- [x] **Financial Tracking**: Revenue summary and payment status per analysis.

### 5. Advanced Clinical Workflow
- [x] **Two-Step Validation**: Distinct Technical and Biological validation stages.
- [x] **Delta Check**: Comparisons with historical patient results for longitudinal follow-up.
- [x] **Keyboard Navigation**: Highly optimized "mouse-free" result entry.
- [x] **Diatron Integration**: Direct result import from Diatron hematology analyzers.

### 6. Security & Auditability
- [x] **Enterprise Audit Trail**: Detailed logging of every modification (who, when, what, where).
- [x] **Archival Policy**: Secure archival and pruning of historical logs.
- [x] **Role-Based Access (RBAC)**: Specific permissions for Admin, Physician, Technician, and Receptionist.

---

## Technical Architecture

### Design Philosophy: "Bento Premium"
The UI is built on a responsive, modular grid using `rounded-3xl` borders and soft shadows, ensuring a modern user experience that is both visually stunning and highly productive.

### Backend & Data Flow
- **Server Components**: Used by default for performance and security.
- **Prisma Transactions**: Ensures data integrity in complex operations (e.g., stock depletion).
- **Direct Print Engine**: Hidden iframe rendering for seamless A4 report generation.

---

## Roadmap & Evolution

### High Priority
1. **Bidirectional Analyzer Interface**: Full middleware support for chemistry and immune-analysis devices.
2. **Patient/Physician Portals**: Secure online access to validated results via unique access codes.
3. **QR/Barcode Integration**: Complete sample tracking from reception to storage.

---

*Documentation updated for Lab Director Review: 2026-03-29*
