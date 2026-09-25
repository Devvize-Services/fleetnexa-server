/*
  Warnings:

  - The values [SECURITY_DEPOSIT] on the enum `TransactionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TransactionType_new" AS ENUM ('RENTAL', 'REFUND', 'PAYMENT', 'EXPENSE', 'SECURITY_DEPOSIT_COLLECTED', 'SECURITY_DEPOSIT_REFUNDED', 'SECURITY_DEPOSIT_FORFEITED');
ALTER TABLE "Transactions" ALTER COLUMN "type" TYPE "TransactionType_new" USING ("type"::text::"TransactionType_new");
ALTER TYPE "TransactionType" RENAME TO "TransactionType_old";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";
DROP TYPE "public"."TransactionType_old";
COMMIT;
