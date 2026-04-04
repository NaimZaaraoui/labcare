ALTER TABLE "temperature_readings" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "temperature_readings" ADD COLUMN "isInvalid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "temperature_readings" ADD COLUMN "invalidReason" TEXT;
ALTER TABLE "temperature_readings" ADD COLUMN "invalidatedAt" DATETIME;
ALTER TABLE "temperature_readings" ADD COLUMN "invalidatedBy" TEXT;
ALTER TABLE "temperature_readings" ADD COLUMN "invalidatedById" TEXT;

CREATE INDEX "temperature_readings_isInvalid_idx" ON "temperature_readings"("isInvalid");
