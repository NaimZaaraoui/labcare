/*
  Warnings:

  - You are about to drop the column `altFactor` on the `tests` table. All the data in the column will be lost.
  - You are about to drop the column `altUnit` on the `tests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "analyses" ADD COLUMN "histogramData" TEXT;

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
    "minValueM" REAL,
    "maxValueM" REAL,
    "minValueF" REAL,
    "maxValueF" REAL,
    "decimals" INTEGER DEFAULT 1,
    "resultType" TEXT NOT NULL DEFAULT 'numeric',
    "category" TEXT,
    "categoryId" TEXT,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "options" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tests" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tests" ("category", "categoryId", "code", "createdAt", "decimals", "id", "isGroup", "maxValue", "maxValueF", "maxValueM", "minValue", "minValueF", "minValueM", "name", "options", "parentId", "rank", "resultType", "unit", "updatedAt") SELECT "category", "categoryId", "code", "createdAt", "decimals", "id", "isGroup", "maxValue", "maxValueF", "maxValueM", "minValue", "minValueF", "minValueM", "name", "options", "parentId", "rank", "resultType", "unit", "updatedAt" FROM "tests";
DROP TABLE "tests";
ALTER TABLE "new_tests" RENAME TO "tests";
CREATE UNIQUE INDEX "tests_code_key" ON "tests"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
