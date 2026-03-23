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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "analyses_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_analyses" ("createdAt", "creationDate", "dailyId", "drawingDate", "histogramData", "id", "medecinPrescripteur", "orderNumber", "patientAge", "patientFirstName", "patientGender", "patientId", "patientLastName", "printedAt", "provenance", "receiptNumber", "status", "updatedAt") SELECT "createdAt", "creationDate", "dailyId", "drawingDate", "histogramData", "id", "medecinPrescripteur", "orderNumber", "patientAge", "patientFirstName", "patientGender", "patientId", "patientLastName", "printedAt", "provenance", "receiptNumber", "status", "updatedAt" FROM "analyses";
DROP TABLE "analyses";
ALTER TABLE "new_analyses" RENAME TO "analyses";
CREATE UNIQUE INDEX "analyses_orderNumber_key" ON "analyses"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
