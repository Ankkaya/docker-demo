-- AlterTable
ALTER TABLE "Category"
ADD COLUMN "mallRecommend" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mallRecommendSort" INTEGER NOT NULL DEFAULT 0;
