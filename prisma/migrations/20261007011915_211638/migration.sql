/*
  Warnings:

  - You are about to drop the column `documentId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `PaymentReceipt` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Invoice_documentId_key";

-- DropIndex
DROP INDEX "PaymentReceipt_documentId_key";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "documentId";

-- AlterTable
ALTER TABLE "PaymentReceipt" DROP COLUMN "documentId";
