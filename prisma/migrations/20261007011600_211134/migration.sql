/*
  Warnings:

  - The primary key for the `Media` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `accessToken` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Media` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `VehicleComplianceDocument` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[documentId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[documentId]` on the table `PaymentReceipt` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vehicleComplianceId,url]` on the table `VehicleComplianceDocument` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `url` to the `VehicleComplianceDocument` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "VehicleComplianceDocument" DROP CONSTRAINT "VehicleComplianceDocument_documentId_fkey";

-- DropIndex
DROP INDEX "Media_accessToken_key";

-- DropIndex
DROP INDEX "VehicleComplianceDocument_vehicleComplianceId_documentId_key";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "documentId" TEXT;

-- AlterTable
ALTER TABLE "Media" DROP CONSTRAINT "Media_pkey",
DROP COLUMN "accessToken",
DROP COLUMN "url",
ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Media_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Media_id_seq";

-- AlterTable
ALTER TABLE "PaymentReceipt" ADD COLUMN     "documentId" TEXT;

-- AlterTable
ALTER TABLE "VehicleComplianceDocument" DROP COLUMN "documentId",
ADD COLUMN     "url" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_documentId_key" ON "Invoice"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceipt_documentId_key" ON "PaymentReceipt"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleComplianceDocument_vehicleComplianceId_url_key" ON "VehicleComplianceDocument"("vehicleComplianceId", "url");
