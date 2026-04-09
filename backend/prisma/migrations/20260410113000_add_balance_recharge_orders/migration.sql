CREATE TABLE "BalanceRechargeOrder" (
  "id" SERIAL NOT NULL,
  "rechargeNo" TEXT NOT NULL,
  "accountId" INTEGER NOT NULL,
  "customerId" INTEGER NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "outTradeNo" TEXT,
  "thirdTradeNo" TEXT,
  "prepayId" TEXT,
  "thirdStatus" TEXT,
  "queryCount" INTEGER NOT NULL DEFAULT 0,
  "lastQueryAt" TIMESTAMP(3),
  "notifyAt" TIMESTAMP(3),
  "paidAt" TIMESTAMP(3),
  "failReason" TEXT,
  "notifyPayload" JSONB,
  "remark" TEXT,
  "createdBy" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "BalanceRechargeOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BalanceRechargeOrder_rechargeNo_key" ON "BalanceRechargeOrder"("rechargeNo");
CREATE UNIQUE INDEX "BalanceRechargeOrder_outTradeNo_key" ON "BalanceRechargeOrder"("outTradeNo");
CREATE INDEX "BalanceRechargeOrder_accountId_createdAt_idx" ON "BalanceRechargeOrder"("accountId", "createdAt");
CREATE INDEX "BalanceRechargeOrder_customerId_createdAt_idx" ON "BalanceRechargeOrder"("customerId", "createdAt");
CREATE INDEX "BalanceRechargeOrder_status_createdAt_idx" ON "BalanceRechargeOrder"("status", "createdAt");
CREATE INDEX "BalanceRechargeOrder_outTradeNo_idx" ON "BalanceRechargeOrder"("outTradeNo");
CREATE INDEX "BalanceRechargeOrder_paidAt_idx" ON "BalanceRechargeOrder"("paidAt");
CREATE INDEX "BalanceRechargeOrder_deletedAt_idx" ON "BalanceRechargeOrder"("deletedAt");

ALTER TABLE "BalanceRechargeOrder"
  ADD CONSTRAINT "BalanceRechargeOrder_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "BalanceAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BalanceRechargeOrder"
  ADD CONSTRAINT "BalanceRechargeOrder_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
