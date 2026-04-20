# NexLab Commercial Readiness Roadmap

**Goal:** Transform NexLab from a working prototype into a reliable, production-grade LIMS suitable for commercial deployment to 50+ laboratory clients.

**Current Status:** Feature-complete, good UX, significant testing and reliability gaps  
**Target Timeline:** 4-6 months (assuming 1-2 FTE engineers)  
**Risk Level:** Medium (gaps are known and fixable, not architectural)

---

## Phase 1: Testing & Reliability (Weeks 1-8) 🧪

### **Priority 1.1: Unit Test Foundation** (High Impact, Medium Effort)

**Why:** Business logic (calculations, validations, status transitions) has zero test coverage. A calculation error could invalidate lab results.

**Scope:**
- Create `tests/unit/` directory structure
- Set up **Vitest** + **@testing-library/react**
- Priority test targets:
  - `lib/analysis-tests.ts` - Test type classifications, flags
  - `lib/tat.ts` - Turnaround time calculations (critical)
  - `lib/interpretations.ts` - Result flagging logic (RED flag bugs destroy credibility)
  - `components/analyses/ResultatsForm.tsx` hooks - Auto-calculations (VGM, TGMH, CCMH)
  - `lib/auth.ts` - Permission checks
  - `lib/settings-schema.ts` - Settings validation
  - Prisma models - Relationships, constraints

**Deliverables:**
- ✅ 80%+ coverage on `lib/` utilities
- ✅ All calculation formulas tested with edge cases (negative values, zero, decimals)
- ✅ Role-based permission tests
- ✅ Test CI integration (runs on PR)

**Estimated Effort:** 40-60 hours  
**Tools:** Vitest, @testing-library/react, happy-dom

---

### **Priority 1.2: E2E Test Expansion** (High Impact, High Effort)

**Why:** Only 2 E2E tests exist. Complex workflows (validation, printing, audit) untested.

**Scope:**
- Expand Playwright tests to cover critical user journeys:
  - ✅ **Admin Setup:** Database initialization, role configuration, backup restore
  - ✅ **Patient Workflow:** Add patient → Order analysis → Assign tests
  - ✅ **Result Entry:** Bulk result entry → Delta check detection → Auto-flagging
  - ✅ **Validation:** Technical validation (receptionist) → Biological validation (doctor) → Print report
  - ✅ **QC Management:** Create control material → Log measurement → Check control chart
  - ✅ **Temperature Alerts:** Temperature out-of-range → Alert notification → Manual recovery
  - ✅ **Inventory:** Low stock → Auto-reorder flag → Consumption tracking
  - ✅ **Audit Trail:** Verify sensitive actions logged (result change, user delete, backup access)
  - ✅ **Offline Scenario:** Backup export → Restore on clean DB → Verify integrity

**Deliverables:**
- ✅ 12-15 E2E test files (1 per major workflow)
- ✅ Baseline performance benchmarks captured (page load times, print generation)
- ✅ Test runs in CI on every commit
- ✅ HTML reports generated for visibility

**Estimated Effort:** 80-100 hours  
**Tools:** Playwright, Playwright Reports

---

### **Priority 1.3: Error Handling & Resilience** (High Impact, Medium Effort)

**Why:** Toasts are nice, but production needs **structured error recovery**.

**Scope:**
- Create centralized error handling layer:
  - Define error taxonomy (ValidationError, NotFoundError, PermissionError, DatabaseError, etc.)
  - Implement error boundary component for React
  - Add structured logging (errors → file or external service)
  - Graceful degradation for network timeouts
  - Database connection failure recovery (retry logic)
  
- Error scenarios to handle:
  - Network failures during result submission → Queue for retry
  - Concurrent edit conflicts → Show merge dialog
  - Missing database indexes → Log warning, suggest migration
  - Printer not available → Cache print job for retry
  - Large report generation timeout → Stream or background process
  - Permission denied → Redirect to login + show specific message

**Deliverables:**
- ✅ Error codes system (e.g., ERR_VALIDATION_001, ERR_DB_LOCKED)
- ✅ Error boundary in `app/layout.tsx`
- ✅ Structured logging to file in `app/logs/`
- ✅ Retry middleware for API routes
- ✅ User-facing error messages (translated to French/English)

**Estimated Effort:** 30-40 hours

---

### **Priority 1.4: Database Integrity & Migration Safety** (Medium Impact, Medium Effort)

**Why:** Schema changes could corrupt lab data; migrations need safeguards.

**Scope:**
- Create pre-migration checklist:
  - Automated backup before any migration
  - Schema drift detection (compare schema.prisma vs actual DB)
  - Data validation after migration (row counts, foreign keys)
  
- Add Prisma safety patterns:
  - Soft migrations (additive only in phase 1)
  - Rollback procedures documented
  - Test migrations in shadow DB before production
  - Archive old migrations for audit
  
- Create admin UI for:
  - Migration history viewer
  - Rollback (with warnings)
  - Data integrity report card

**Deliverables:**
- ✅ Pre-migration validation script
- ✅ Migration template with rollback function
- ✅ Admin page showing migration history + last checkpoint
- ✅ Backup triggered automatically before migration

**Estimated Effort:** 25-35 hours

---

## Phase 2: Code Quality & Maintainability (Weeks 9-16) 📝

### **Priority 2.1: Component Refactoring** (Medium Impact, High Effort)

**Why:** Large components (800+ LOC) are hard to test, extend, and debug.

**Scope:**

**Target components:**
1. `app/(app)/settings/database/page.tsx` (832 lines)
   - Extract backup management → `components/system/BackupManager.tsx`
   - Extract integrity checks → `components/system/IntegrityChecker.tsx`
   - Extract migration logs → `components/system/MigrationHistory.tsx`

2. `components/print/RapportImpression.tsx` (639 lines)
   - Extract header section → `components/print/ReportHeader.tsx`
   - Extract results table → `components/print/ResultsTable.tsx`
   - Extract footer/signature → `components/print/ReportFooter.tsx`

3. `components/analyses/AnalysesList.tsx` (439 lines)
   - Extract filters → `components/analyses/AnalysesFilters.tsx`
   - Extract table → `components/analyses/AnalysesTable.tsx`
   - Extract toolbar → `components/analyses/AnalysesToolbar.tsx`

4. `components/analyses/ResultatsForm.tsx` (345 lines)
   - Extract calculation hooks → `hooks/useHematologyCalculations.ts`
   - Extract validation logic → `hooks/useResultValidation.ts`
   - Extract delta check display → `components/analyses/DeltaCheckPanel.tsx`

**Deliverables:**
- ✅ All components < 300 LOC (ideal < 200 LOC)
- ✅ Clear separation of concerns (UI vs logic)
- ✅ Each component testable in isolation
- ✅ Updated component inventory docs

**Estimated Effort:** 60-80 hours

---

### **Priority 2.2: Consolidate Business Logic** (Medium Impact, Medium Effort)

**Why:** Calculations, status mappings, and test classifications are duplicated across 5+ files.

**Scope:**

Create centralized utility modules:

1. **`lib/calculations.ts`** (consolidate all math)
   - Hematology: VGM, TGMH, CCMH, RDW formulas
   - Chemistry: Ratios, clearances, Z-scores
   - Unit conversions
   - All with test coverage + JSDoc

2. **`lib/status-flow.ts`** (state machine)
   - Valid status transitions
   - Permissions per status change
   - Status display labels + icons
   - Event hooks for side effects (send email on validation, etc.)

3. **`lib/test-classification.ts`** (consolidate test types)
   - Test categories (hematology, chemistry, serology, etc.)
   - Result interpretation rules
   - Flag thresholds (CRITICAL, ABNORMAL, NORMAL)
   - Duplicate current logic in `analysis-tests.ts` + components

4. **`lib/report-generation.ts`** (PDF helpers)
   - Standardized PDF structure
   - Reusable sections (header, table, footer)
   - Envelope generation
   - Pagination logic

5. **`lib/validators.ts`** (Zod schemas)
   - Consolidate all validation (currently scattered in API routes)
   - Reusable schemas for forms, API, database

**Deliverables:**
- ✅ No duplicated functions in components/lib
- ✅ All utilities have JSDoc + type annotations
- ✅ Centralized logic tested
- ✅ 30% code reduction in lib/

**Estimated Effort:** 40-50 hours

---

### **Priority 2.3: Type Safety Audit** (Low-Medium Impact, Medium Effort)

**Why:** Some `any` types and loose typing in utilities weaken TypeScript benefits.

**Scope:**
- Run Pylance/TypeScript strict mode audit
- Replace `any` types with proper generics:
  - API response types
  - Form data types
  - Utility function parameters
- Add proper interface definitions for:
  - Calculation inputs/outputs
  - Status transition payloads
  - Error codes

**Deliverables:**
- ✅ Zero `any` types in lib/ (except necessary escapes, documented)
- ✅ All utilities have strict input/output types
- ✅ TypeScript error count → 0

**Estimated Effort:** 20-30 hours

---

### **Priority 2.4: Documentation & JSDoc** (Low Impact, Medium Effort)

**Why:** Complex logic needs inline documentation for future maintainers.

**Scope:**
- Add JSDoc to all utility functions with:
  - Purpose
  - Parameters + types
  - Return value
  - Example usage
  - Edge cases/limitations
  
- Create ADRs (Architecture Decision Records) for:
  - Why SQLite over PostgreSQL
  - Server Components default pattern
  - Role-based permission model
  - TAT calculation algorithm

**Deliverables:**
- ✅ 100% of lib/ functions have JSDoc
- ✅ 5-7 ADRs in `/docs/decisions/`
- ✅ README updated with architecture overview

**Estimated Effort:** 25-35 hours

---

## Phase 3: Performance & Scalability (Weeks 17-20) 🚀

### **Priority 3.1: Performance Profiling & Optimization** (Medium Impact, Medium Effort)

**Why:** Unknown how app scales with 10k+ analyses, large result sets.

**Scope:**
- Load testing scenarios:
  - 1000 historical analyses → Page load time
  - 500-item result grid entry → Keystroke latency
  - 100-page PDF generation → Memory, time
  - 50 concurrent users → API response time
  
- Optimize identified bottlenecks:
  - Database query optimization (add indexes if needed)
  - Pagination for large lists (cursor-based)
  - Virtual scrolling for result grids
  - PDF streaming instead of in-memory generation
  - Image compression in reports
  
- Measure:
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Time to Interactive (TTI)
  - API response times (p50, p95, p99)

**Deliverables:**
- ✅ Performance benchmarks document
- ✅ Database indexes optimized
- ✅ Large list pagination implemented
- ✅ PDF generation < 5 seconds for 100-page report
- ✅ API 95th percentile latency < 500ms

**Estimated Effort:** 35-50 hours

---

### **Priority 3.2: Database Query Optimization** (Medium Impact, Medium Effort)

**Scope:**
- Audit all Prisma queries:
  - Check for N+1 queries (use `include`/`select` properly)
  - Add missing database indexes (currently minimal)
  - Cache frequently-accessed data (settings, test definitions)
  
- Example improvements:
  - Analyses list: avoid fetching all patient data
  - Report generation: prefetch all related records
  - QC charting: aggregate data server-side

**Deliverables:**
- ✅ Query audit complete
- ✅ Indexes added for common filters (patient_id, status, date range)
- ✅ TanStack Query cache strategy documented
- ✅ N+1 query tests added

**Estimated Effort:** 20-30 hours

---

### **Priority 3.3: Caching Strategy** (Low-Medium Impact, Medium Effort)

**Scope:**
- Implement caching layers:
  - Client-side: TanStack Query (already integrated, improve)
  - Server-side: Redis or file-based cache for:
    - Test definitions (rarely change)
    - Lab settings (cached 1 hour)
    - Patient demographics (1 day)
  - Browser cache: Static assets (images, fonts)
  
- Cache invalidation:
  - Real-time updates via WebSocket or polling
  - Manual refresh button for static data
  - TTL-based expiry

**Deliverables:**
- ✅ Cache strategy document
- ✅ Server cache layer added (Redis or SQLite-based)
- ✅ Cache hit/miss metrics

**Estimated Effort:** 25-35 hours

---

## Phase 4: Security & Compliance (Weeks 21-24) 🔒

### **Priority 4.1: Security Audit & Hardening** (High Impact, Medium Effort)

**Why:** Medical data requires HIPAA/GDPR baseline; current implementation missing controls.

**Scope:**
- Conduct security review:
  - ✅ SQL injection (Prisma guards well, validate)
  - ✅ XSS (React guards well, audit)
  - ✅ CSRF (NextAuth middleware, validate)
  - ✅ Rate limiting (implemented, extend to all endpoints)
  - ✅ Password policy (enforce strong passwords)
  - ✅ Session timeout (implement idle logout)
  - ✅ Encryption (data in transit: HTTPS, at rest: consider)
  
- Implement controls:
  - Rate limiting on all public endpoints
  - HTTPS enforcement
  - Secure headers (CSP, X-Frame-Options, etc.)
  - Input validation schemas (Zod, already done)
  - Permission checks before every data access
  - Sensitive data masking in logs

**Deliverables:**
- ✅ Security checklist complete
- ✅ Rate limiting on all endpoints
- ✅ HTTPS enforced (SSL certificate)
- ✅ Secure headers in response
- ✅ Audit log includes all permission checks
- ✅ Security policy document

**Estimated Effort:** 30-40 hours

---

### **Priority 4.2: Data Privacy & Retention** (Medium Impact, Medium Effort)

**Scope:**
- GDPR compliance:
  - Data export (CSV/JSON of patient + analyses)
  - Data deletion (cascade delete with audit trail)
  - Right to be forgotten (soft delete + purge)
  - Data processing agreement template
  
- Audit archival:
  - Archive audit logs older than 7 years (lab requirement)
  - Compress and encrypt archives
  - Retention policy enforced
  
- Sensitive data:
  - Patient names, SSN masked in UI (show only first/last initial)
  - Password reset links expire (1 hour)
  - Backup files encrypted

**Deliverables:**
- ✅ GDPR compliance checklist
- ✅ Data export/deletion UI
- ✅ Audit log archival automated
- ✅ Privacy policy + data processing agreement

**Estimated Effort:** 25-35 hours

---

### **Priority 4.3: Backup & Disaster Recovery Plan** (Medium Impact, Low Effort)

**Why:** Currently manual recovery; needs automation + testing.

**Scope:**
- Automated daily backups:
  - Compress database + uploads
  - Upload to external storage (S3, cloud provider)
  - Verify integrity (checksum)
  - Retention: keep 30 daily, 12 monthly, 7 yearly
  
- Disaster recovery testing:
  - Monthly restore drills
  - Document RTO/RPO (Recovery Time/Point Objectives)
  - Test on staging first
  
- Documentation:
  - Runbook for disaster recovery
  - Contact list for escalation

**Deliverables:**
- ✅ Backup automation (cloud + local)
- ✅ Restore procedure tested
- ✅ RTO/RPO metrics defined
- ✅ DR runbook published

**Estimated Effort:** 15-20 hours

---

## Phase 5: Deployment & Operations (Weeks 25-28) 📦

### **Priority 5.1: CI/CD Pipeline** (High Impact, Medium Effort)

**Why:** Manual deployments error-prone; need automation.

**Scope:**
- Set up CI/CD (GitHub Actions, GitLab CI, or Jenkins):
  - On PR: Lint, type check, unit tests, E2E tests
  - On merge to main: Build Docker image, run staging tests, auto-deploy
  - Rollback procedure (keep previous 3 images)
  
- Deployment stages:
  - Develop → Staging (automatic on PR)
  - Main → Production (manual approval)
  - Secrets management (env variables, DB credentials)

**Deliverables:**
- ✅ GitHub Actions workflow (or equivalent)
- ✅ Docker image built + pushed to registry
- ✅ Staging auto-deployed + tested
- ✅ Production deployment manual (with checklist)
- ✅ Rollback procedure documented

**Estimated Effort:** 25-35 hours

---

### **Priority 5.2: Monitoring & Observability** (Medium Impact, Medium Effort)

**Scope:**
- Application monitoring:
  - Error rate tracking (structured logging)
  - API response times (percentiles)
  - Database connection pool status
  - Disk space on server
  
- Alerting:
  - High error rate → Page oncall
  - Database locked > 30 sec → Alert
  - Disk > 90% → Warning
  - Backup failed → Alert
  
- Tools:
  - Could use free tier: ELK Stack, Grafana, or simple file-based logging
  - Structured logs (JSON format)

**Deliverables:**
- ✅ Centralized logging
- ✅ Basic metrics dashboard (errors, latency)
- ✅ Alert rules + runbooks
- ✅ Log retention policy (30 days)

**Estimated Effort:** 20-30 hours

---

### **Priority 5.3: Deployment Documentation** (Low Impact, Low Effort)

**Scope:**
- Create deployment guides:
  - Installation (Docker + manual)
  - Configuration walkthrough
  - Backup restore procedure
  - Troubleshooting guide
  - Scaling recommendations
  
- Create operational runbooks:
  - Daily checks
  - Monthly maintenance
  - Disaster recovery
  - User support escalation

**Deliverables:**
- ✅ DEPLOYMENT.md updated with CI/CD info
- ✅ Runbook documentation
- ✅ Troubleshooting FAQ
- ✅ Video walkthrough (optional)

**Estimated Effort:** 10-15 hours

---

## Phase 6: Localization & UX Polish (Weeks 29-32) 🌍

### **Priority 6.1: Multi-Language Support** (Medium Impact, High Effort)

**Why:** French-first makes international expansion hard.

**Scope:**
- Set up i18n framework:
  - Extract all UI strings to translation files
  - Support French (FR) + English (EN) by default
  - Admin panel to manage translations
  
- Translate:
  - UI labels, buttons, messages
  - Error messages
  - Help text
  - Documentation

**Deliverables:**
- ✅ i18n framework integrated (next-intl or i18next)
- ✅ 100% of UI strings translated (FR + EN)
- ✅ Admin UI for translation management
- ✅ Date/number/currency formatting localized

**Estimated Effort:** 50-70 hours

---

### **Priority 6.2: UX Refinements** (Low Impact, Medium Effort)

**Scope:**
- User feedback collection:
  - In-app feedback form
  - User testing sessions
  
- Refinements based on feedback:
  - Keyboard navigation (already partial, expand)
  - Dark mode toggle
  - Mobile responsiveness improvements
  - Accessibility audit (WCAG 2.1 AA)

**Deliverables:**
- ✅ Accessibility audit + fixes
- ✅ Mobile responsive tested
- ✅ Dark mode CSS
- ✅ Keyboard navigation documented

**Estimated Effort:** 20-30 hours

---

## Phase 7: Customer Onboarding & Support (Weeks 33-36) 🤝

### **Priority 7.1: Onboarding Automation** (Medium Impact, Medium Effort)

**Why:** Manual setup is error-prone for non-technical labs.

**Scope:**
- Create setup wizard:
  - Step 1: Database initialization
  - Step 2: Admin user creation
  - Step 3: Lab settings (name, address, phone)
  - Step 4: Test definitions import
  - Step 5: Sample data (optional)
  
- Provide templates:
  - Test definitions (hematology, chemistry, serology)
  - Patient demographics defaults
  - Report templates (lab logo, footer)

**Deliverables:**
- ✅ Setup wizard UI
- ✅ Test definition templates (CSV import)
- ✅ Sample data seed option
- ✅ Onboarding checklist in UI

**Estimated Effort:** 30-40 hours

---

### **Priority 7.2: Help & Documentation** (Low Impact, Medium Effort)

**Scope:**
- Create user-facing help:
  - In-app help tooltips (? icons)
  - Video tutorials (5-10 minutes each)
  - FAQ section
  - Email support template
  
- Admin documentation:
  - System requirements
  - Backup/restore guide
  - User management
  - Troubleshooting

**Deliverables:**
- ✅ In-app help system
- ✅ 5+ video tutorials
- ✅ FAQ + knowledge base
- ✅ Support email template

**Estimated Effort:** 20-25 hours

---

### **Priority 7.3: Customer Success Program** (Low Impact, Low Effort)

**Scope:**
- Post-sale support:
  - 30-day check-in call
  - Monthly newsletter (tips, updates)
  - Community forum (optional)
  - Annual renewal + upgrade path

**Deliverables:**
- ✅ Support SLA documented
- ✅ Check-in email template
- ✅ Newsletter template
- ✅ Upgrade roadmap shared with customers

**Estimated Effort:** 10-15 hours

---

## Summary Timeline & Prioritization

### **Quick Wins (Weeks 1-4)** 🟢
- Unit tests on critical utilities (1.1)
- Error handling layer (1.3)
- Security audit (4.1)
- **Effort:** 120-150 hours
- **Impact:** Catch bugs, prevent data loss, customer trust

### **Core Hardening (Weeks 5-16)** 🟡
- E2E tests (1.2)
- Component refactoring (2.1)
- Consolidate logic (2.2)
- Database safety (1.4)
- Type safety audit (2.3)
- **Effort:** 210-280 hours
- **Impact:** Maintainability, scalability, reliabilty

### **Performance & Ops (Weeks 17-28)** 🟡
- Performance profiling (3.1)
- CI/CD setup (5.1)
- Monitoring (5.2)
- Deployment docs (5.3)
- Data privacy (4.2)
- **Effort:** 150-200 hours
- **Impact:** Production readiness, customer confidence

### **Polish & Growth (Weeks 29-36)** 🟢
- Multi-language (6.1)
- Onboarding (7.1)
- Help & support (7.2)
- Customer program (7.3)
- **Effort:** 100-145 hours
- **Impact:** Market appeal, sales enablement

---

## Total Effort & Cost Estimate

| Phase | Hours | Weeks | Priority |
|-------|-------|-------|----------|
| Testing & Reliability | 250-300 | 8 | CRITICAL |
| Code Quality | 150-200 | 8 | HIGH |
| Performance | 70-100 | 4 | HIGH |
| Security | 60-80 | 4 | CRITICAL |
| Deployment & Ops | 75-100 | 4 | HIGH |
| Localization & UX | 40-50 | 4 | MEDIUM |
| Onboarding & Support | 60-80 | 4 | MEDIUM |
| **TOTAL** | **705-910 hours** | **36 weeks** | — |

**Cost Estimate (at $75/hour):** $52,875 - $68,250  
**Resources:** 1-2 engineers for 6-9 months

---

## Success Criteria for "Commercial Ready"

✅ **Code Quality:**
- 80%+ test coverage (unit + E2E)
- All components < 300 LOC
- Zero TypeScript errors
- All utilities have JSDoc

✅ **Performance:**
- Page load < 2 seconds
- API response < 500ms (p95)
- PDF generation < 5 seconds
- Handles 10k+ analyses without slowdown

✅ **Security:**
- HTTPS enforced
- Rate limiting on all endpoints
- Audit logging complete
- GDPR/HIPAA-aligned

✅ **Reliability:**
- Zero data loss scenarios
- Automated backups + verified restore
- Error handling graceful
- Monitoring + alerting in place

✅ **Operations:**
- CI/CD pipeline automated
- Deployment documented
- Runbooks for common issues
- Support infrastructure ready

✅ **Customer Experience:**
- Setup wizard < 30 minutes
- Help documentation complete
- Multi-language support
- Responsive on mobile

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Scope creep** | Lock features for Phase 1; defer new requests to Phase 2 |
| **Test flakiness** | Invest in test infrastructure; use wait() instead of sleep() |
| **Performance regressions** | CI includes performance tests; revert PRs that degrade |
| **Schema migration disasters** | Test all migrations in shadow DB first; always backup before |
| **Security oversights** | Security audit by 3rd party (optional but recommended) |
| **Team bottleneck** | Document decisions in ADRs; pair programming for knowledge transfer |

---

## Next Steps

1. **Week 1:** Assign ownership of Phase 1 tasks; set up Vitest + Playwright CI
2. **Week 2:** Start unit tests on critical utilities (TAT, interpretations)
3. **Week 3:** Implement error handling layer
4. **Week 4:** Complete E2E test framework setup
5. **Review at Week 4:** Assess progress; adjust timeline if needed

---

**Document Status:** Draft (v1.0)  
**Last Updated:** April 19, 2026  
**Owner:** Engineering Team  
**Review Cycle:** Monthly
