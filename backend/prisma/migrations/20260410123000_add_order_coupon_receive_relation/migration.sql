ALTER TABLE "Order"
ADD COLUMN "couponReceiveId" INTEGER;

CREATE UNIQUE INDEX "Order_couponReceiveId_key" ON "Order"("couponReceiveId");
CREATE INDEX "Order_couponReceiveId_idx" ON "Order"("couponReceiveId");

ALTER TABLE "Order"
ADD CONSTRAINT "Order_couponReceiveId_fkey"
FOREIGN KEY ("couponReceiveId") REFERENCES "CouponReceive"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
