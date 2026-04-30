-- CreateEnum
CREATE TYPE "PaymentRefundStatus" AS ENUM ('PROCESSING', 'SUCCESS', 'CLOSED', 'ABNORMAL');

-- CreateTable
CREATE TABLE "PaymentRefund" (
    "id" SERIAL NOT NULL,
    "refundNo" TEXT NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT,
    "status" "PaymentRefundStatus" NOT NULL DEFAULT 'PROCESSING',
    "thirdRefundNo" TEXT,
    "thirdStatus" TEXT,
    "successAt" TIMESTAMP(3),
    "failReason" TEXT,
    "notifyAt" TIMESTAMP(3),
    "notifyPayload" JSONB,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRefund_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRefund_refundNo_key" ON "PaymentRefund"("refundNo");

-- CreateIndex
CREATE INDEX "PaymentRefund_paymentId_idx" ON "PaymentRefund"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentRefund_orderId_idx" ON "PaymentRefund"("orderId");

-- CreateIndex
CREATE INDEX "PaymentRefund_status_idx" ON "PaymentRefund"("status");

-- CreateIndex
CREATE INDEX "PaymentRefund_createdAt_idx" ON "PaymentRefund"("createdAt");

-- AddForeignKey
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRefund" ADD CONSTRAINT "PaymentRefund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
