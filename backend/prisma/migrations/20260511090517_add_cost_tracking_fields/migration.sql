-- AlterTable
ALTER TABLE "InventoryLog" ADD COLUMN     "costAmount" DECIMAL(14,4),
ADD COLUMN     "unitCost" DECIMAL(12,4);

-- AlterTable
ALTER TABLE "ShipmentItem" ADD COLUMN     "costSnapshot" DECIMAL(12,4);
