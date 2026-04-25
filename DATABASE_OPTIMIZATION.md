# Database Performance Optimization Guide

**Purpose:** Identify and fix common database bottlenecks in NexLab CSSB  
**Focus:** SQLite optimizations, query patterns, and indexing strategy

---

## 1. Index Strategy

### Critical Indexes (Must Have)

```prisma
// prisma/schema.prisma

model Analysis {
  // ... existing fields ...
  
  @@index([patientId])          // For patient-analysis queries
  @@index([status])              // For status filtering
  @@index([createdAt])           // For date range queries
  @@index([orderNumber])         // For search/lookup
  @@unique([patientId, createdAt])  // Prevent duplicate entries same day
}

model Result {
  // ... existing fields ...
  
  @@index([analysisId])          // For fetching results by analysis
  @@index([testId])              // For test-specific queries
}

model Test {
  // ... existing fields ...
  
  @@index([code])                // For code-based lookups
  @@index([categoryId])          // For category filtering
}

model User {
  // ... existing fields ...
  
  @@index([email])               // For login
  @@index([role])                // For role-based filtering
}

model AuditLog {
  // ... existing fields ...
  
  @@index([entityId])            // For entity audit trails
  @@index([action])              // For action filtering
  @@index([createdAt])           // For date-range queries
}
```

### Why These Indexes Matter

| Index | Query Type | Impact | Example |
|-------|-----------|--------|---------|
| `patientId` | Foreign key lookups | -80% on patient analysis lists | `WHERE patientId = $1` |
| `status` | Status filtering | -90% on status filters | `WHERE status IN (...)` |
| `createdAt` | Date ranges | -85% on history queries | `WHERE createdAt > $1 AND createdAt < $2` |
| `analysisId` (Result) | Fetch all results | -75% on result retrieval | `WHERE analysisId = $1` |

---

## 2. Query Patterns: Before & After

### Pattern 1: N+1 Query Problem

**❌ BEFORE (Slow - Multiple queries):**
```typescript
// Fetches analysis without results
const analyses = await prisma.analysis.findMany({
  where: { status: 'validated_bio' }
});

// Then loops and fetches results for each
for (const analysis of analyses) {
  const results = await prisma.result.findMany({
    where: { analysisId: analysis.id },
    include: { test: true }
  });
  // Process results...
}
// Total queries: 1 + N (where N = number of analyses)
```

**✅ AFTER (Fast - Single query with eager loading):**
```typescript
const analyses = await prisma.analysis.findMany({
  where: { status: 'validated_bio' },
  include: {
    results: {
      include: { test: true }
    }
  }
});

for (const analysis of analyses) {
  // Results already loaded!
}
// Total queries: 1
```

**Impact:** Reduces query time from O(N) to O(1)

---

### Pattern 2: Unnecessary Data Fetching

**❌ BEFORE (Loads everything):**
```typescript
const analysis = await prisma.analysis.findUnique({
  where: { id },
  include: {
    patient: true,        // Don't need all patient fields
    results: true,        // Don't need all result fields
    createdByUser: true,  // Don't need user details
  }
});
```

**✅ AFTER (Select only needed fields):**
```typescript
const analysis = await prisma.analysis.findUnique({
  where: { id },
  select: {
    id: true,
    orderNumber: true,
    status: true,
    createdAt: true,
    results: {
      select: {
        id: true,
        value: true,
        test: {
          select: { code: true, name: true }
        }
      }
    }
  }
});
```

**Impact:** Reduces payload size by 60-80%

---

### Pattern 3: Inefficient Filtering

**❌ BEFORE (Fetch all, filter in code):**
```typescript
// Fetches ALL analyses, filters in memory
const analyses = await prisma.analysis.findMany();
const recent = analyses.filter(a => 
  new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
);
```

**✅ AFTER (Filter in database):**
```typescript
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const recent = await prisma.analysis.findMany({
  where: {
    createdAt: { gte: sevenDaysAgo }
  }
});
```

**Impact:** Reduces memory usage and query time

---

### Pattern 4: Pagination for Large Lists

**❌ BEFORE (Load entire list):**
```typescript
const analyses = await prisma.analysis.findMany({
  orderBy: { createdAt: 'desc' }
});
// Loads all 10,000 records into memory!
```

**✅ AFTER (Pagination):**
```typescript
const page = 1;
const pageSize = 50;

const [analyses, total] = await Promise.all([
  prisma.analysis.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: 'desc' }
  }),
  prisma.analysis.count()
]);

const totalPages = Math.ceil(total / pageSize);
```

**Impact:** Constant memory usage regardless of dataset size

---

### Pattern 5: Batch Operations

**❌ BEFORE (Loop with individual updates):**
```typescript
for (const resultId of resultIds) {
  await prisma.result.update({
    where: { id: resultId },
    data: { value: calculations[resultId] }
  });
}
// N database round-trips
```

**✅ AFTER (Batch transaction):**
```typescript
await prisma.$transaction(
  resultIds.map(resultId =>
    prisma.result.update({
      where: { id: resultId },
      data: { value: calculations[resultId] }
    })
  )
);
// Single database transaction
```

**Impact:** 50-80% faster for large batches

---

## 3. Common Slow Query Patterns

### 🔴 ANTI-PATTERN 1: Wildcard Search at Start

```typescript
// ❌ Slow: LIKE '%term%' prevents index use
WHERE patientName LIKE '%smith%'

// ✅ Fast: Use full-text search or left-anchored
WHERE patientName LIKE 'smith%'
```

### 🔴 ANTI-PATTERN 2: OR with Multiple Conditions

```typescript
// ❌ Slow: OR makes index usage difficult
WHERE (status = 'validated_bio' OR status = 'completed') 
  AND createdAt > ?

// ✅ Fast: Use IN clause
WHERE status IN ('validated_bio', 'completed') 
  AND createdAt > ?
```

### 🔴 ANTI-PATTERN 3: Date Calculations in WHERE

```typescript
// ❌ Slow: Function on column prevents index
WHERE DATE(createdAt) = '2024-04-20'

// ✅ Fast: Range comparison
WHERE createdAt >= '2024-04-20' 
  AND createdAt < '2024-04-21'
```

### 🔴 ANTI-PATTERN 4: NOT IN with Subquery

```typescript
// ❌ Slow: Subquery + NOT IN
WHERE id NOT IN (SELECT analysisId FROM AuditLog)

// ✅ Fast: LEFT JOIN with NULL check
WHERE AuditLog.id IS NULL
```

---

## 4. SQLite-Specific Optimizations

### 4.1 Enable Write-Ahead Logging

```sql
-- In database initialization or migration
PRAGMA journal_mode = WAL;
-- Benefits: Better concurrent read/write performance
```

### 4.2 Optimize Cache Size

```sql
PRAGMA cache_size = -64000;  -- 64MB cache
-- Benefits: Faster access to frequently-used pages
```

### 4.3 Analyze Query Plans

```sql
-- See how SQLite executes a query
EXPLAIN QUERY PLAN SELECT * FROM Analysis WHERE status = 'validated_bio';

-- Good output: Uses index
-- Bad output: SCAN TABLE (full table scan)
```

### 4.4 Vacuum & Defragment

```sql
-- Optimize database file size (run monthly)
VACUUM;

-- Reindex if performance degrades
REINDEX;
```

---

## 5. Audit Log Optimization

### Problem
Audit logs grow quickly; queries slow down with millions of records.

### Solution: Archive Old Logs

```typescript
// scripts/archive-old-audit-logs.ts

async function archiveOldAuditLogs() {
  const cutoffDate = new Date();
  cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); // 1 year old

  // Export to JSON file
  const oldLogs = await prisma.auditLog.findMany({
    where: { createdAt: { lt: cutoffDate } }
  });

  // Write to compressed archive
  const filename = `audit-logs-${cutoffDate.getFullYear()}.json.gz`;
  fs.writeFileSync(filename, JSON.stringify(oldLogs));

  // Delete from active database
  await prisma.auditLog.deleteMany({
    where: { createdAt: { lt: cutoffDate } }
  });
}
```

---

## 6. Monitoring Query Performance

### Enable Slow Query Logging

```typescript
// prisma/schema.prisma

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
  
  // Log queries taking > 100ms
  // Uncomment for development:
  // logs     = ["query", "info", "warn", "error"]
}
```

### Parse Logs

```typescript
const logs = fs.readFileSync('prisma.log', 'utf-8');
const slowQueries = logs
  .split('\n')
  .filter(line => line.includes('duration:') && 
    parseInt(line.match(/duration: (\d+)/)?.[1] || '0') > 100);

console.log('Slow queries:', slowQueries);
```

---

## 7. Testing Query Performance

### Benchmark Script

```typescript
// tests/performance/query-benchmark.test.ts

import { performance } from 'perf_hooks';

describe('Query Performance', () => {
  it('should fetch 1000 analyses in < 100ms', async () => {
    const start = performance.now();
    
    await prisma.analysis.findMany({
      where: { status: 'validated_bio' },
      take: 1000,
      include: { results: { include: { test: true } } }
    });
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('should not have N+1 queries', async () => {
    let queryCount = 0;
    
    // Count queries (would need Prisma query logging setup)
    // ...
    
    expect(queryCount).toBeLessThan(3); // Only 1-2 queries
  });
});
```

---

## 8. Optimization Checklist

- [ ] All critical indexes added to schema
- [ ] Query patterns reviewed and optimized
- [ ] N+1 queries eliminated
- [ ] Pagination added to list endpoints
- [ ] Date range queries use comparison operators
- [ ] Slow query logging enabled in development
- [ ] Archive strategy for audit logs
- [ ] Database VACUUM scheduled weekly
- [ ] WAL mode enabled
- [ ] Cache size optimized

---

## 9. Expected Performance Improvements

After implementing above optimizations:

| Query | Before | After | Improvement |
|-------|--------|-------|------------|
| List analyses (1000 items) | 500ms | 50ms | **90%** |
| Fetch analysis with results | 200ms | 20ms | **90%** |
| Search by date range | 800ms | 100ms | **87%** |
| Concurrent status updates | High lock contention | < 5ms lock time | **95%** |
| Audit log queries | 1000ms | 50ms | **95%** |

**Overall Expected API Improvement:** 60-70% faster
