-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'BALANCE';

-- CreateEnum
CREATE TYPE "BalanceAccountStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "BalanceLogType" AS ENUM ('RECHARGE', 'CONSUME', 'REFUND', 'ADJUST_INCREASE', 'ADJUST_DECREASE');

-- CreateTable
CREATE TABLE "BalanceAccount" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "availableBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "frozenBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalRecharged" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalConsumed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalRefunded" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAdjusted" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "BalanceAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BalanceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BalanceLog" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "type" "BalanceLogType" NOT NULL,
    "changeAmount" DECIMAL(12,2) NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "bizType" TEXT,
    "bizId" INTEGER,
    "bizNo" TEXT,
    "remark" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BalanceAccount_customerId_key" ON "BalanceAccount"("customerId");

-- CreateIndex
CREATE INDEX "BalanceAccount_status_idx" ON "BalanceAccount"("status");

-- CreateIndex
CREATE INDEX "BalanceLog_accountId_createdAt_idx" ON "BalanceLog"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "BalanceLog_customerId_createdAt_idx" ON "BalanceLog"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "BalanceLog_type_createdAt_idx" ON "BalanceLog"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "BalanceAccount" ADD CONSTRAINT "BalanceAccount_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceLog" ADD CONSTRAINT "BalanceLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "BalanceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BalanceLog" ADD CONSTRAINT "BalanceLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
