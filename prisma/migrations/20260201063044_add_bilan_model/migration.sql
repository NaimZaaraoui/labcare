-- CreateTable
CREATE TABLE "bilans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_BilanToTest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BilanToTest_A_fkey" FOREIGN KEY ("A") REFERENCES "bilans" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BilanToTest_B_fkey" FOREIGN KEY ("B") REFERENCES "tests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_BilanToTest_AB_unique" ON "_BilanToTest"("A", "B");

-- CreateIndex
CREATE INDEX "_BilanToTest_B_index" ON "_BilanToTest"("B");
