ALTER TABLE "Payment"
ADD COLUMN "outTradeNo" TEXT,
ADD COLUMN "thirdTradeNo" TEXT,
ADD COLUMN "tradeType" TEXT,
ADD COLUMN "prepayId" TEXT,
ADD COLUMN "thirdStatus" TEXT,
ADD COLUMN "queryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastQueryAt" TIMESTAMP(3),
ADD COLUMN "notifyAt" TIMESTAMP(3),
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "failReason" TEXT,
ADD COLUMN "notifyPayload" JSONB;

CREATE UNIQUE INDEX "Payment_outTradeNo_key" ON "Payment"("outTradeNo");
CREATE INDEX "Payment_outTradeNo_idx" ON "Payment"("outTradeNo");
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");
