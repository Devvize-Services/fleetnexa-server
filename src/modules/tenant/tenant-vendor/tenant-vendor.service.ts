import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { Tenant, User } from '../../../generated/prisma/client.js';
import { TenantVendorDto } from './tenant-vendor.dto.js';

@Injectable()
export class TenantVendorService {
  private readonly logger = new Logger(TenantVendorService.name);

  constructor(private readonly prisma: PrismaService) {}

  getTenantVendors = async (tenant: Tenant) => {
    try {
      const vendors = await this.prisma.tenantVendor.findMany({
        where: { tenantId: tenant.id },
      });
      return vendors;
    } catch (error) {
      this.logger.error(error, 'Error fetching tenant vendors:', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
      });
      throw new Error('Could not fetch tenant vendors');
    }
  };

  createTenantVendor = async (data: TenantVendorDto, tenant: Tenant) => {
    try {
      const existingVendor = await this.prisma.tenantVendor.findFirst({
        where: {
          tenantId: tenant.id,
          vendor: {
            equals: data.vendor,
            mode: 'insensitive',
          },
        },
      });

      if (existingVendor) {
        throw new NotFoundException('Vendor with this name already exists');
      }

      const newVendor = await this.prisma.tenantVendor.create({
        data: {
          vendor: data.vendor,
          contactName: data.contactName,
          phone: data.phone,
          email: data.email,
          tenantId: tenant.id,
          createdAt: new Date(),
        },
      });

      const vendors = await this.getTenantVendors(tenant);

      return {
        message: 'Vendor added successfully',
        vendor: newVendor,
        vendors,
      };
    } catch (error) {
      this.logger.error(error, 'Error adding tenant vendor:', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        vendorData: data,
      });
      throw new Error('Could not add tenant vendor');
    }
  };

  updateTenantVendor = async (
    data: TenantVendorDto,
    tenant: Tenant,
    user: User,
  ) => {
    try {
      const existingVendor = await this.prisma.tenantVendor.findFirst({
        where: {
          id: data.id,
          tenantId: tenant.id,
        },
      });

      if (!existingVendor) {
        throw new NotFoundException('Vendor not found');
      }

      const updatedVendor = await this.prisma.tenantVendor.update({
        where: { id: data.id },
        data: {
          vendor: data.vendor,
          contactName: data.contactName,
          phone: data.phone,
          email: data.email,
          updatedAt: new Date(),
          updatedBy: user.username,
        },
      });

      const vendors = await this.getTenantVendors(tenant);

      return {
        message: 'Vendor updated successfully',
        vendor: updatedVendor,
        vendors,
      };
    } catch (error) {
      this.logger.error(error, 'Error updating tenant vendor:', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        vendorData: data,
      });
      throw new Error('Could not update tenant vendor');
    }
  };

  deleteTenantVendor = async (vendorId: string, tenant: Tenant, user: User) => {
    try {
      const existingVendor = await this.prisma.tenantVendor.findFirst({
        where: {
          id: vendorId,
          tenantId: tenant.id,
        },
      });

      if (!existingVendor) {
        throw new NotFoundException('Vendor not found');
      }

      await this.prisma.tenantVendor.update({
        where: { id: vendorId },
        data: {
          isDeleted: true,
          updatedBy: user.username,
          updatedAt: new Date(),
        },
      });

      const vendors = await this.getTenantVendors(tenant);
      return {
        message: 'Vendor deleted successfully',
        vendors,
      };
    } catch (error) {
      this.logger.error(error, 'Error deleting tenant vendor:', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        vendorId,
      });
      throw new Error('Could not delete tenant vendor');
    }
  };
}
