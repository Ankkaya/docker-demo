-- CreateTable
CREATE TABLE "ProductMallInfo" (
    "productId" INTEGER NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "detail" TEXT,
    "mainImage" TEXT,
    "images" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMallInfo_pkey" PRIMARY KEY ("productId")
);

-- CreateTable
CREATE TABLE "ProductSkuMallInfo" (
    "skuId" INTEGER NOT NULL,
    "salePrice" DECIMAL(12,2),
    "marketPrice" DECIMAL(12,2),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSkuMallInfo_pkey" PRIMARY KEY ("skuId")
);

-- AddForeignKey
ALTER TABLE "ProductMallInfo" ADD CONSTRAINT "ProductMallInfo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSkuMallInfo" ADD CONSTRAINT "ProductSkuMallInfo_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "ProductSku"("id") ON DELETE CASCADE ON UPDATE CASCADE;
