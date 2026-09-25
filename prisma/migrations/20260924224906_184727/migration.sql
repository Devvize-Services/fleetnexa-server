/*
  Warnings:

  - You are about to drop the `SecurityDepositTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'SECURITY_DEPOSIT';

-- DropForeignKey
ALTER TABLE "SecurityDepositTransaction" DROP CONSTRAINT "SecurityDepositTransaction_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "SecurityDepositTransaction" DROP CONSTRAINT "SecurityDepositTransaction_securityDepositId_fkey";

-- AlterTable
ALTER TABLE "Transactions" ADD COLUMN     "securityDepositId" TEXT;

-- DropTable
DROP TABLE "SecurityDepositTransaction";

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_securityDepositId_fkey" FOREIGN KEY ("securityDepositId") REFERENCES "SecurityDeposit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
