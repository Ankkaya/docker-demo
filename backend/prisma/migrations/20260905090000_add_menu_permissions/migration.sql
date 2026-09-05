-- Add stable permission codes for button-level authorization.
ALTER TABLE "Menu" ADD COLUMN "permission" TEXT;

CREATE INDEX "Menu_permission_idx" ON "Menu"("permission");
