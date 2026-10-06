/*
  Warnings:

  - You are about to drop the `VehicleInsuranceHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VehicleRegistrationHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'ARCHIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleComplianceType" AS ENUM ('VEHICLE_REGISTRATION', 'VEHICLE_LICENSE', 'VEHICLE_INSURANCE', 'ROAD_TAX');

-- CreateEnum
CREATE TYPE "VehicleComplianceStatus" AS ENUM ('ACTIVE', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "VehicleInsuranceHistory" DROP CONSTRAINT "VehicleInsuranceHistory_insuranceCompanyId_fkey";

-- DropForeignKey
ALTER TABLE "VehicleInsuranceHistory" DROP CONSTRAINT "VehicleInsuranceHistory_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "VehicleRegistrationHistory" DROP CONSTRAINT "VehicleRegistrationHistory_vehicleId_fkey";

-- DropTable
DROP TABLE "VehicleInsuranceHistory";

-- DropTable
DROP TABLE "VehicleRegistrationHistory";

-- CreateTable
CREATE TABLE "ComplianceProvider" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "ComplianceProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" SERIAL NOT NULL,
    "accessToken" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "altText" TEXT,
    "caption" TEXT,
    "checksum" TEXT,
    "createById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "permanentlyDeleteAt" TIMESTAMP(3),

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleCompliance" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "vehicleId" TEXT NOT NULL,
    "type" "VehicleComplianceType" NOT NULL,
    "status" "VehicleComplianceStatus" NOT NULL,
    "referenceNumber" TEXT,
    "providerId" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "renewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VehicleCompliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleComplianceDocument" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "vehicleComplianceId" TEXT NOT NULL,
    "documentId" INTEGER NOT NULL,

    CONSTRAINT "VehicleComplianceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComplianceProvider_code_key" ON "ComplianceProvider"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Media_accessToken_key" ON "Media"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleComplianceDocument_vehicleComplianceId_documentId_key" ON "VehicleComplianceDocument"("vehicleComplianceId", "documentId");

-- AddForeignKey
ALTER TABLE "VehicleCompliance" ADD CONSTRAINT "VehicleCompliance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleCompliance" ADD CONSTRAINT "VehicleCompliance_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ComplianceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleComplianceDocument" ADD CONSTRAINT "VehicleComplianceDocument_vehicleComplianceId_fkey" FOREIGN KEY ("vehicleComplianceId") REFERENCES "VehicleCompliance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleComplianceDocument" ADD CONSTRAINT "VehicleComplianceDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
