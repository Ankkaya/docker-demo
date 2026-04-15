-- AlterTable
ALTER TABLE "User"
ADD COLUMN "wechatOpenId" TEXT,
ADD COLUMN "wechatUnionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_wechatOpenId_key" ON "User"("wechatOpenId");

-- CreateIndex
CREATE UNIQUE INDEX "User_wechatUnionId_key" ON "User"("wechatUnionId");
