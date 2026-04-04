CREATE TABLE "instruments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "targetMin" REAL NOT NULL,
    "targetMax" REAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '°C',
    "location" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "temperature_readings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instrumentId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "period" TEXT NOT NULL,
    "recordedDate" DATETIME NOT NULL,
    "measuredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOutOfRange" BOOLEAN NOT NULL DEFAULT false,
    "correctiveAction" TEXT,
    "recordedBy" TEXT NOT NULL,
    "recordedById" TEXT,
    CONSTRAINT "temperature_readings_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "instruments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "temperature_readings_instrumentId_recordedDate_period_key" ON "temperature_readings"("instrumentId", "recordedDate", "period");
CREATE INDEX "instruments_name_idx" ON "instruments"("name");
CREATE INDEX "instruments_type_idx" ON "instruments"("type");
CREATE INDEX "instruments_isActive_idx" ON "instruments"("isActive");
CREATE INDEX "temperature_readings_instrumentId_recordedDate_idx" ON "temperature_readings"("instrumentId", "recordedDate");
CREATE INDEX "temperature_readings_recordedAt_idx" ON "temperature_readings"("recordedAt");
CREATE INDEX "temperature_readings_isOutOfRange_idx" ON "temperature_readings"("isOutOfRange");
