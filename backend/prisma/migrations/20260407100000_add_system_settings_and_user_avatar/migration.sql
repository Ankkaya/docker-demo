-- Add avatar field to user
ALTER TABLE "User"
ADD COLUMN "avatarUrl" TEXT;

-- Create system settings table
CREATE TABLE "SystemSetting" (
  "id" SERIAL NOT NULL,
  "key" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");
CREATE INDEX "SystemSetting_category_idx" ON "SystemSetting"("category");
