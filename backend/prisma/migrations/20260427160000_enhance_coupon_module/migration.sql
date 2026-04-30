-- CreateEnum
CREATE TYPE "CouponSceneType" AS ENUM ('COMMON', 'NEW_USER', 'FIRST_ORDER', 'RECHARGE_GIFT', 'ORDER_GIFT', 'MANUAL');

-- CreateEnum
CREATE TYPE "CouponIssueType" AS ENUM ('USER_CLAIM', 'ADMIN_ASSIGN', 'AUTO_GRANT', 'EXCHANGE_CODE');

-- CreateEnum
CREATE TYPE "CouponValidType" AS ENUM ('FIXED', 'RELATIVE');

-- CreateEnum
CREATE TYPE "CouponIssueScopeType" AS ENUM ('ALL', 'CUSTOMERS', 'NEW_USERS', 'FIRST_ORDER_USERS', 'RECHARGED_USERS');

-- CreateEnum
CREATE TYPE "CouponUseScopeType" AS ENUM ('ALL', 'CATEGORY', 'BRAND', 'PRODUCT', 'SKU');

-- CreateEnum
CREATE TYPE "CouponRefundReturnMode" AS ENUM ('RETURN_ORIGINAL', 'GRANT_NEW', 'NOT_RETURN');

-- AlterEnum
ALTER TYPE "CouponType" ADD VALUE IF NOT EXISTS 'DISCOUNT';
ALTER TYPE "CouponType" ADD VALUE IF NOT EXISTS 'FREE_SHIPPING';

-- AlterTable
ALTER TABLE "Coupon"
ADD COLUMN "sceneType" "CouponSceneType" NOT NULL DEFAULT 'COMMON',
ADD COLUMN "issueType" "CouponIssueType" NOT NULL DEFAULT 'USER_CLAIM',
ADD COLUMN "discountRate" INTEGER,
ADD COLUMN "maxDiscountAmount" DECIMAL(12,2),
ADD COLUMN "dailyLimit" INTEGER,
ADD COLUMN "expiredCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "claimStartTime" TIMESTAMP(3),
ADD COLUMN "claimEndTime" TIMESTAMP(3),
ADD COLUMN "validType" "CouponValidType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN "validDays" INTEGER,
ADD COLUMN "validDelayDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "issueScopeType" "CouponIssueScopeType" NOT NULL DEFAULT 'ALL',
ADD COLUMN "issueRuleJson" JSONB,
ADD COLUMN "useScopeType" "CouponUseScopeType" NOT NULL DEFAULT 'ALL',
ADD COLUMN "useRuleJson" JSONB,
ADD COLUMN "channelScope" TEXT[] NOT NULL DEFAULT ARRAY['MINI_PROGRAM']::TEXT[],
ADD COLUMN "stackable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "canUseWithPromotion" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "canUseWithMemberPrice" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "canUseWithPoint" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "canUseWithBalance" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "refundReturnMode" "CouponRefundReturnMode" NOT NULL DEFAULT 'RETURN_ORIGINAL';

-- CreateIndex
CREATE INDEX "Coupon_claimStartTime_claimEndTime_idx" ON "Coupon"("claimStartTime", "claimEndTime");

-- CreateIndex
CREATE INDEX "Coupon_issueType_isPublic_isEnabled_idx" ON "Coupon"("issueType", "isPublic", "isEnabled");
