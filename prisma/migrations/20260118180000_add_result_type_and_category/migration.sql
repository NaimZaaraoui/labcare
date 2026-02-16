-- AlterTable
ALTER TABLE "tests" ADD COLUMN "resultType" TEXT NOT NULL DEFAULT 'numeric';
ALTER TABLE "tests" ADD COLUMN "category" TEXT;
