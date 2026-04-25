# Phase 3.1 Implementation Checklist

**Phase:** Performance Profiling & Optimization  
**Status:** In Progress  
**Start Date:** April 20, 2026  
**Target Completion:** 4 weeks  

---

## Week 1: Profiling & Baselines

- [ ] **Setup Performance Monitoring**
  - [ ] Create `lib/performance.ts` utility module ✅
  - [ ] Add Web Vitals tracking to `app/layout.tsx`
  - [ ] Add API response time tracking middleware
  - [ ] Integrate performance monitoring dashboard (optional: use web-vitals library)

- [ ] **Establish Baselines**
  - [ ] Run load test: List analyses (50 concurrent, 10s)
  - [ ] Run load test: Save results (20 concurrent, 10s)
  - [ ] Run load test: PDF generation (5 concurrent)
  - [ ] Capture current metrics in `PERFORMANCE_BASELINE.md`
  - [ ] Document baseline values for all scenarios

- [ ] **Profile Current Bottlenecks**
  - [ ] Use Chrome DevTools profiler on analysis list page
  - [ ] Use Chrome DevTools profiler on results grid page
  - [ ] Use Node.js profiler on API endpoints
  - [ ] Identify top 3 slowest operations

- [ ] **Document Findings**
  - [ ] Create performance audit report
  - [ ] List all identified bottlenecks with severity
  - [ ] Prioritize optimizations by impact/effort ratio

**Deliverable:** Performance baseline report with current metrics and identified bottlenecks

---

## Week 2: Critical Database Fixes

- [ ] **Add Database Indexes**
  - [ ] Update `prisma/schema.prisma` with recommended indexes
  - [ ] Create migration: `npx prisma migrate dev --name add_performance_indexes`
  - [ ] Test index creation on existing database
  - [ ] Verify indexes reduce query time by 70%+

- [ ] **Fix N+1 Queries**
  - [ ] Audit `app/api/analyses/**/*.ts` for query patterns
  - [ ] Add `include` or `select` to Prisma queries
  - [ ] Replace loop-based queries with batch operations
  - [ ] Test: Measure API response times before/after

- [ ] **Implement Query Optimization**
  - [ ] Update analysis list query to use pagination
  - [ ] Fix date range queries (use comparison operators)
  - [ ] Add proper field selection (avoid SELECT *)
  - [ ] Test with 10k+ records

- [ ] **Add Async Audit Logging**
  - [ ] Create `lib/audit-queue.ts` for async log writes
  - [ ] Update audit logging to use queue
  - [ ] Ensure audit logs still written eventually
  - [ ] Measure result save time improvement

**Performance Targets:**
- [ ] API list endpoint: p95 < 300ms (from baseline)
- [ ] Result save endpoint: p95 < 300ms (from baseline)
- [ ] Database queries: p95 < 50ms (from baseline)

**Deliverable:** Database optimization complete with measurable API performance improvements

---

## Week 3: Frontend Optimization

- [ ] **Implement Virtual Scrolling**
  - [ ] Install `react-window` package
  - [ ] Update `AnalysisResultRow` to use virtual list
  - [ ] Update grid components to handle virtual scrolling
  - [ ] Test with 500+ items

- [ ] **Add React.memo to Grid Components**
  - [ ] Identify row components that re-render unnecessarily
  - [ ] Wrap with `React.memo` to prevent unnecessary renders
  - [ ] Add custom comparison functions if needed
  - [ ] Measure render time improvement

- [ ] **Optimize Chart Rendering**
  - [ ] Profile recharts performance with 1000+ points
  - [ ] Implement data aggregation or downsampling
  - [ ] Use Canvas rendering if available
  - [ ] Add chart interaction debouncing
  - [ ] Test zoom/pan responsiveness

- [ ] **Optimize PDF Generation**
  - [ ] Profile PDF generation for 100+ page report
  - [ ] Implement server-side streaming or external service
  - [ ] Or implement in-memory optimization with chunking
  - [ ] Target: < 5 seconds for 100-page report

**Performance Targets:**
- [ ] ResultsGrid keystroke latency: < 50ms (from baseline)
- [ ] Chart rendering with 1000 points: smooth 60fps
- [ ] PDF generation: < 5s (from baseline)

**Deliverable:** Frontend optimizations with measurable rendering improvements

---

## Week 4: Testing & Documentation

- [ ] **Retest All Scenarios**
  - [ ] Run all load tests from Week 1
  - [ ] Compare before/after metrics
  - [ ] Calculate improvement percentages
  - [ ] Identify any remaining bottlenecks

- [ ] **Create Performance Tests**
  - [ ] Add unit tests for slow query patterns
  - [ ] Add E2E performance tests (Playwright)
  - [ ] Set up performance regression detection
  - [ ] Add to CI/CD pipeline

- [ ] **Document Optimizations**
  - [ ] Update `PERFORMANCE_BASELINE.md` with actual improvements
  - [ ] Create `OPTIMIZATION_GUIDE.md` with best practices
  - [ ] Document all index additions
  - [ ] Create runbook for monitoring performance

- [ ] **Setup Continuous Monitoring**
  - [ ] Integrate Web Vitals tracking
  - [ ] Setup slow query logging
  - [ ] Create performance dashboard (optional)
  - [ ] Set alerting thresholds for regressions

**Deliverable:** Final performance report showing all improvements, performance tests integrated into CI/CD

---

## Key Metrics to Track

### Before Phase 3.1 (Baseline - to be filled in Week 1)
```
List Analyses (50 concurrent):
  - Average: ___ ms
  - p95: ___ ms
  
Save Results (20 concurrent):
  - Average: ___ ms
  - p95: ___ ms

PDF Generation:
  - Average: ___ ms per report
  - Memory peak: ___ MB

ResultsGrid (500 items):
  - Initial render: ___ ms
  - Keystroke latency: ___ ms

Web Vitals:
  - FCP: ___ ms
  - LCP: ___ ms
  - CLS: ___ 
```

### After Phase 3.1 (Target - to be validated Week 4)
```
List Analyses: 
  - Target: p95 < 300ms
  - Expected: 70% improvement

Save Results:
  - Target: p95 < 300ms
  - Expected: 60% improvement

PDF Generation:
  - Target: < 5s per 100-page report
  - Expected: 50% improvement (if implemented)

ResultsGrid:
  - Target: keystroke latency < 50ms
  - Expected: 60% improvement

Web Vitals:
  - Target: FCP < 1.5s, LCP < 2.5s
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Indexes break existing queries** | Test thoroughly on staging; create rollback migration |
| **Virtual scrolling breaks accessibility** | Test with screen readers; implement proper ARIA labels |
| **Performance tests are flaky** | Use proper waits; avoid sleep(); rerun failed tests |
| **Optimization makes code harder to understand** | Document why optimizations exist; add comments |
| **Performance regresses later** | Enforce performance budgets in CI/CD |

---

## Success Criteria

✅ **Week 1:** Baseline metrics captured; bottlenecks identified  
✅ **Week 2:** 60-70% improvement on API performance; indexes added  
✅ **Week 3:** 50%+ improvement on frontend rendering; charts optimized  
✅ **Week 4:** All targets met; performance tests integrated; monitoring setup

**Overall Success:** 60-70% improvement on target scenarios vs. baseline

---

## Resources & References

- Performance Baseline: [PERFORMANCE_BASELINE.md](../PERFORMANCE_BASELINE.md)
- Database Optimization: [DATABASE_OPTIMIZATION.md](../DATABASE_OPTIMIZATION.md)
- Performance Monitoring: [lib/performance.ts](../lib/performance.ts)
- Load Testing: [scripts/performance-test.ts](../scripts/performance-test.ts)

---

## Next Steps

1. **Run Week 1 profiling** to establish baselines
2. **Identify top 3 bottlenecks** from profiling
3. **Start Week 2** with database index optimization
4. **Track metrics** throughout execution
5. **Report progress** weekly with comparison to targets
