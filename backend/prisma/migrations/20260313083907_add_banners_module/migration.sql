-- CreateTable
CREATE TABLE "Banner" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "jumpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "jumpPath" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "remark" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_deletedAt_idx" ON "Banner"("deletedAt");

-- CreateIndex
CREATE INDEX "Banner_isEnabled_sort_idx" ON "Banner"("isEnabled", "sort");

-- Insert admin menu for banners
INSERT INTO "Menu" ("id", "name", "path", "icon", "component", "parentId", "order", "hidden", "alwaysShow", "type", "createdAt", "updatedAt", "deletedAt")
VALUES (43, '轮播图管理', '/banners', 'slideshow', 'banners/index', 40, 6, false, false, 'menu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "path" = EXCLUDED."path",
  "icon" = EXCLUDED."icon",
  "component" = EXCLUDED."component",
  "parentId" = EXCLUDED."parentId",
  "order" = EXCLUDED."order",
  "hidden" = EXCLUDED."hidden",
  "alwaysShow" = EXCLUDED."alwaysShow",
  "type" = EXCLUDED."type",
  "deletedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "_RoleMenus" ("A", "B")
SELECT 43, "id" FROM "Role" WHERE "code" = 'admin'
ON CONFLICT ("A", "B") DO NOTHING;
