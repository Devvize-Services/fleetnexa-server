/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,reference]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Payment_reference_key";

-- CreateIndex
CREATE UNIQUE INDEX "Payment_tenantId_reference_key" ON "Payment"("tenantId", "reference");
