ALTER TABLE "ShipmentItem"
ADD COLUMN "warehouseId" INTEGER;

UPDATE "ShipmentItem" AS si
SET "warehouseId" = s."warehouseId"
FROM "Shipment" AS s
WHERE si."shipmentId" = s."id";

ALTER TABLE "ShipmentItem"
ALTER COLUMN "warehouseId" SET NOT NULL;

ALTER TABLE "ShipmentItem"
ADD CONSTRAINT "ShipmentItem_warehouseId_fkey"
FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "ShipmentItem_warehouseId_idx" ON "ShipmentItem"("warehouseId");
