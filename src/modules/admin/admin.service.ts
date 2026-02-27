/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getClientData() {
    try {
      const permissions = await this.prisma.appPermission.findMany({});
      const countries = await this.prisma.country.findMany({});
      const states = await this.prisma.state.findMany({});
      const vehicleParts = await this.prisma.vehiclePart.findMany({});
      const currencies = await this.prisma.currency.findMany({});
      const fuelTypes = await this.prisma.fuelType.findMany({});
      const paymentMethods = await this.prisma.paymentMethod.findMany({});
      const chargeTypes = await this.prisma.chargeType.findMany({});
      const transmissions = await this.prisma.transmission.findMany({});
      const vehicleFeatures = await this.prisma.vehicleFeature.findMany({});
      const vehicleStatuses = await this.prisma.vehicleStatus.findMany({});
      const wheelDrives = await this.prisma.wheelDrive.findMany({});
      const fuelPolicies = await this.prisma.fuelPolicy.findMany({});
      const villages = await this.prisma.village.findMany({});
      const invoiceSequences = await this.prisma.invoiceSequence.findMany({});
      const vehicleModels = await this.prisma.vehicleModel.findMany({});
      const vehicleBrands = await this.prisma.vehicleBrand.findMany({});
      const vehicleBodyTypes = await this.prisma.vehicleBodyType.findMany({});
      const maintenanceServices = await this.prisma.maintenanceService.findMany(
        {},
      );
      const documentTypes = await this.prisma.documentType.findMany({});
      const presetLocations = await this.prisma.presetLocation.findMany({});
      const services = await this.prisma.service.findMany({});
      const licenseClasses = await this.prisma.licenseClass.findMany({});
      const messengerApps = await this.prisma.messengerApp.findMany({});
      const equipments = await this.prisma.equipment.findMany({});
      const contactTypes = await this.prisma.contactType.findMany({});
      const paymentTypes = await this.prisma.paymentType.findMany({});
      const vendorTypes = await this.prisma.vendorType.findMany({});
      const subscriptionPlans = await this.prisma.subscriptionPlan.findMany({
        include: { features: true },
      });
      const insuranceCompanies = await this.prisma.insuranceCompany.findMany(
        {},
      );

      return {
        permissions,
        countries,
        states,
        categories: await this.prisma.permissionCategory.findMany({}),
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
      const models = {
        countries: this.prisma.country,
        states: this.prisma.state,
        villages: this.prisma.village,
      };

      const vehicleFeatures = await this.prisma.vehicleFeature.findMany({
        where: {
          vehicles: { some: {} },
        },
      });

      const vehicleBodyTypes = await this.prisma.vehicleBodyType.findMany({
        where: {
          models: {
            some: { vehicles: { some: {} } },
          },
        },
      });

      const caribbeanCountries = await this.prisma.caribbeanCountry.findMany({
        where: {
          country: {
            addresses: {
              some: {},
            },
          },
        },
        include: { country: true },
      });

      const entries = await Promise.all(
        Object.entries(models).map(async ([key, model]) => {
          return [key, await (model as any).findMany()];
        }),
      );

      const data = Object.fromEntries(entries);

      return { ...data, caribbeanCountries, vehicleFeatures, vehicleBodyTypes };
    } catch (error) {
      this.logger.error('Failed to get storefront data', error);
      throw error;
    }
  }

  async getDashboardAdminData() {
    try {
      const permissions = await this.prisma.appPermission.findMany({});
      const countries = await this.prisma.country.findMany({});
      const states = await this.prisma.state.findMany({});
      const categories = await this.prisma.permissionCategory.findMany({});
      const vehicleParts = await this.prisma.vehiclePart.findMany({});
      const currencies = await this.prisma.currency.findMany({});
      const fuelTypes = await this.prisma.fuelType.findMany({});
      const paymentMethods = await this.prisma.paymentMethod.findMany({});
      const chargeTypes = await this.prisma.chargeType.findMany({});
      const transmissions = await this.prisma.transmission.findMany({});
      const vehicleFeatures = await this.prisma.vehicleFeature.findMany({});
      const vehicleStatuses = await this.prisma.vehicleStatus.findMany({});
      const wheelDrives = await this.prisma.wheelDrive.findMany({});
      const fuelPolicies = await this.prisma.fuelPolicy.findMany({});
      const villages = await this.prisma.village.findMany({});
      const invoiceSequences = await this.prisma.invoiceSequence.findMany({});
      const vehicleModels = await this.prisma.vehicleModel.findMany({});
      const vehicleBrands = await this.prisma.vehicleBrand.findMany({});
      const vehicleBodyTypes = await this.prisma.vehicleBodyType.findMany({});
      const maintenanceServices = await this.prisma.maintenanceService.findMany(
        {},
      );
      const documentTypes = await this.prisma.documentType.findMany({});
      const presetLocations = await this.prisma.presetLocation.findMany({});
      const services = await this.prisma.service.findMany({});
      const licenseClasses = await this.prisma.licenseClass.findMany({});
      const messengerApps = await this.prisma.messengerApp.findMany({});
      const equipments = await this.prisma.equipment.findMany({});
      const contactTypes = await this.prisma.contactType.findMany({});
      const paymentTypes = await this.prisma.paymentType.findMany({});
      const vendorTypes = await this.prisma.vendorType.findMany({});

      // const models = {
      //   vehicleParts: this.prisma.vehiclePart,
      //   currencies: this.prisma.currency,
      //   fuelTypes: this.prisma.fuelType,
      //   paymentMethods: this.prisma.paymentMethod,
      //   chargeTypes: this.prisma.chargeType,
      //   transmissions: this.prisma.transmission,
      //   vehicleFeatures: this.prisma.vehicleFeature,
      //   vehicleStatuses: this.prisma.vehicleStatus,
      //   wheelDrives: this.prisma.wheelDrive,
      //   fuelPolicies: this.prisma.fuelPolicy,
      //   countries: this.prisma.country,
      //   states: this.prisma.state,
      //   villages: this.prisma.village,
      //   invoiceSequences: this.prisma.invoiceSequence,
      //   vehicleModels: this.prisma.vehicleModel,
      //   vehicleBrands: this.prisma.vehicleBrand,
      //   vehicleBodyTypes: this.prisma.vehicleBodyType,
      //   maintenanceServices: this.prisma.maintenanceService,
      //   documentTypes: this.prisma.documentType,
      //   presetLocations: this.prisma.presetLocation,
      //   services: this.prisma.service,
      //   licenseClasses: this.prisma.licenseClass,
      //   messengerApps: this.prisma.messengerApp,
      //   equipments: this.prisma.equipment,
      //   contactTypes: this.prisma.contactType,
      //   paymentTypes: this.prisma.paymentType,
      //   permissions: this.prisma.appPermission,
      //   vendorTypes: this.prisma.vendorType,
      //   categories: this.prisma.permissionCategory,
      // };

      // const entries = await Promise.all(
      //   Object.entries(models).map(async ([key, model]) => {
      //     return [key, await (model as any).findMany()];
      //   }),
      // );

      // const data = Object.fromEntries(entries);

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
