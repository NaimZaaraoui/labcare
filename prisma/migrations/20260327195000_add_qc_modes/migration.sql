PRAGMA foreign_keys=OFF;

CREATE TABLE "new_qc_targets" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "lotId" TEXT NOT NULL,
  "testId" TEXT,
  "testCode" TEXT NOT NULL,
  "testName" TEXT NOT NULL,
  "controlMode" TEXT NOT NULL DEFAULT 'STATISTICAL',
  "mean" REAL NOT NULL,
  "sd" REAL,
  "minAcceptable" REAL,
  "maxAcceptable" REAL,
  "unit" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "qc_targets_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "qc_lots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "qc_targets_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_qc_targets" (
  "id", "lotId", "testId", "testCode", "testName", "controlMode", "mean", "sd", "minAcceptable", "maxAcceptable", "unit", "createdAt", "updatedAt"
)
SELECT
  "id", "lotId", "testId", "testCode", "testName", 'STATISTICAL', "mean", "sd", ("mean" - (2 * "sd")), ("mean" + (2 * "sd")), "unit", "createdAt", "updatedAt"
FROM "qc_targets";

DROP TABLE "qc_targets";
ALTER TABLE "new_qc_targets" RENAME TO "qc_targets";
CREATE INDEX "qc_targets_lotId_idx" ON "qc_targets"("lotId");
CREATE INDEX "qc_targets_testCode_idx" ON "qc_targets"("testCode");
CREATE UNIQUE INDEX "qc_targets_lotId_testCode_key" ON "qc_targets"("lotId", "testCode");

CREATE TABLE "new_qc_values" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "resultId" TEXT NOT NULL,
  "testId" TEXT,
  "testCode" TEXT NOT NULL,
  "testName" TEXT NOT NULL,
  "controlMode" TEXT NOT NULL DEFAULT 'STATISTICAL',
  "measured" REAL NOT NULL,
  "mean" REAL NOT NULL,
  "sd" REAL,
  "minAcceptable" REAL,
  "maxAcceptable" REAL,
  "zScore" REAL,
  "inAcceptanceRange" BOOLEAN,
  "flag" TEXT NOT NULL,
  "rule" TEXT,
  "unit" TEXT,
  CONSTRAINT "qc_values_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "qc_results" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "qc_values_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_qc_values" (
  "id", "resultId", "testId", "testCode", "testName", "controlMode", "measured", "mean", "sd", "minAcceptable", "maxAcceptable", "zScore", "inAcceptanceRange", "flag", "rule", "unit"
)
SELECT
  "id", "resultId", "testId", "testCode", "testName", 'STATISTICAL', "measured", "mean", "sd", ("mean" - (2 * "sd")), ("mean" + (2 * "sd")), "zScore", NULL, "flag", "rule", "unit"
FROM "qc_values";

DROP TABLE "qc_values";
ALTER TABLE "new_qc_values" RENAME TO "qc_values";
CREATE INDEX "qc_values_resultId_idx" ON "qc_values"("resultId");
CREATE INDEX "qc_values_testCode_idx" ON "qc_values"("testCode");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
