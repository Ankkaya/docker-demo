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

DO $$
DECLARE
  mall_menu_id INTEGER;
  banner_menu_id INTEGER;
  admin_role_id INTEGER;
BEGIN
  SELECT "id"
  INTO mall_menu_id
  FROM "Menu"
  WHERE "path" = '/mall'
  ORDER BY "id"
  LIMIT 1;

  IF mall_menu_id IS NULL THEN
    mall_menu_id := 40;

    IF EXISTS (SELECT 1 FROM "Menu" WHERE "id" = mall_menu_id) THEN
      SELECT COALESCE(MAX("id"), 0) + 1 INTO mall_menu_id FROM "Menu";
    END IF;

    INSERT INTO "Menu" (
      "id", "name", "path", "icon", "component", "parentId",
      "order", "hidden", "alwaysShow", "type", "createdAt", "updatedAt", "deletedAt"
    )
    VALUES (
      mall_menu_id, '商城管理', '/mall', 'shopping-cart', 'Layout', NULL,
      5, false, false, 'menu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
    );
  ELSE
    UPDATE "Menu"
    SET
      "name" = '商城管理',
      "icon" = 'shopping-cart',
      "component" = 'Layout',
      "parentId" = NULL,
      "order" = 5,
      "hidden" = false,
      "alwaysShow" = false,
      "type" = 'menu',
      "deletedAt" = NULL,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = mall_menu_id;
  END IF;

  SELECT "id"
  INTO banner_menu_id
  FROM "Menu"
  WHERE "path" = '/banners'
  ORDER BY "id"
  LIMIT 1;

  IF banner_menu_id IS NULL THEN
    banner_menu_id := 43;

    IF EXISTS (SELECT 1 FROM "Menu" WHERE "id" = banner_menu_id) THEN
      SELECT COALESCE(MAX("id"), 0) + 1 INTO banner_menu_id FROM "Menu";
    END IF;

    INSERT INTO "Menu" (
      "id", "name", "path", "icon", "component", "parentId",
      "order", "hidden", "alwaysShow", "type", "createdAt", "updatedAt", "deletedAt"
    )
    VALUES (
      banner_menu_id, '轮播图管理', '/banners', 'slideshow', 'banners/index', mall_menu_id,
      6, false, false, 'menu', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL
    );
  ELSE
    UPDATE "Menu"
    SET
      "name" = '轮播图管理',
      "icon" = 'slideshow',
      "component" = 'banners/index',
      "parentId" = mall_menu_id,
      "order" = 6,
      "hidden" = false,
      "alwaysShow" = false,
      "type" = 'menu',
      "deletedAt" = NULL,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = banner_menu_id;
  END IF;

  SELECT "id"
  INTO admin_role_id
  FROM "Role"
  WHERE "code" = 'admin'
  LIMIT 1;

  IF admin_role_id IS NOT NULL THEN
    INSERT INTO "_RoleMenus" ("A", "B")
    VALUES (banner_menu_id, admin_role_id)
    ON CONFLICT ("A", "B") DO NOTHING;
  END IF;
END $$;
