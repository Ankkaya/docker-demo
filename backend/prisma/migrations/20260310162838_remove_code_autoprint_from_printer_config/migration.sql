/*
  Warnings:

  - You are about to drop the column `autoPrint` on the `PrinterConfig` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `PrinterConfig` table. All the data in the column will be lost.

*/
-- DropIndex
ALTER TABLE "PrinterConfig" DROP CONSTRAINT IF EXISTS "PrinterConfig_code_key";

-- AlterTable
ALTER TABLE "PrinterConfig" DROP COLUMN IF EXISTS "autoPrint",
DROP COLUMN IF EXISTS "code";
