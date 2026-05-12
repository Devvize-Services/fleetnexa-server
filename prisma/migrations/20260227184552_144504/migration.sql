-- CreateTable
CREATE TABLE "InsuranceCompany" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "company" TEXT NOT NULL,

    CONSTRAINT "InsuranceCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleInsuranceHistory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "vehicleId" TEXT NOT NULL,
    "insuranceCompanyId" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "expired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "VehicleInsuranceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleRegistrationHistory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "vehicleId" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "expired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "VehicleRegistrationHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VehicleInsuranceHistory" ADD CONSTRAINT "VehicleInsuranceHistory_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleInsuranceHistory" ADD CONSTRAINT "VehicleInsuranceHistory_insuranceCompanyId_fkey" FOREIGN KEY ("insuranceCompanyId") REFERENCES "InsuranceCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRegistrationHistory" ADD CONSTRAINT "VehicleRegistrationHistory_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
