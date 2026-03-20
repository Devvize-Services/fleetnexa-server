import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GeneratorService } from '../../common/generator/generator.service.js';
import { Tenant, User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { TenantExtraService } from './tenant-extra/tenant-extra.service.js';
import { TenantLocationService } from './tenant-location/tenant-location.service.js';
import { TenantRepository } from './tenant.repository.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { UpdateStorefrontDto } from './dto/update-storefront.dto.js';
import { TenantNotificationService } from './tenant-notification/tenant-notification.service.js';
import { TenantVendorService } from './tenant-vendor/tenant-vendor.service.js';
import { VehicleService } from '../vehicle/vehicle.service.js';
import { TenantActivityService } from './tenant-activity/tenant-activity.service.js';
import { TenantRatesService } from './tenant-rates/tenant-rates.service.js';
import { Activity, ActivityType } from 'src/types/tenant.js';
import { VehicleMaintenanceService } from '../vehicle/modules/vehicle-maintenance/vehicle-maintenance.service.js';
import { EmailService } from '../../common/email/email.service.js';
import { BookingService } from '../booking/booking.service.js';
import { CustomerService } from '../customer/customer.service.js';
import { UserService } from '../user/user.service.js';
import { UserRoleService } from '../user/modules/user-role/user-role.service.js';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: GeneratorService,
    private readonly locationService: TenantLocationService,
    private readonly userRoleService: UserRoleService,
    private readonly userService: UserService,
    private readonly extraService: TenantExtraService,
    private readonly tenantRepo: TenantRepository,
    private readonly notifications: TenantNotificationService,
    private readonly locations: TenantLocationService,
    private readonly vendors: TenantVendorService,
    private readonly vehicles: VehicleService,
    private readonly customers: CustomerService,
    private readonly activities: TenantActivityService,
    private readonly rates: TenantRatesService,
    private readonly bookingService: BookingService,
    private readonly maintenanceService: VehicleMaintenanceService,
    private readonly emailService: EmailService,
  ) {}

  async getCurrentTenant(tenant: Tenant, user: User) {
    try {
      const fetched = await this.tenantRepo.getTenantById(tenant.id);
      const extras = await this.extraService.getTenantExtras(tenant);
      const locations = await this.locations.getAllTenantLocations(tenant);
      const vendors = await this.vendors.getTenantVendors(tenant);
      const vehicles = await this.vehicles.getTenantVehicles(tenant);
      const customers = await this.customers.getCustomers(tenant);
      const activity = await this.activities.getTenantActivities(tenant);
      const currencyRates = await this.rates.getTenantRates(tenant);
      const notifications = await this.notifications.getTenantNotifications(
        tenant,
        user,
      );
      const users = await this.userService.getTenantUsers(tenant);
      const roles = await this.userRoleService.getAllRoles(tenant);
      const bookings = await this.bookingService.getBookings(tenant);

      const data = {
        tenant: fetched,
        extras,
        locations,
        notifications,
        vendors,
        vehicles,
        customers,
        activity,
        currencyRates,
        users,
        roles,
        bookings,
      };

      return data;
    } catch (error) {
      this.logger.error('Failed to get current tenant', error);
      throw error;
    }
  }

  async getTenantById(tenantId: string) {
    try {
      const tenant = await this.tenantRepo.getTenantById(tenantId);

      if (!tenant) {
        this.logger.warn(`Tenant with ID ${tenantId} not found.`);
        throw new NotFoundException('Tenant not found');
      }

      return tenant;
    } catch (error) {
      this.logger.error('Failed to get tenant by ID', error);
      throw error;
    }
  }

  async getStorefrontTenants() {
    try {
      return await this.tenantRepo.getStorefrontTenants();
    } catch (error) {
      this.logger.error('Failed to get storefront tenants', error);
      throw error;
    }
  }

  async getStorefrontTenantBySlug(slug: string) {
    try {
      return await this.tenantRepo.getTenantBySlug(slug);
    } catch (error) {
      this.logger.error('Failed to get storefront tenant by slug', error);
      throw error;
    }
  }

  async getStorefrontTenantByDomain(domain: string) {
    try {
      return await this.tenantRepo.getTenantByDomain(domain);
    } catch (error) {
      this.logger.error('Failed to get storefront tenant by slug', error);
      throw error;
    }
  }

  async createTenant(data: CreateTenantDto) {
    try {
      const { tenant, country } = await this.prisma.$transaction(async (tx) => {
        const existingTenant = await tx.tenant.findUnique({
          where: { email: data.companyEmail },
        });

        if (existingTenant) {
          this.logger.warn(
            `Tenant creation failed: Tenant ${existingTenant.tenantName} with email ${data.companyEmail} already exists.`,
          );
          throw new ConflictException(
            'This email is already associated with another Rental Car Company.',
          );
        }

        const country = await tx.country.findUnique({
          where: { code: data.country },
        });
        if (!country) {
          this.logger.warn(
            `Tenant creation failed: Country with code ${data.country} not found.`,
          );
          throw new NotFoundException('Invalid country code provided.');
        }

        const code = await this.generator.generateTenantCode(data.tenantName);
        const slug = await this.generator.generateTenantSlug(data.tenantName);

        const tenant = await tx.tenant.create({
          data: {
            tenantCode: code,
            tenantName: data.tenantName,
            slug,
            email: data.companyEmail,
            number: data.phoneNumber,
            logo: 'https://fleetnexa.s3.us-east-1.amazonaws.com/Global+Images/placeholder_tenant.jpg',
            storefrontEnabled: false,
            createdAt: new Date(),
          },
        });

        tx.address.create({
          data: {
            tenantId: tenant.id,
            countryId: country.id,
          },
        });

        return { tenant, country };
      });

      await this.locationService.initializeTenantLocation(country, tenant);
      const role = await this.userRoleService.createDefaultRole(tenant);

      data.user.roleId = role.id;
      const { user } = await this.userService.createTenantUser(
        data.user,
        tenant,
      );

      if (user.email) {
        await this.emailService.sendWelcomeEmail(user, tenant);
      }

      return tenant;
    } catch (error) {
      this.logger.error(error, 'Failed to create tenant', {
        email: data.companyEmail,
        tenantName: data.tenantName,
      });
      throw error;
    }
  }

  async updateTenant(data: UpdateTenantDto, tenant: Tenant) {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.address.upsert({
          where: { tenantId: tenant.id },
          update: {
            street: data.address.street,
            village: { connect: { id: data.address.villageId } },
            state: { connect: { id: data.address.stateId } },
            country: { connect: { id: data.address.countryId } },
          },
          create: {
            tenant: { connect: { id: tenant.id } },
            street: data.address.street,
            village: { connect: { id: data.address.villageId } },
            state: { connect: { id: data.address.stateId } },
            country: { connect: { id: data.address.countryId } },
          },
        });

        await tx.tenant.update({
          where: { id: tenant.id },
          data: {
            currencyId: data.currencyId,
            email: data.email,
            invoiceFootNotes: data.invoiceFootNotes,
            invoiceSequenceId: data.invoiceSequenceId,
            logo: data.logo,
            number: data.number,
            whatsappNumber: data.whatsappNumber,
            tenantName: data.tenantName,
            financialYearStart: data.financialYearStart,
            setupCompleted: true,
            securityDeposit: data.securityDeposit,
            additionalDriverFee: data.additionalDriverFee,
            daysInMonth: data.daysInMonth,
            paymentMethods: {
              set: data.paymentMethods.map((method: any) => ({
                id: method,
              })),
            },
            startTime: data.startTime,
            endTime: data.endTime,
          },
        });

        const cancellationPolicy = await tx.cancellationPolicy.upsert({
          where: {
            tenantId: tenant.id,
          },
          update: {
            amount: data.cancellationPolicy?.amount || 0,
            policy: data.cancellationPolicy?.policy || 'fixed_amount',
            minimumDays: data.cancellationPolicy?.minimumDays || 0,
            bookingMinimumDays:
              data.cancellationPolicy?.bookingMinimumDays || 0,
          },
          create: {
            tenantId: tenant.id,
            amount: data.cancellationPolicy?.amount || 0,
            policy: data.cancellationPolicy?.policy || 'fixed_amount',
            minimumDays: data.cancellationPolicy?.minimumDays || 0,
            bookingMinimumDays:
              data.cancellationPolicy?.bookingMinimumDays || 0,
          },
        });

        const latePolicy = await tx.latePolicy.upsert({
          where: {
            tenantId: tenant.id,
          },
          update: {
            amount: data.latePolicy?.amount || 0,
            maxHours: data.latePolicy?.maxHours || 0,
          },
          create: {
            tenantId: tenant.id,
            amount: data.latePolicy?.amount || 0,
            maxHours: data.latePolicy?.maxHours || 0,
          },
        });

        await tx.tenant.update({
          where: { id: tenant.id },
          data: {
            cancellationPolicyId: cancellationPolicy.id,
            latePolicyId: latePolicy.id,
          },
        });

        const usdRate = await tx.tenantCurrencyRate.findFirst({
          where: { tenantId: tenant.id, currency: { code: 'USD' } },
        });

        const usd = await tx.currency.findUnique({
          where: { code: 'USD' },
        });

        if (!usd) {
          this.logger.warn(`USD currency not found for tenant ${tenant.id}`);
          throw new NotFoundException('USD currency not found');
        }

        if (usdRate) {
          await tx.tenantCurrencyRate.update({
            where: { id: usdRate.id },
            data: {
              toRate: data.fromUSDRate || 1.0,
              fromRate: 1 / (data.fromUSDRate || 1.0),
            },
          });
        } else {
          await tx.tenantCurrencyRate.create({
            data: {
              tenantId: tenant.id,
              currencyId: usd.id,
              toRate: data.fromUSDRate || 1.0,
              fromRate: 1 / (data.fromUSDRate || 1.0),
            },
          });

          await tx.tenantCurrencyRate.create({
            data: {
              tenantId: tenant.id,
              currencyId: data.currencyId,
              toRate: 1,
              fromRate: 1,
            },
          });
        }
      });

      const updateTenant = await this.tenantRepo.getTenantById(tenant.id);

      return {
        message: 'Settings updated successfully',
        tenant: updateTenant,
      };
    } catch (error) {
      this.logger.error('Failed to update tenant', error);
      throw error;
    }
  }

  async updateStorefront(data: UpdateStorefrontDto, tenant: Tenant) {
    try {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          storefrontEnabled: data.storefrontEnabled,
          description: data.description,
          whatsappNotifications: data.whatsappNotifications,
          emailNotifications: data.emailNotifications,
        },
      });

      if (!data.storefrontEnabled) {
        await this.prisma.vehicle.updateMany({
          where: { tenantId: tenant.id, storefrontEnabled: true },
          data: { storefrontEnabled: false },
        });
      }

      const updatedTenant = await this.tenantRepo.getTenantById(tenant.id);
      const vehicles = await this.vehicles.getTenantVehicles(tenant);

      return {
        message: 'Storefront settings updated successfully',
        tenant: updatedTenant,
        vehicles,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to update storefront settings', {
        tenantCode: tenant.tenantCode,
        tenantId: tenant.id,
        data,
      });
      throw error;
    }
  }

  async getTodayActivities(tenant: Tenant) {
    try {
      const activities: Activity[] = [];
      const today = new Date();

      const bookings = await this.bookingService.getBookingsByDate(
        today.toISOString(),
        tenant,
      );

      const maintenances =
        await this.maintenanceService.getVehicleMaintenanceByDate(
          today.toISOString(),
          tenant,
        );

      const bookingActivities = bookings.map((booking) => {
        const customer = booking.drivers.find((d) => d.isPrimary)?.customer;
        const activityType = booking.endDate > today ? 'pickup' : 'return';

        const time =
          activityType === 'pickup' ? booking.startDate : booking.endDate;

        const vehicleName = `${booking.vehicle.year} ${booking.vehicle.brand.brand} ${booking.vehicle.model.model}`;

        const title = `${activityType === 'pickup' ? 'Vehicle Pickup' : 'Vehicle Return'} - ${vehicleName}`;

        const description = `Booking Ref: ${booking.bookingCode}`;

        const act: Activity = {
          id: booking.id,
          time: time.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          type: activityType as ActivityType,
          title,
          description,
          vehicle: booking.vehicle,
          customer: customer,
          location: activityType === 'pickup' ? booking.pickup : booking.return,
        };

        return act;
      });

      const inspectionActivities = bookings
        .filter((booking) => {
          const isTodayReturn =
            booking.endDate.toDateString() === today.toDateString();

          return isTodayReturn;
        })
        .map((booking) => {
          const vehicleName = `${booking.vehicle.year} ${booking.vehicle.brand.brand} ${booking.vehicle.model.model}`;

          const title = `Post-Booking Inspection - ${vehicleName}`;

          const description = `Damage Assessment - Booking Ref: ${booking.bookingCode}`;

          const inspectionTime = new Date(booking.endDate);
          inspectionTime.setMinutes(inspectionTime.getMinutes() + 5);

          const act: Activity = {
            id: booking.id,
            time: inspectionTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            type: 'inspection' as ActivityType,
            title,
            description,
            vehicle: booking.vehicle,
            location: booking.return,
          };

          return act;
        });

      const maintenanceActivities = maintenances.flatMap((maintenance) => {
        const isStartToday =
          maintenance.startDate.toDateString() === today.toDateString();
        const isEndToday =
          maintenance.endDate.toDateString() === today.toDateString();

        const vehicleName = `${maintenance.vehicle.year} ${maintenance.vehicle.brand.brand} ${maintenance.vehicle.model.model}`;
        const servicesText = maintenance.services
          .map((s) => s.service)
          .join(', ');

        const activities: Activity[] = [];

        if (isStartToday) {
          activities.push({
            id: `${maintenance.id}-out`,
            time: maintenance.startDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            type: 'maintenance',
            title: `${vehicleName} Out for Maintenance`,
            description: `Vehicle has to go out for scheduled maintenance: ${servicesText}`,
            vehicle: maintenance.vehicle,
            vendor: maintenance.vendor || undefined,
          });
        }

        if (isEndToday) {
          activities.push({
            id: `${maintenance.id}-in`,
            time: maintenance.endDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            type: 'maintenance',
            title: `${vehicleName} Returns from Maintenance`,
            description: `Vehicle has to be returned from scheduled maintenance: ${servicesText}`,
            vehicle: maintenance.vehicle,
            vendor: maintenance.vendor || undefined,
          });
        }

        return activities;
      });

      activities.push(
        ...bookingActivities,
        ...maintenanceActivities,
        ...inspectionActivities,
      );

      activities.sort((a, b) => {
        const timeA = new Date(`1970-01-01 ${a.time}`);
        const timeB = new Date(`1970-01-01 ${b.time}`);
        return timeA.getTime() - timeB.getTime();
      });

      return activities;
    } catch (error) {
      this.logger.error('Failed to get tenant activities for today', error);
      throw error;
    }
  }
}
