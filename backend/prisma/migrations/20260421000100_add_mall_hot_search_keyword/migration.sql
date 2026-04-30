-- CreateTable
CREATE TABLE "MallHotSearchKeyword" (
    "id" SERIAL NOT NULL,
    "keyword" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MallHotSearchKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MallHotSearchKeyword_keyword_key" ON "MallHotSearchKeyword"("keyword");

-- CreateIndex
CREATE INDEX "MallHotSearchKeyword_deletedAt_idx" ON "MallHotSearchKeyword"("deletedAt");

-- CreateIndex
CREATE INDEX "MallHotSearchKeyword_isEnabled_sort_idx" ON "MallHotSearchKeyword"("isEnabled", "sort");
