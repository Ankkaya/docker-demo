-- CreateEnum
CREATE TYPE "InventoryType" AS ENUM ('IN_PURCHASE', 'IN_SALE_RETURN', 'IN_TRANSFER', 'IN_ADJUST', 'OUT_SALE', 'OUT_PURCHASE_RETURN', 'OUT_TRANSFER', 'OUT_ADJUST');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'OUT', 'IN', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "InventoryLog" (
    "id" SERIAL NOT NULL,
    "type" "InventoryType" NOT NULL,
    "skuId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "before" INTEGER NOT NULL,
    "after" INTEGER NOT NULL,
    "bizType" TEXT,
    "bizId" INTEGER,
    "bizNo" TEXT,
    "remark" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" SERIAL NOT NULL,
    "transferNo" TEXT NOT NULL,
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferItem" (
    "id" SERIAL NOT NULL,
    "transferId" INTEGER NOT NULL,
    "skuId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adjustment" (
    "id" SERIAL NOT NULL,
    "adjustNo" TEXT NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "remark" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdjustmentItem" (
    "id" SERIAL NOT NULL,
    "adjustmentId" INTEGER NOT NULL,
    "skuId" INTEGER NOT NULL,
    "bookQty" INTEGER NOT NULL,
    "actualQty" INTEGER NOT NULL,
    "diffQty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdjustmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryLog_skuId_idx" ON "InventoryLog"("skuId");

-- CreateIndex
CREATE INDEX "InventoryLog_warehouseId_idx" ON "InventoryLog"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryLog_createdAt_idx" ON "InventoryLog"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryLog_bizType_bizId_idx" ON "InventoryLog"("bizType", "bizId");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_transferNo_key" ON "Transfer"("transferNo");

-- CreateIndex
CREATE INDEX "Transfer_deletedAt_idx" ON "Transfer"("deletedAt");

-- CreateIndex
CREATE INDEX "Transfer_status_idx" ON "Transfer"("status");

-- CreateIndex
CREATE INDEX "Transfer_fromId_idx" ON "Transfer"("fromId");

-- CreateIndex
CREATE INDEX "Transfer_toId_idx" ON "Transfer"("toId");

-- CreateIndex
CREATE INDEX "TransferItem_transferId_idx" ON "TransferItem"("transferId");

-- CreateIndex
CREATE INDEX "TransferItem_skuId_idx" ON "TransferItem"("skuId");

-- CreateIndex
CREATE UNIQUE INDEX "Adjustment_adjustNo_key" ON "Adjustment"("adjustNo");

-- CreateIndex
CREATE INDEX "Adjustment_deletedAt_idx" ON "Adjustment"("deletedAt");

-- CreateIndex
CREATE INDEX "Adjustment_status_idx" ON "Adjustment"("status");

-- CreateIndex
CREATE INDEX "Adjustment_warehouseId_idx" ON "Adjustment"("warehouseId");

-- CreateIndex
CREATE INDEX "AdjustmentItem_adjustmentId_idx" ON "AdjustmentItem"("adjustmentId");

-- CreateIndex
CREATE INDEX "AdjustmentItem_skuId_idx" ON "AdjustmentItem"("skuId");

-- AddForeignKey
ALTER TABLE "InventoryLog" ADD CONSTRAINT "InventoryLog_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "ProductSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferItem" ADD CONSTRAINT "TransferItem_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferItem" ADD CONSTRAINT "TransferItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "ProductSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjustmentItem" ADD CONSTRAINT "AdjustmentItem_adjustmentId_fkey" FOREIGN KEY ("adjustmentId") REFERENCES "Adjustment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjustmentItem" ADD CONSTRAINT "AdjustmentItem_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "ProductSku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
