CREATE TABLE "qc_materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "manufacturer" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "qc_lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "qc_lots_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "qc_materials" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "qc_targets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotId" TEXT NOT NULL,
    "testId" TEXT,
    "testCode" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "mean" REAL NOT NULL,
    "sd" REAL NOT NULL,
    "unit" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "qc_targets_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "qc_lots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "qc_targets_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "qc_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lotId" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedByName" TEXT,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "instrumentName" TEXT,
    "comment" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "qc_results_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "qc_lots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "qc_values" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "resultId" TEXT NOT NULL,
    "testId" TEXT,
    "testCode" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "measured" REAL NOT NULL,
    "mean" REAL NOT NULL,
    "sd" REAL NOT NULL,
    "zScore" REAL NOT NULL,
    "flag" TEXT NOT NULL,
    "rule" TEXT,
    "unit" TEXT,
    CONSTRAINT "qc_values_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "qc_results" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "qc_values_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "qc_materials_isActive_idx" ON "qc_materials"("isActive");
CREATE INDEX "qc_materials_name_idx" ON "qc_materials"("name");
CREATE INDEX "qc_lots_materialId_isActive_idx" ON "qc_lots"("materialId", "isActive");
CREATE INDEX "qc_lots_expiryDate_idx" ON "qc_lots"("expiryDate");
CREATE UNIQUE INDEX "qc_lots_materialId_lotNumber_key" ON "qc_lots"("materialId", "lotNumber");
CREATE INDEX "qc_targets_lotId_idx" ON "qc_targets"("lotId");
CREATE INDEX "qc_targets_testCode_idx" ON "qc_targets"("testCode");
CREATE UNIQUE INDEX "qc_targets_lotId_testCode_key" ON "qc_targets"("lotId", "testCode");
CREATE INDEX "qc_results_lotId_performedAt_idx" ON "qc_results"("lotId", "performedAt");
CREATE INDEX "qc_results_status_idx" ON "qc_results"("status");
CREATE INDEX "qc_values_resultId_idx" ON "qc_values"("resultId");
CREATE INDEX "qc_values_testCode_idx" ON "qc_values"("testCode");
