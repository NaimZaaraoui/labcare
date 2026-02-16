/*
  Warnings:

  - You are about to drop the column `decimals` on the `tests` table. All the data in the column will be lost.
  - You are about to drop the column `isGroup` on the `tests` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `tests` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `tests` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "analyses_receiptNumber_key";

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_tests" ("category", "code", "createdAt", "id", "maxValue", "minValue", "name", "resultType", "unit", "updatedAt") SELECT "category", "code", "createdAt", "id", "maxValue", "minValue", "name", "resultType", "unit", "updatedAt" FROM "tests";
DROP TABLE "tests";
ALTER TABLE "new_tests" RENAME TO "tests";
CREATE UNIQUE INDEX "tests_code_key" ON "tests"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
