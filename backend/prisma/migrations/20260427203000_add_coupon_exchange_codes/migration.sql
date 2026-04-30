CREATE TYPE "CouponExchangeCodeStatus" AS ENUM ('UNUSED', 'USED', 'EXPIRED', 'DISABLED');

CREATE TABLE "CouponExchangeCode" (
    "id" SERIAL NOT NULL,
    "couponId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "status" "CouponExchangeCodeStatus" NOT NULL DEFAULT 'UNUSED',
    "customerId" INTEGER,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "remark" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouponExchangeCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CouponExchangeCode_code_key" ON "CouponExchangeCode"("code");
CREATE INDEX "CouponExchangeCode_couponId_status_idx" ON "CouponExchangeCode"("couponId", "status");
CREATE INDEX "CouponExchangeCode_customerId_idx" ON "CouponExchangeCode"("customerId");
CREATE INDEX "CouponExchangeCode_expiresAt_idx" ON "CouponExchangeCode"("expiresAt");
CREATE INDEX "CouponExchangeCode_deletedAt_idx" ON "CouponExchangeCode"("deletedAt");

ALTER TABLE "CouponExchangeCode" ADD CONSTRAINT "CouponExchangeCode_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CouponExchangeCode" ADD CONSTRAINT "CouponExchangeCode_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
