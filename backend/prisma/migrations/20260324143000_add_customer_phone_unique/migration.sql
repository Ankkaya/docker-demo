-- Add unique constraint for customer phone login
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");
