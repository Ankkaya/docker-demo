-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'CANCEL', 'OTHER');

-- CreateEnum
CREATE TYPE "LoginLogType" AS ENUM ('LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'TOKEN_EXPIRED', 'TOKEN_REFRESH');

-- AlterTable
ALTER TABLE "Coupon" ALTER COLUMN "channelScope" DROP DEFAULT;

-- CreateTable
CREATE TABLE "OperationLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "username" TEXT,
    "module" TEXT NOT NULL,
    "action" "LogAction" NOT NULL,
    "targetId" TEXT,
    "targetType" TEXT,
    "description" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "username" TEXT,
    "type" "LoginLogType" NOT NULL,
    "ip" TEXT NOT NULL,
    "location" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "failReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "originalName" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "module" TEXT NOT NULL,
    "refId" TEXT,
    "refType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperationLog_userId_createdAt_idx" ON "OperationLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OperationLog_module_action_createdAt_idx" ON "OperationLog"("module", "action", "createdAt");

-- CreateIndex
CREATE INDEX "OperationLog_targetId_targetType_idx" ON "OperationLog"("targetId", "targetType");

-- CreateIndex
CREATE INDEX "OperationLog_createdAt_idx" ON "OperationLog"("createdAt");

-- CreateIndex
CREATE INDEX "LoginLog_userId_createdAt_idx" ON "LoginLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LoginLog_ip_idx" ON "LoginLog"("ip");

-- CreateIndex
CREATE INDEX "LoginLog_type_createdAt_idx" ON "LoginLog"("type", "createdAt");

-- CreateIndex
CREATE INDEX "UploadRecord_userId_idx" ON "UploadRecord"("userId");

-- CreateIndex
CREATE INDEX "UploadRecord_module_refId_idx" ON "UploadRecord"("module", "refId");

-- CreateIndex
CREATE INDEX "UploadRecord_objectKey_idx" ON "UploadRecord"("objectKey");

-- CreateIndex
CREATE INDEX "UploadRecord_createdAt_idx" ON "UploadRecord"("createdAt");
