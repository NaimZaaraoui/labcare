-- Archive table for long-term retention
CREATE TABLE "audit_logs_archive" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "userName" TEXT,
  "userEmail" TEXT,
  "userRole" TEXT,
  "action" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "details" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" DATETIME NOT NULL,
  "archivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "audit_logs_archive_createdAt_idx" ON "audit_logs_archive"("createdAt");
CREATE INDEX "audit_logs_archive_archivedAt_idx" ON "audit_logs_archive"("archivedAt");
CREATE INDEX "audit_logs_archive_severity_idx" ON "audit_logs_archive"("severity");
