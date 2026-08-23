/*
  Warnings:

  - A unique constraint covering the columns `[reference]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED';

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("username") ON DELETE SET NULL ON UPDATE CASCADE;
