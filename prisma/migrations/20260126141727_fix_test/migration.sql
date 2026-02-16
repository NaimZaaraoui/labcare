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
    "decimals" INTEGER DEFAULT 1,
    "resultType" TEXT NOT NULL DEFAULT 'numeric',
    "category" TEXT,
    "options" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tests" ("category", "code", "createdAt", "id", "isGroup", "maxValue", "minValue", "name", "parentId", "resultType", "unit", "updatedAt") SELECT "category", "code", "createdAt", "id", "isGroup", "maxValue", "minValue", "name", "parentId", "resultType", "unit", "updatedAt" FROM "tests";
DROP TABLE "tests";
ALTER TABLE "new_tests" RENAME TO "tests";
CREATE UNIQUE INDEX "tests_code_key" ON "tests"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
