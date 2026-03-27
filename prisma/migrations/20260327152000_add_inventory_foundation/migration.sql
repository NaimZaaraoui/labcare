-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "reference" TEXT,
    "category" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'REAGENT',
    "unit" TEXT NOT NULL,
    "currentStock" REAL NOT NULL DEFAULT 0,
    "minThreshold" REAL NOT NULL,
    "storage" TEXT,
    "supplier" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "inventory_lots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "lotNumber" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "quantity" REAL NOT NULL,
    "remaining" REAL NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "inventory_lots_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "lotNumber" TEXT,
    "reason" TEXT,
    "performedBy" TEXT NOT NULL,
    "performedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_movements_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "item_test_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "quantityPerTest" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "item_test_rules_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "item_test_rules_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analysis_consumptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "analysis_consumptions_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "analyses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analysis_consumptions_testId_fkey" FOREIGN KEY ("testId") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "analysis_consumptions_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "inventory_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "inventory_items_name_idx" ON "inventory_items"("name");
CREATE INDEX "inventory_items_category_idx" ON "inventory_items"("category");
CREATE INDEX "inventory_items_kind_idx" ON "inventory_items"("kind");
CREATE INDEX "inventory_items_isActive_idx" ON "inventory_items"("isActive");

CREATE INDEX "inventory_lots_itemId_expiryDate_idx" ON "inventory_lots"("itemId", "expiryDate");
CREATE INDEX "inventory_lots_itemId_isActive_idx" ON "inventory_lots"("itemId", "isActive");

CREATE INDEX "stock_movements_itemId_performedAt_idx" ON "stock_movements"("itemId", "performedAt");
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");

CREATE UNIQUE INDEX "item_test_rules_itemId_testId_key" ON "item_test_rules"("itemId", "testId");
CREATE INDEX "item_test_rules_testId_isActive_idx" ON "item_test_rules"("testId", "isActive");
CREATE INDEX "item_test_rules_itemId_isActive_idx" ON "item_test_rules"("itemId", "isActive");

CREATE UNIQUE INDEX "analysis_consumptions_analysisId_testId_itemId_key" ON "analysis_consumptions"("analysisId", "testId", "itemId");
CREATE INDEX "analysis_consumptions_analysisId_idx" ON "analysis_consumptions"("analysisId");
CREATE INDEX "analysis_consumptions_itemId_idx" ON "analysis_consumptions"("itemId");
