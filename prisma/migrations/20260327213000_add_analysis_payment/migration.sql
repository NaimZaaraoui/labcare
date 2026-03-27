ALTER TABLE "analyses" ADD COLUMN "amountPaid" REAL NOT NULL DEFAULT 0;
ALTER TABLE "analyses" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "analyses" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "analyses" ADD COLUMN "paidAt" DATETIME;

UPDATE "analyses"
SET
  "amountPaid" = COALESCE("amountPaid", 0),
  "paymentStatus" = CASE
    WHEN COALESCE("amountPaid", 0) <= 0 THEN 'UNPAID'
    WHEN COALESCE("amountPaid", 0) >= COALESCE("totalPrice", 0) THEN 'PAID'
    ELSE 'PARTIAL'
  END,
  "paidAt" = CASE
    WHEN COALESCE("amountPaid", 0) >= COALESCE("totalPrice", 0) AND COALESCE("totalPrice", 0) > 0 THEN COALESCE("paidAt", CURRENT_TIMESTAMP)
    ELSE NULL
  END;
