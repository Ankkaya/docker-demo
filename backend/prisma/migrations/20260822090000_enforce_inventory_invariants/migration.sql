-- Fail explicitly if legacy data violates the inventory three-column invariant.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Inventory"
    WHERE "quantity" < 0
       OR "locked" < 0
       OR "available" < 0
       OR "available" <> "quantity" - "locked"
       OR "minStock" < 0
       OR "maxStock" < "minStock"
  ) THEN
    RAISE EXCEPTION 'Inventory contains invalid legacy rows; repair them before applying this migration';
  END IF;
END $$;

ALTER TABLE "Inventory"
  ADD CONSTRAINT "Inventory_quantity_nonnegative" CHECK ("quantity" >= 0),
  ADD CONSTRAINT "Inventory_locked_nonnegative" CHECK ("locked" >= 0),
  ADD CONSTRAINT "Inventory_available_nonnegative" CHECK ("available" >= 0),
  ADD CONSTRAINT "Inventory_available_consistent" CHECK ("available" = "quantity" - "locked"),
  ADD CONSTRAINT "Inventory_min_stock_nonnegative" CHECK ("minStock" >= 0),
  ADD CONSTRAINT "Inventory_max_stock_valid" CHECK ("maxStock" >= "minStock");
