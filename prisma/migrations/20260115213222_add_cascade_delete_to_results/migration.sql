-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "value" TEXT,
    "unit" TEXT,
    "notes" TEXT,
    "abnormal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "results_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "results_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_results" ("abnormal", "analysisId", "createdAt", "id", "notes", "testId", "unit", "updatedAt", "value") SELECT "abnormal", "analysisId", "createdAt", "id", "notes", "testId", "unit", "updatedAt", "value" FROM "results";
DROP TABLE "results";
ALTER TABLE "new_results" RENAME TO "results";
CREATE UNIQUE INDEX "results_analysisId_testId_key" ON "results"("analysisId", "testId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
