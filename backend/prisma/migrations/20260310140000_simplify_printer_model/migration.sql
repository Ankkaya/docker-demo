-- Simplify Printer model: keep only name, device, remark fields

-- Drop existing Printer table and related constraints
DROP TABLE IF EXISTS "PrinterConfig" CASCADE;
DROP TABLE IF EXISTS "Printer" CASCADE;

-- Recreate Printer table with simplified schema
CREATE TABLE "Printer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "remark" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Printer_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on device
CREATE UNIQUE INDEX "Printer_device_key" ON "Printer"("device");

-- Create index on deletedAt
CREATE INDEX "Printer_deletedAt_idx" ON "Printer"("deletedAt");

-- Recreate PrinterConfig table
CREATE TABLE "PrinterConfig" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "templateId" INTEGER,
    "printerId" INTEGER,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "orientation" INTEGER NOT NULL DEFAULT 0,
    "gapType" INTEGER NOT NULL DEFAULT 255,
    "printSpeed" INTEGER NOT NULL DEFAULT 255,
    "printDarkness" INTEGER NOT NULL DEFAULT 255,
    "autoPrint" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "remark" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrinterConfig_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PrinterConfig_code_key" UNIQUE ("code")
);

-- Create indexes for PrinterConfig
CREATE INDEX "PrinterConfig_deletedAt_idx" ON "PrinterConfig"("deletedAt");
CREATE INDEX "PrinterConfig_templateId_idx" ON "PrinterConfig"("templateId");
CREATE INDEX "PrinterConfig_printerId_idx" ON "PrinterConfig"("printerId");

-- Add foreign key constraints
ALTER TABLE "PrinterConfig" ADD CONSTRAINT "PrinterConfig_templateId_fkey" 
    FOREIGN KEY ("templateId") REFERENCES "PrintTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PrinterConfig" ADD CONSTRAINT "PrinterConfig_printerId_fkey" 
    FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
