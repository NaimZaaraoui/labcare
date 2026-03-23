-- AlterTable
ALTER TABLE "analyses" ADD COLUMN "validatedBioAt" DATETIME;
ALTER TABLE "analyses" ADD COLUMN "validatedBioBy" TEXT;
ALTER TABLE "analyses" ADD COLUMN "validatedBioName" TEXT;
ALTER TABLE "analyses" ADD COLUMN "validatedTechAt" DATETIME;
ALTER TABLE "analyses" ADD COLUMN "validatedTechBy" TEXT;
ALTER TABLE "analyses" ADD COLUMN "validatedTechName" TEXT;
