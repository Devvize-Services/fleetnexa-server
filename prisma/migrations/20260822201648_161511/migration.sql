/*
  Warnings:

  - A unique constraint covering the columns `[accessToken]` on the table `PaymentReceipt` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "ActivityModule" ADD VALUE 'RECEIPT';

-- AlterTable
ALTER TABLE "PaymentReceipt" ADD COLUMN     "accessToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_accessToken_key" ON "PaymentReceipt"("accessToken");

-- CreateIndex
CREATE INDEX "PaymentReceipt_tenantId_createdAt_idx" ON "PaymentReceipt"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentReceipt_tenantId_customerId_idx" ON "PaymentReceipt"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "PaymentReceipt_tenantId_paymentId_idx" ON "PaymentReceipt"("tenantId", "paymentId");

-- CreateIndex
CREATE INDEX "PaymentReceipt_tenantId_bookingId_idx" ON "PaymentReceipt"("tenantId", "bookingId");

-- CreateIndex
CREATE INDEX "PaymentReceipt_tenantId_accessToken_idx" ON "PaymentReceipt"("tenantId", "accessToken");
