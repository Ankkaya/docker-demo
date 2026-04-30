ALTER TABLE "BalanceAccount"
ADD COLUMN "totalPresented" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "BalanceLog"
ADD COLUMN "bonusAmount" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "BalanceRechargeOrder"
ADD COLUMN "bonusAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "activityId" INTEGER,
ADD COLUMN "activityName" TEXT;

CREATE TABLE "MallRechargeActivity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rechargeAmount" DECIMAL(12,2) NOT NULL,
    "bonusAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tag" TEXT,
    "description" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "firstRechargeOnly" BOOLEAN NOT NULL DEFAULT false,
    "remark" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MallRechargeActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MallRechargeActivity_deletedAt_idx" ON "MallRechargeActivity"("deletedAt");
CREATE INDEX "MallRechargeActivity_isEnabled_sort_idx" ON "MallRechargeActivity"("isEnabled", "sort");
