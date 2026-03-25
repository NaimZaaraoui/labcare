-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "patientId" TEXT,
    "patientFirstName" TEXT,
    "patientLastName" TEXT,
    "patientAge" INTEGER,
    "patientGender" TEXT,
    "receiptNumber" TEXT,
    "dailyId" TEXT,
    "provenance" TEXT,
    "medecinPrescripteur" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "creationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "drawingDate" DATETIME,
    "status" TEXT DEFAULT 'pending',
    "printedAt" DATETIME,
    "histogramData" TEXT,
    "totalPrice" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "globalNote" TEXT,
    "globalNotePlacement" TEXT NOT NULL DEFAULT 'all',
    "validatedBioAt" DATETIME,
    "validatedBioBy" TEXT,
    "validatedBioName" TEXT,
    "validatedTechAt" DATETIME,
    "validatedTechBy" TEXT,
    "validatedTechName" TEXT,
    CONSTRAINT "analyses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_analyses" ("createdAt", "creationDate", "dailyId", "drawingDate", "globalNote", "globalNotePlacement", "histogramData", "id", "isUrgent", "medecinPrescripteur", "orderNumber", "patientAge", "patientFirstName", "patientGender", "patientId", "patientLastName", "printedAt", "provenance", "receiptNumber", "status", "updatedAt", "validatedBioAt", "validatedBioBy", "validatedBioName", "validatedTechAt", "validatedTechBy", "validatedTechName") SELECT "createdAt", "creationDate", "dailyId", "drawingDate", "globalNote", "globalNotePlacement", "histogramData", "id", "isUrgent", "medecinPrescripteur", "orderNumber", "patientAge", "patientFirstName", "patientGender", "patientId", "patientLastName", "printedAt", "provenance", "receiptNumber", "status", "updatedAt", "validatedBioAt", "validatedBioBy", "validatedBioName", "validatedTechAt", "validatedTechBy", "validatedTechName" FROM "analyses";
DROP TABLE "analyses";
ALTER TABLE "new_analyses" RENAME TO "analyses";
CREATE UNIQUE INDEX "analyses_orderNumber_key" ON "analyses"("orderNumber");
CREATE TABLE "new_bilans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_bilans" ("code", "createdAt", "id", "name", "updatedAt") SELECT "code", "createdAt", "id", "name", "updatedAt" FROM "bilans";
DROP TABLE "bilans";
ALTER TABLE "new_bilans" RENAME TO "bilans";
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
    "sampleType" TEXT,
    "price" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "tests" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tests_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tests" ("category", "categoryId", "code", "createdAt", "decimals", "id", "isGroup", "maxValue", "maxValueF", "maxValueM", "minValue", "minValueF", "minValueM", "name", "options", "parentId", "rank", "resultType", "unit", "updatedAt") SELECT "category", "categoryId", "code", "createdAt", "decimals", "id", "isGroup", "maxValue", "maxValueF", "maxValueM", "minValue", "minValueF", "minValueM", "name", "options", "parentId", "rank", "resultType", "unit", "updatedAt" FROM "tests";
DROP TABLE "tests";
ALTER TABLE "new_tests" RENAME TO "tests";
CREATE UNIQUE INDEX "tests_code_key" ON "tests"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
