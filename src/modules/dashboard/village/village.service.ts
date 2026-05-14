/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FormatterService } from '../../../common/formatter/formatter.service.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { VillageDto } from './village.dto.js';
import { Country, State } from '../../../generated/prisma/client.js';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import axios from 'axios';
import XLSX from 'xlsx';

@Injectable()
export class VillageService {
  private readonly logger = new Logger(VillageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly formatter: FormatterService,
  ) {}

  async getVillages() {
    try {
      return this.prisma.village.findMany({
        include: {
          state: {
            include: {
              country: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error('Error fetching villages', error);
      throw error;
    }
  }

  async createVillage(data: VillageDto) {
    try {
      let state: State | null = null;
      let country: Country | null = null;

      if (data.countryId) {
        country = await this.prisma.country.findUnique({
          where: { id: data.countryId },
        });
      } else {
        country = await this.prisma.country.findFirst({
          where: {
            country: { equals: data.country, mode: 'insensitive' },
          },
        });
      }

      if (!country) {
        this.logger.warn(`Country with ID ${data.countryId} not found`);
        throw new NotFoundException('Country not found');
      }

      if (data.stateId) {
        state = await this.prisma.state.findUnique({
          where: { id: data.stateId, countryId: country.id },
        });
      } else if (data.state) {
        state = await this.prisma.state.findFirst({
          where: {
            state: { equals: data.state, mode: 'insensitive' },
            countryId: country.id,
          },
        });
      }

      if (!state) {
        this.logger.warn(`State with ID ${data.stateId} not found`);
        throw new NotFoundException('State not found');
      }

      const existing = await this.prisma.village.findFirst({
        where: {
          village: { equals: data.village, mode: 'insensitive' },
          stateId: state.id,
          state: {
            countryId: country.id,
          },
        },
      });

      if (existing) {
        this.logger.warn(
          `Village ${data.village} already exists in state ID ${state.id}`,
        );
        throw new NotFoundException(
          'Village already exists in the specified state',
        );
      }

      const village = await this.formatter.formatToTitleCase(data.village);

      await this.prisma.village.create({
        data: {
          village,
          stateId: state.id,
        },
      });

      const villages = await this.getVillages();

      return {
        message: 'Village created successfully',
        villages,
      };
    } catch (error) {
      this.logger.error('Error creating village', error);
      throw error;
    }
  }

  async bulkCreateVillages(data: any[]) {
    try {
      const failedRows: { item: any; errors?: any; error?: string }[] = [];

      for (const item of data) {
        const instance: VillageDto = plainToInstance(VillageDto, item);
        const errors = await validate(instance);

        if (errors.length > 0) {
          failedRows.push({ item, errors });
          this.logger.warn(
            `Validation failed for village: ${JSON.stringify(item)}`,
          );
          continue;
        }

        try {
          await this.createVillage(instance);
        } catch (error) {
          failedRows.push({ item, error: error.message });
          this.logger.warn(
            `Skipping village due to error: ${JSON.stringify(item)} - Error: ${error.message}`,
          );
        }
      }

      const villages = await this.getVillages();
      return {
        message: 'Bulk village upload completed',
        villages,
      };
    } catch (error) {
      this.logger.error('Error in bulk creating villages', error);
      throw error;
    }
  }

  async updateVillage(data: VillageDto) {
    try {
      const existing = await this.prisma.village.findUnique({
        where: { id: data.id },
      });

      if (!existing) {
        this.logger.warn(`Village with ID ${data.id} not found`);
        throw new NotFoundException('Village not found');
      }

      const stateId = data.stateId || existing.stateId;
      const state = await this.prisma.state.findUnique({
        where: { id: stateId },
      });

      if (!state) {
        this.logger.warn(`State with ID ${stateId} not found`);
        throw new NotFoundException('State not found');
      }

      const village = await this.formatter.formatToTitleCase(data.village);

      await this.prisma.village.update({
        where: { id: data.id },
        data: {
          village,
          stateId: state.id,
        },
      });

      const villages = await this.getVillages();

      return {
        message: 'Village updated successfully',
        villages,
      };
    } catch (error) {
      this.logger.error('Error updating village', error);
      throw error;
    }
  }

  async deleteVillage(id: string) {
    try {
      const existing = await this.prisma.village.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              customerAddresses: true,
              presetLocations: true,
              storefrontUser: true,
            },
          },
        },
      });

      if (!existing) {
        this.logger.warn(`Village with ID ${id} not found`);
        throw new NotFoundException('Village not found');
      }

      if (
        existing._count.customerAddresses > 0 ||
        existing._count.presetLocations > 0 ||
        existing._count.storefrontUser > 0
      ) {
        this.logger.warn(
          `Village with ID ${id} cannot be deleted due to existing dependencies`,
        );
        throw new ConflictException(
          'Village cannot be deleted due to existing dependencies',
        );
      }

      await this.prisma.village.delete({
        where: { id },
      });

      const villages = await this.getVillages();

      return {
        message: 'Village deleted successfully',
        villages,
      };
    } catch (error) {
      this.logger.error('Error deleting village', error);
      throw error;
    }
  }
}
