-- 充值系统重构：充值套餐与充值活动拆分

ALTER TABLE "BalanceRechargeOrder"
ADD COLUMN "packageId" INTEGER,
ADD COLUMN "packageName" TEXT;

ALTER TABLE "MallRechargeActivity"
DROP COLUMN "rechargeAmount";

CREATE TABLE "MallRechargePackage" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "rechargeAmount" DECIMAL(12,2) NOT NULL,
  "tag" TEXT,
  "description" TEXT,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "remark" TEXT,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MallRechargePackage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MallRechargePackageActivity" (
  "id" SERIAL NOT NULL,
  "packageId" INTEGER NOT NULL,
  "activityId" INTEGER NOT NULL,
  "sort" INTEGER NOT NULL DEFAULT 0,
  "isEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MallRechargePackageActivity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MallRechargePackageActivity_packageId_activityId_key"
ON "MallRechargePackageActivity"("packageId", "activityId");

CREATE INDEX "MallRechargePackage_deletedAt_idx" ON "MallRechargePackage"("deletedAt");
CREATE INDEX "MallRechargePackage_isEnabled_sort_idx" ON "MallRechargePackage"("isEnabled", "sort");
CREATE INDEX "MallRechargePackageActivity_packageId_isEnabled_sort_idx" ON "MallRechargePackageActivity"("packageId", "isEnabled", "sort");
CREATE INDEX "MallRechargePackageActivity_activityId_idx" ON "MallRechargePackageActivity"("activityId");

ALTER TABLE "MallRechargePackageActivity"
ADD CONSTRAINT "MallRechargePackageActivity_packageId_fkey"
FOREIGN KEY ("packageId") REFERENCES "MallRechargePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MallRechargePackageActivity"
ADD CONSTRAINT "MallRechargePackageActivity_activityId_fkey"
FOREIGN KEY ("activityId") REFERENCES "MallRechargeActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
