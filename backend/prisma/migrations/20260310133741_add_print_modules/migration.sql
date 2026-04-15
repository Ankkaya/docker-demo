-- CreateTable
CREATE TABLE "PrintTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "bizType" TEXT NOT NULL,
    "paperWidth" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "paperHeight" DOUBLE PRECISION NOT NULL DEFAULT 150,
    "content" JSONB,
    "description" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Printer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "connectionType" TEXT NOT NULL DEFAULT 'LOCAL',
    "ip" TEXT,
    "port" INTEGER,
    "dpi" INTEGER NOT NULL DEFAULT 203,
    "width" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "remark" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Printer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "PrinterConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrintTemplate_code_key" ON "PrintTemplate"("code");

-- CreateIndex
CREATE INDEX "PrintTemplate_deletedAt_idx" ON "PrintTemplate"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Printer_code_key" ON "Printer"("code");

-- CreateIndex
CREATE INDEX "Printer_deletedAt_idx" ON "Printer"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PrinterConfig_code_key" ON "PrinterConfig"("code");

-- CreateIndex
CREATE INDEX "PrinterConfig_deletedAt_idx" ON "PrinterConfig"("deletedAt");

-- CreateIndex
CREATE INDEX "PrinterConfig_templateId_idx" ON "PrinterConfig"("templateId");

-- CreateIndex
CREATE INDEX "PrinterConfig_printerId_idx" ON "PrinterConfig"("printerId");

-- AddForeignKey
ALTER TABLE "PrinterConfig" ADD CONSTRAINT "PrinterConfig_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PrintTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrinterConfig" ADD CONSTRAINT "PrinterConfig_printerId_fkey" FOREIGN KEY ("printerId") REFERENCES "Printer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
