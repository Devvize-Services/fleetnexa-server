/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { CountryDto } from './country.dto.js';
import { FormatterService } from '../../../common/formatter/formatter.service.js';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import { CSCCountry } from 'src/types/csc.data.js';

@Injectable()
export class CountryService {
  private readonly logger = new Logger(CountryService.name);
  private readonly api: AxiosInstance;

  constructor(
    private readonly prisma: PrismaService,
    private readonly formatter: FormatterService,
    private readonly config: ConfigService,
  ) {
    this.api = axios.create({
      baseURL: this.config.get<string>('CSC_API_URL'),
      headers: {
        'X-CSCAPI-KEY': this.config.get<string>('CSC_API_KEY'),
        'Content-Type': 'application/json',
      },
    });
  }

  async getCountries() {
    try {
      return this.prisma.country.findMany({
        include: {
          _count: {
            select: {
              states: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error('Error fetching countries', error);
      throw error;
    }
  }

  async getCountryById(id: string) {
    try {
      return this.prisma.country.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              states: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching country with id ${id}`, error);
      throw error;
    }
  }

  async createCountry(data: CountryDto) {
    try {
      const existing = await this.prisma.country.findFirst({
        where: {
          OR: [
            { country: { equals: data.country, mode: 'insensitive' } },
            { code: { equals: data.code, mode: 'insensitive' } },
          ],
        },
      });

      if (existing) {
        this.logger.warn(
          `Country creation conflict: country ${data.country} or code ${data.code} already exists`,
        );
        throw new ConflictException(
          'Country with the same name or code already exists',
        );
      }

      const country = await this.formatter.formatToTitleCase(data.country);
      const code = await this.formatter.formatToUpperCase(data.code);

      await this.prisma.country.create({
        data: {
          country: country,
          code: code,
        },
      });

      const countries = await this.getCountries();

      return {
        message: 'Country created successfully',
        countries,
      };
    } catch (error) {
      this.logger.error('Error creating country', error);
      throw error;
    }
  }

  async bulkCreateCountries(data: any[]) {
    try {
      const failedRows: { item: any; errors?: any; error?: string }[] = [];

      for (const item of data) {
        const instance: CountryDto = plainToInstance(CountryDto, item);
        const errors = await validate(instance);

        if (errors.length > 0) {
          failedRows.push({ item, errors });
          this.logger.warn(
            `Validation failed for country: ${JSON.stringify(item)}`,
          );
          continue;
        }

        try {
          await this.createCountry(instance);
        } catch (error) {
          failedRows.push({ item, error: error.message });
          this.logger.warn(
            `Skipping country due to error: ${JSON.stringify(item)} - Error: ${error.message}`,
          );
        }
      }

      const countries = await this.getCountries();

      return {
        message: 'Bulk country upload completed',
        countries,
      };
    } catch (error) {
      this.logger.error('Error during bulk country creation', error);
      throw error;
    }
  }
}
