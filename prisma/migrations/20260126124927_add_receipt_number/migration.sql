-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unit" TEXT,
    "minValue" REAL,
    "maxValue" REAL,
    "resultType" TEXT NOT NULL DEFAULT 'numeric',
    "category" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_tests" ("category", "code", "createdAt", "id", "maxValue", "minValue", "name", "resultType", "unit", "updatedAt") SELECT "category", "code", "createdAt", "id", "maxValue", "minValue", "name", "resultType", "unit", "updatedAt" FROM "tests";
DROP TABLE "tests";
ALTER TABLE "new_tests" RENAME TO "tests";
CREATE UNIQUE INDEX "tests_code_key" ON "tests"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
