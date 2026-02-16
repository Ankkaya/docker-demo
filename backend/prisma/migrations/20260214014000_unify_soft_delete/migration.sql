-- Add deletedAt column to Product
ALTER TABLE "Product" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");

-- Add deletedAt column to ProductSku
ALTER TABLE "ProductSku" ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "ProductSku_deletedAt_idx" ON "ProductSku"("deletedAt");

-- Migrate existing soft-deleted products (DISABLED status) to deletedAt
UPDATE "Product" SET "deletedAt" = "updatedAt" WHERE "status" = 'DISABLED';

-- Migrate existing soft-deleted SKUs (DELETED status) to deletedAt
UPDATE "ProductSku" SET "deletedAt" = "updatedAt" WHERE "status" = 'DELETED';

-- Note: Removing enum values from PostgreSQL enums is complex and requires recreating the enum.
-- For this migration, we'll keep the enum values but they won't be used in the application.
-- To properly clean up the enums, you would need to:
-- 1. Create a new enum without the unused values
-- 2. Alter columns to use the new enum
-- 3. Drop the old enum
