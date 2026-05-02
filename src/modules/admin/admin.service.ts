import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getClientData() {
    try {
      const [
        permissions,
        countries,
        states,
        categories,
        vehicleParts,
        currencies,
        fuelTypes,
        paymentMethods,
        chargeTypes,
        transmissions,
        vehicleFeatures,
        vehicleStatuses,
        wheelDrives,
        fuelPolicies,
        villages,
        invoiceSequences,
        vehicleModels,
        vehicleBrands,
        vehicleBodyTypes,
        maintenanceServices,
        documentTypes,
        presetLocations,
        services,
        licenseClasses,
        messengerApps,
        equipments,
        contactTypes,
        paymentTypes,
        vendorTypes,
        subscriptionPlans,
        insuranceCompanies,
      ] = await Promise.all([
        this.prisma.appPermission.findMany({}),
        this.prisma.country.findMany({}),
        this.prisma.state.findMany({}),
        this.prisma.permissionCategory.findMany({}),
        this.prisma.vehiclePart.findMany({}),
        this.prisma.currency.findMany({}),
        this.prisma.fuelType.findMany({}),
        this.prisma.paymentMethod.findMany({}),
        this.prisma.chargeType.findMany({}),
        this.prisma.transmission.findMany({}),
        this.prisma.vehicleFeature.findMany({}),
        this.prisma.vehicleStatus.findMany({}),
        this.prisma.wheelDrive.findMany({}),
        this.prisma.fuelPolicy.findMany({}),
        this.prisma.village.findMany({}),
        this.prisma.invoiceSequence.findMany({}),
        this.prisma.vehicleModel.findMany({}),
        this.prisma.vehicleBrand.findMany({}),
        this.prisma.vehicleBodyType.findMany({}),
        this.prisma.maintenanceService.findMany({}),
        this.prisma.documentType.findMany({}),
        this.prisma.presetLocation.findMany({}),
        this.prisma.service.findMany({}),
        this.prisma.licenseClass.findMany({}),
        this.prisma.messengerApp.findMany({}),
        this.prisma.equipment.findMany({}),
        this.prisma.contactType.findMany({}),
        this.prisma.paymentType.findMany({}),
        this.prisma.vendorType.findMany({}),
        this.prisma.subscriptionPlan.findMany({ include: { features: true } }),
        this.prisma.insuranceCompany.findMany({}),
      ]);

      return {
        permissions,
        countries,
        states,
        categories,
        vehicleParts,
        currencies,
        fuelTypes,
        paymentMethods,
        chargeTypes,
        transmissions,
        vehicleFeatures,
        vehicleStatuses,
        wheelDrives,
        fuelPolicies,
        villages,
        invoiceSequences,
        vehicleModels,
        vehicleBrands,
        vehicleBodyTypes,
        maintenanceServices,
        documentTypes,
        presetLocations,
        services,
        licenseClasses,
        messengerApps,
        equipments,
        contactTypes,
        paymentTypes,
        vendorTypes,
        subscriptionPlans,
        insuranceCompanies,
      };
    } catch (error) {}
  }

  async getStorefrontData() {
    try {
      const [
        countries,
        states,
        villages,
        vehicleFeatures,
        vehicleBodyTypes,
        caribbeanCountries,
      ] = await Promise.all([
        this.prisma.country.findMany({}),
        this.prisma.state.findMany({}),
        this.prisma.village.findMany({}),
        this.prisma.vehicleFeature.findMany({
          where: {
            vehicles: { some: {} },
          },
        }),
        this.prisma.vehicleBodyType.findMany({
          where: {
            models: {
              some: { vehicles: { some: {} } },
            },
          },
        }),
        this.prisma.caribbeanCountry.findMany({
          where: {
            country: {
              addresses: {
                some: {},
              },
            },
          },
          include: { country: true },
        }),
      ]);

      return {
        countries,
        states,
        villages,
        caribbeanCountries,
        vehicleFeatures,
        vehicleBodyTypes,
      };
    } catch (error) {
      this.logger.error('Failed to get storefront data', error);
      throw error;
    }
  }

  async getDashboardAdminData() {
    try {
      const [
        permissions,
        countries,
        states,
        categories,
        vehicleParts,
        currencies,
        fuelTypes,
        paymentMethods,
        chargeTypes,
        transmissions,
        vehicleFeatures,
        vehicleStatuses,
        wheelDrives,
        fuelPolicies,
        villages,
        invoiceSequences,
        vehicleModels,
        vehicleBrands,
        vehicleBodyTypes,
        maintenanceServices,
        documentTypes,
        presetLocations,
        services,
        licenseClasses,
        messengerApps,
        equipments,
        contactTypes,
        paymentTypes,
        vendorTypes,
      ] = await Promise.all([
        this.prisma.appPermission.findMany({}),
        this.prisma.country.findMany({}),
        this.prisma.state.findMany({}),
        this.prisma.permissionCategory.findMany({}),
        this.prisma.vehiclePart.findMany({}),
        this.prisma.currency.findMany({}),
        this.prisma.fuelType.findMany({}),
        this.prisma.paymentMethod.findMany({}),
        this.prisma.chargeType.findMany({}),
        this.prisma.transmission.findMany({}),
        this.prisma.vehicleFeature.findMany({}),
        this.prisma.vehicleStatus.findMany({}),
        this.prisma.wheelDrive.findMany({}),
        this.prisma.fuelPolicy.findMany({}),
        this.prisma.village.findMany({}),
        this.prisma.invoiceSequence.findMany({}),
        this.prisma.vehicleModel.findMany({}),
        this.prisma.vehicleBrand.findMany({}),
        this.prisma.vehicleBodyType.findMany({}),
        this.prisma.maintenanceService.findMany({}),
        this.prisma.documentType.findMany({}),
        this.prisma.presetLocation.findMany({}),
        this.prisma.service.findMany({}),
        this.prisma.licenseClass.findMany({}),
        this.prisma.messengerApp.findMany({}),
        this.prisma.equipment.findMany({}),
        this.prisma.contactType.findMany({}),
        this.prisma.paymentType.findMany({}),
        this.prisma.vendorType.findMany({}),
      ]);

      return {
        permissions,
        countries,
        states,
        categories,
        vehicleParts,
        currencies,
        fuelTypes,
        paymentMethods,
        chargeTypes,
        transmissions,
        vehicleFeatures,
        vehicleStatuses,
        wheelDrives,
        fuelPolicies,
        villages,
        invoiceSequences,
        vehicleModels,
        vehicleBrands,
        vehicleBodyTypes,
        maintenanceServices,
        documentTypes,
        presetLocations,
        services,
        licenseClasses,
        messengerApps,
        equipments,
        contactTypes,
        paymentTypes,
        vendorTypes,
      };
    } catch (error) {
      this.logger.error('Error fetching admin data', error);
      throw error;
    }
  }
}
