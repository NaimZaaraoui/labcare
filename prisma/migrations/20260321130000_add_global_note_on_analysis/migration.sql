-- Add global report note fields on analyses
ALTER TABLE "analyses" ADD COLUMN "globalNote" TEXT;
ALTER TABLE "analyses" ADD COLUMN "globalNotePlacement" TEXT NOT NULL DEFAULT 'all';
