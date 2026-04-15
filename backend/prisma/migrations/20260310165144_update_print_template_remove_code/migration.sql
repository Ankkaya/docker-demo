/*
  Warnings:

  - You are about to drop the column `code` on the `PrintTemplate` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "PrintTemplate_code_key";

-- AlterTable
ALTER TABLE "PrintTemplate" DROP COLUMN "code",
ALTER COLUMN "paperWidth" SET DEFAULT 50,
ALTER COLUMN "paperHeight" SET DEFAULT 300;
