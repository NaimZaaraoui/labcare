-- Add severity level to audit logs
ALTER TABLE "audit_logs" ADD COLUMN "severity" TEXT NOT NULL DEFAULT 'INFO';

-- Index for filtering by severity
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");
