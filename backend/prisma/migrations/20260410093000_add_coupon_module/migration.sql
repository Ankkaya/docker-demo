CREATE TYPE "CouponType" AS ENUM ('CASH');

CREATE TYPE "CouponReceiveStatus" AS ENUM ('UNUSED', 'USED', 'EXPIRED', 'INVALID');

CREATE TABLE "Coupon" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL DEFAULT 'CASH',
    "thresholdAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(12,2) NOT NULL,
    "totalCount" INTEGER,
    "perLimit" INTEGER NOT NULL DEFAULT 1,
    "receivedCount" INTEGER NOT NULL DEFAULT 0,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CouponReceive" (
    "id" SERIAL NOT NULL,
    "couponId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "status" "CouponReceiveStatus" NOT NULL DEFAULT 'UNUSED',
    "source" TEXT DEFAULT 'ADMIN',
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "remark" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouponReceive_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_deletedAt_idx" ON "Coupon"("deletedAt");
CREATE INDEX "Coupon_isEnabled_sort_idx" ON "Coupon"("isEnabled", "sort");
CREATE INDEX "Coupon_startTime_endTime_idx" ON "Coupon"("startTime", "endTime");

CREATE INDEX "CouponReceive_couponId_idx" ON "CouponReceive"("couponId");
CREATE INDEX "CouponReceive_customerId_idx" ON "CouponReceive"("customerId");
CREATE INDEX "CouponReceive_status_idx" ON "CouponReceive"("status");
CREATE INDEX "CouponReceive_validTo_idx" ON "CouponReceive"("validTo");
CREATE INDEX "CouponReceive_deletedAt_idx" ON "CouponReceive"("deletedAt");

ALTER TABLE "CouponReceive"
ADD CONSTRAINT "CouponReceive_couponId_fkey"
FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CouponReceive"
ADD CONSTRAINT "CouponReceive_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
