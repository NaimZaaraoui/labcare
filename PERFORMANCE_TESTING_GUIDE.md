# Performance Testing Quick Start

## Prerequisites

- Node.js 18+
- NexLab CSSB running locally or on staging
- `node-fetch` installed (included in dependencies)

## Running Load Tests

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Application

```bash
npm run dev
# NexLab should be running at http://localhost:3000
```

### 3. Run Performance Tests

In a separate terminal:

```bash
# Test 1: List analyses (most common operation)
npx ts-node scripts/performance-test.ts list-analyses

# Test 2: Save results (high-concurrency write)
npx ts-node scripts/performance-test.ts save-results

# Test 3: PDF generation (resource-intensive)
npx ts-node scripts/performance-test.ts pdf-generation
```

## Understanding Test Results

### Example Output

```
============================================================
📊 Test Results: List Analyses (50 concurrent, 10s duration)
============================================================

Total Requests:      1250
Successful:          1248 (99.8%)
Failed:              2
Duration:            10.05s
Requests/sec:        124.38

Response Times:
  Average:           312.45ms
  Min:               45.23ms
  Max:               1245.32ms
  p50:               280.00ms
  p95:               520.15ms
  p99:               890.42ms

📈 Target Comparison:
  Average: 312.45ms (target: 200ms) ❌
  p95: 520.15ms (target: 300ms) ❌
```

### Interpreting Metrics

| Metric | Good | Acceptable | Poor |
|--------|------|-----------|------|
| **p95 Response Time** | < 150ms | 150-300ms | > 300ms |
| **p99 Response Time** | < 300ms | 300-600ms | > 600ms |
| **Error Rate** | < 0.1% | 0.1-1% | > 1% |
| **Requests/sec** | > 100 | 50-100 | < 50 |

## Profiling with Chrome DevTools

### 1. List Analyses Page Performance

```bash
# Start the app
npm run dev

# Open in Chrome
# 1. Navigate to http://localhost:3000/app/analyses
# 2. Press F12 to open DevTools
# 3. Go to Performance tab
# 4. Click record
# 5. Scroll through the list and interact with filters
# 6. Stop recording after ~10 seconds
# 7. Analyze the flame chart
```

**Look for:**
- Long render times (> 50ms bars in orange/red)
- JavaScript heavy operations in main thread
- Layout thrashing (repeated paint/layout cycles)

### 2. Results Grid Performance

```bash
# Same as above but on analysis details page
# 1. Navigate to an analysis
# 2. Open Performance tab
# 3. Interact with result editing
# 4. Look for keystroke response times
# Target: < 50ms latency between keystroke and visual feedback
```

### 3. Flame Chart Analysis

In Chrome DevTools Performance tab:

- **Orange** = JavaScript execution
- **Purple** = Rendering/Layout
- **Green** = Painting
- **Gray** = Other

**Target:** No single frame should take > 16ms (60fps target)

## Node.js Profiler

### Profile Server-Side Performance

```bash
# With built-in Node.js profiler
node --prof scripts/performance-test.ts list-analyses

# Process the profile
node --prof-process isolate-*.log > profile.txt

# View results
cat profile.txt | head -50
```

### Real-time CPU Profiling

```bash
# Using clinic.js (install first: npm install -g clinic)
clinic doctor -- npm run dev

# Run tests in another terminal
npx ts-node scripts/performance-test.ts list-analyses

# Open clinic report in browser
```

## Database Query Profiling

### Enable Slow Query Logging

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
  
  // Log queries in development
  logs     = ["query", "info", "warn"]
}
```

Then restart and run tests:

```bash
npm run dev 2>&1 | grep -A 2 "duration:"
```

### Analyze Query Plans

```bash
# For specific slow queries, use EXPLAIN QUERY PLAN
sqlite3 prisma/dev.db

> EXPLAIN QUERY PLAN SELECT * FROM Analysis WHERE status = 'validated_bio';

-- Good output: Uses index
-- Bad output: SCAN TABLE (full table scan)
```

## Setting Up Continuous Monitoring

### 1. Add Performance Tracking to API Routes

Update key API routes to use the performance tracking middleware:

```typescript
// app/api/analyses/route.ts
import { withPerformanceTracking } from '@/lib/performance';

export async function GET(request: Request) {
  return withPerformanceTracking('list-analyses', async () => {
    // Your existing GET logic
  });
}
```

### 2. View Metrics in Real-time

```bash
# Start app with metrics logging
NODE_ENV=development METRICS_ENDPOINT=http://localhost:3001/metrics npm run dev

# In another terminal, watch logs
npm run dev 2>&1 | grep "\[PERF\]"
```

### 3. Create Monitoring Dashboard (Optional)

```typescript
// pages/admin/performance.tsx
import { metricsCollector } from '@/lib/performance';

export default function PerformanceDashboard() {
  const summary = metricsCollector.getSummary();
  
  return (
    <div>
      <h1>Performance Metrics</h1>
      <div>
        <p>Average Response Time: {summary?.avgDuration.toFixed(2)}ms</p>
        <p>p95: {summary?.p95.toFixed(2)}ms</p>
        <p>Success Rate: {((summary?.successfulRequests ?? 0) / (summary?.totalRequests ?? 1) * 100).toFixed(1)}%</p>
      </div>
    </div>
  );
}
```

## Performance Benchmarking Workflow

### Week 1: Establish Baseline

```bash
# Run all tests 3 times each, record average
for i in 1 2 3; do
  echo "=== Run $i ==="
  npx ts-node scripts/performance-test.ts list-analyses
  npx ts-node scripts/performance-test.ts save-results
  npx ts-node scripts/performance-test.ts pdf-generation
  sleep 5
done
```

### Week 2-3: After Optimizations

```bash
# Run same tests and compare
# Document % improvement for each scenario
npx ts-node scripts/performance-test.ts list-analyses > results-week3.txt

# Compare with baseline
diff results-week1.txt results-week3.txt
```

### Success Criteria

```
List Analyses:
  Before: p95 = 520ms
  After:  p95 = 150ms
  ✅ Improvement: 71%

Save Results:
  Before: p95 = 450ms
  After:  p95 = 180ms
  ✅ Improvement: 60%

PDF Generation:
  Before: avg = 8500ms
  After:  avg = 4200ms
  ✅ Improvement: 51%
```

## Troubleshooting

### "ECONNREFUSED: Connection refused"
- Make sure app is running: `npm run dev`
- Check it's on http://localhost:3000

### "High memory usage during tests"
- Reduce concurrency: `scripts/performance-test.ts --concurrency 10`
- Ensure garbage collection is happening
- Check for memory leaks in Node profiler

### "Inconsistent test results"
- Run on same machine multiple times
- Disable background processes
- Use `performance.now()` not `Date.now()` for accuracy

## References

- [PERFORMANCE_BASELINE.md](../PERFORMANCE_BASELINE.md) - Detailed metrics
- [DATABASE_OPTIMIZATION.md](../DATABASE_OPTIMIZATION.md) - Query optimization
- [PHASE_3_1_CHECKLIST.md](../PHASE_3_1_CHECKLIST.md) - Implementation plan
- [lib/performance.ts](../lib/performance.ts) - Monitoring utilities
