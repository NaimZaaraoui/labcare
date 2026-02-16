-- AlterTable
ALTER TABLE "tests" ADD COLUMN "options" TEXT;
ALTER TABLE "tests" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "tests_parentId_idx" ON "tests"("parentId");

-- AddForeignKey (This syntax is generic, SQLite might require table recreation for foreign keys if not using pragmas, but Prisma migrate deploy usually handles this via shadow database if available, or we can use the manual recreation pattern if needed. Since I'm doing a manual migration for a live-ish env, I'll stick to simple ALTER for now and rely on application logic or PRAGMA.)
-- Note: SQLite doesn't support adding FKs via ALTER TABLE. Assuming Prisma migrate deploy will handle the complex recreation if needed, or I'll use the RedefineTables pattern.

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
    "options" TEXT,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tests" ("category", "code", "createdAt", "id", "maxValue", "minValue", "name", "resultType", "unit", "updatedAt") SELECT "category", "code", "createdAt", "id", "maxValue", "minValue", "name", "resultType", "unit", "updatedAt" FROM "tests";
DROP TABLE "tests";
ALTER TABLE "new_tests" RENAME TO "tests";
CREATE UNIQUE INDEX "tests_code_key" ON "tests"("code");
CREATE INDEX "tests_parentId_idx" ON "tests"("parentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
