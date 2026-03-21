import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { Tenant, User } from '../../../../generated/prisma/client.js';
import { VehicleMaintenanceDto } from './vehicle-maintenance.dto.js';
import { ExpenseDto } from '../../../../modules/transaction/modules/expense/expense.dto.js';
import { ExpenseService } from '../../../../modules/transaction/modules/expense/expense.service.js';
import { VehicleRepository } from '../../vehicle.repository.js';

@Injectable()
export class VehicleMaintenanceService {
  private readonly logger = new Logger(VehicleMaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly expenseService: ExpenseService,
    private readonly vehicleRepo: VehicleRepository,
  ) {}

  async getTenantMaintenanceServices(tenant: Tenant) {
    try {
      const services = await this.prisma.vehicleMaintenance.findMany({
        where: { tenantId: tenant.id, isDeleted: false },
        include: {
          services: true,
          vendor: true,
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              licensePlate: true,
            },
          },
        },
      });

      return services;
    } catch (error) {
      this.logger.error(error, 'Error fetching tenant maintenance services', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async getVehicleMaintenances(vehicleId: string, tenant: Tenant) {
    try {
      const maintenances = await this.prisma.vehicleMaintenance.findMany({
        where: { vehicleId, tenantId: tenant.id, isDeleted: false },
        include: {
          services: true,
          vendor: true,
          vehicle: {
            select: {
              id: true,
              brand: true,
              model: true,
              year: true,
              licensePlate: true,
            },
          },
        },
        orderBy: { startDate: 'desc' },
      });
      return maintenances;
    } catch (error) {
      this.logger.error(error, 'Error fetching vehicle maintenances', {
        vehicleId,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async getVehicleMaintenanceByDate(date: string, tenant: Tenant) {
    try {
      const dateObj = new Date(date);

      const maintenances = await this.prisma.vehicleMaintenance.findMany({
        where: {
          tenantId: tenant.id,
          OR: [
            {
              startDate: {
                gte: new Date(
                  dateObj.getFullYear(),
                  dateObj.getMonth(),
                  dateObj.getDate(),
                ),
                lt: new Date(
                  dateObj.getFullYear(),
                  dateObj.getMonth(),
                  dateObj.getDate() + 1,
                ),
              },
            },
            {
              endDate: {
                gte: new Date(
                  dateObj.getFullYear(),
                  dateObj.getMonth(),
                  dateObj.getDate(),
                ),
                lt: new Date(
                  dateObj.getFullYear(),
                  dateObj.getMonth(),
                  dateObj.getDate() + 1,
                ),
              },
            },
          ],
        },
        include: {
          services: true,
          vendor: true,
          vehicle: {
            include: {
              brand: true,
              model: {
                include: {
                  bodyType: true,
                },
              },
              vehicleStatus: true,
              transmission: true,
              wheelDrive: true,
              fuelType: true,
              features: true,
              damages: {
                where: { isDeleted: false },
                include: {
                  customer: true,
                },
              },
            },
          },
        },
      });

      return maintenances;
    } catch (error) {
      this.logger.error(error, 'Error fetching vehicle maintenances by date', {
        date,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw error;
    }
  }

  async addVehicleMaintenance(
    data: VehicleMaintenanceDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      await this.prisma.vehicleMaintenance.create({
        data: {
          id: data.id,
          vehicleId: data.vehicleId,
          vendorId: data.vendorId ?? null,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          cost: data.cost,
          tenantId: tenant.id,
          createdBy: user.username,
          services: {
            connect: data.services.map((serviceId) => ({
              id: serviceId,
            })),
          },
        },
      });

      const services = await this.getTenantMaintenanceServices(tenant);
      const vehicle = await this.vehicleRepo.getVehicleById(
        data.vehicleId,
        tenant.id,
      );
      const vehicles = await this.vehicleRepo.getVehicles(tenant.id);

      return {
        message: 'Vehicle maintenance record added successfully',
        vehicle,
        vehicles,
        scheduledMaintenances: services,
      };
    } catch (error) {
      this.logger.error(error, 'Error adding vehicle maintenance record', {
        data,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        userId: user.id,
      });
      throw error;
    }
  }

  async updateVehicleMaintenance(
    data: VehicleMaintenanceDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const existingRecord = await this.prisma.vehicleMaintenance.findUnique({
        where: { id: data.id },
      });

      if (!existingRecord) {
        this.logger.warn(
          `Vehicle maintenance record with ID ${data.id} not found for update`,
        );
        throw new NotFoundException('Vehicle maintenance record not found');
      }

      await this.prisma.vehicleMaintenance.update({
        where: { id: data.id },
        data: {
          vehicleId: data.vehicleId,
          vendorId: data.vendorId || null,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          cost: data.cost,
          updatedAt: new Date(),
          updatedBy: user.username,
          status: data.status || existingRecord.status,
          tenantId: tenant.id,
          services: {
            set: data.services.map((id) => ({ id })),
          },
        },
      });

      const services = await this.getTenantMaintenanceServices(tenant);
      const vehicle = await this.vehicleRepo.getVehicleById(
        data.vehicleId,
        tenant.id,
      );
      const vehicles = await this.vehicleRepo.getVehicles(tenant.id);

      return {
        message: 'Vehicle maintenance record updated successfully',
        vehicle,
        vehicles,
        scheduledMaintenances: services,
      };
    } catch (error) {
      this.logger.error(error, 'Error updating vehicle maintenance record', {
        data,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        userId: user.id,
      });
      throw error;
    }
  }

  async deleteVehicleMaintenance(id: string, tenant: Tenant, user: User) {
    try {
      const existingRecord = await this.prisma.vehicleMaintenance.findUnique({
        where: { id },
      });

      if (!existingRecord) {
        this.logger.warn(
          `Vehicle maintenance record with ID ${id} not found for deletion`,
        );
        throw new NotFoundException('Vehicle maintenance record not found');
      }

      await this.prisma.vehicleMaintenance.update({
        where: { id },
        data: {
          isDeleted: true,
          updatedAt: new Date(),
          updatedBy: user.username,
        },
      });

      const services = await this.getTenantMaintenanceServices(tenant);
      const vehicle = await this.vehicleRepo.getVehicleById(id, tenant.id);
      const vehicles = await this.vehicleRepo.getVehicles(tenant.id);

      return {
        message: 'Vehicle maintenance record deleted successfully',
        vehicle,
        vehicles,
        scheduledMaintenances: services,
      };
    } catch (error) {
      this.logger.error(error, 'Error deleting vehicle maintenance record', {
        id,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        userId: user.id,
      });
      throw error;
    }
  }

  async completeVehicleMaintenance(
    data: VehicleMaintenanceDto,
    tenant: Tenant,
    user: User,
  ) {
    try {
      const existingRecord = await this.prisma.vehicleMaintenance.findUnique({
        where: { id: data.id },
      });

      if (!existingRecord) {
        throw new Error('Vehicle maintenance record not found');
      }

      const updatedRecord = await this.prisma.vehicleMaintenance.update({
        where: { id: data.id },
        data: {
          status: 'COMPLETED',
          endDate: new Date(data.endDate),
          cost: data.cost,
          updatedAt: new Date(),
          updatedBy: user.username,
        },
        include: {
          services: true,
          vehicle: {
            include: { brand: true, model: true },
          },
          vendor: true,
        },
      });

      if (data.recordExpense) {
        const desc = `Maintenance ${updatedRecord.vehicle.year} ${updatedRecord.vehicle.brand.brand} ${updatedRecord.vehicle.model.model} (${updatedRecord.vehicle.licensePlate})`;
        const payee = updatedRecord.vendor
          ? updatedRecord.vendor.vendor
          : 'Unknown Vendor';
        const note = updatedRecord.services
          .map((service) => service.service)
          .join(', ');

        const expense: ExpenseDto = {
          id: data.id,
          vehicleId: data.vehicleId,
          vendorId: data.vendorId || '',
          amount: data.cost,
          maintenanceId: data.id,
          notes: note,
          expenseDate: data.expenseDate
            ? new Date(data.expenseDate).toISOString()
            : new Date().toISOString(),
          expense: desc,
          payee,
        };

        await this.expenseService.createExpense(expense, tenant, user);
      }

      const services = await this.getTenantMaintenanceServices(tenant);
      const vehicle = await this.vehicleRepo.getVehicleById(
        data.vehicleId,
        tenant.id,
      );
      const vehicles = await this.vehicleRepo.getVehicles(tenant.id);

      return {
        message: 'Vehicle maintenance completed successfully',
        vehicle,
        vehicles,
        scheduledMaintenances: services,
      };
    } catch (error) {
      this.logger.error(error, 'Error completing vehicle maintenance', {
        data,
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        userId: user.id,
      });
      throw error;
    }
  }
}
