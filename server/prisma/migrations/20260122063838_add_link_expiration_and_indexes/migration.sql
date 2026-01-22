-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Link" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "shortCode" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasIntermediatePage" BOOLEAN NOT NULL DEFAULT false,
    "intermediatePageDelay" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "maxClicks" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT,
    CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Link" ("clicks", "createdAt", "hasIntermediatePage", "id", "intermediatePageDelay", "isActive", "originalUrl", "shortCode", "userId") SELECT "clicks", "createdAt", "hasIntermediatePage", "id", "intermediatePageDelay", "isActive", "originalUrl", "shortCode", "userId" FROM "Link";
DROP TABLE "Link";
ALTER TABLE "new_Link" RENAME TO "Link";
CREATE UNIQUE INDEX "Link_shortCode_key" ON "Link"("shortCode");
CREATE INDEX "Link_userId_idx" ON "Link"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LinkLog_linkId_idx" ON "LinkLog"("linkId");
