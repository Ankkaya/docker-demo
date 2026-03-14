-- AlterTable
ALTER TABLE "ProductMallInfo"
ADD COLUMN "isHot" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "hotSort" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "hotLabel" TEXT;

-- CreateTable
CREATE TABLE "ProductMallStat" (
    "productId" INTEGER NOT NULL,
    "saleQty7d" INTEGER NOT NULL DEFAULT 0,
    "saleQty30d" INTEGER NOT NULL DEFAULT 0,
    "orderCount7d" INTEGER NOT NULL DEFAULT 0,
    "orderCount30d" INTEGER NOT NULL DEFAULT 0,
    "hotScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMallStat_pkey" PRIMARY KEY ("productId")
);

-- CreateIndex
CREATE INDEX "ProductMallStat_hotScore_idx" ON "ProductMallStat"("hotScore");

-- AddForeignKey
ALTER TABLE "ProductMallStat" ADD CONSTRAINT "ProductMallStat_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
