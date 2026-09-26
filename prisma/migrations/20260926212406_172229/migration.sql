-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityAction" ADD VALUE 'COLLECT';
ALTER TYPE "ActivityAction" ADD VALUE 'WAIVE';
ALTER TYPE "ActivityAction" ADD VALUE 'FORFEIT';

-- AlterEnum
ALTER TYPE "ActivityModule" ADD VALUE 'SECURITY_DEPOSIT';

-- AlterTable
ALTER TABLE "SecurityDeposit" ADD COLUMN     "amountWaived" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
