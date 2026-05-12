/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
import { Global, Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/client';

@Global()
@Injectable()
export class FormatterService {
  private readonly logger = new Logger(FormatterService.name);

  async formatDateToFriendlyDateShort(date: Date) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  async formatDate(date: Date): Promise<string> {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  async formatCurrencyWithCode(
    code: string,
    amount: number | Decimal,
  ): Promise<string> {
    const formattedAmount = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount instanceof Decimal ? amount.toNumber() : amount);

    return `${code} ${formattedAmount}`;
  }

  formatDateToFriendly(date: Date | string | null | undefined): string {
    if (!date) return '';

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return new Date(date).toLocaleString('en-US', options);
  }

  async formatMilage(mileage: number): Promise<string> {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(mileage);

    return `${formatted} km`;
  }

  formatDateToFriendlyTime(date: Date | string | null | undefined): string {
    if (!date) return '';

    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };

    return new Date(date).toLocaleString('en-US', options);
  }

  formatDateToFriendlyDate = (
    date: Date | string | null | undefined,
  ): string => {
    if (!date) return '';

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return new Date(date).toLocaleString('en-US', options);
  };

  formatVehicleToFriendly = (vehicle: any): string => {
    if (!vehicle) return '';

    const brandName = vehicle.brand?.brand ?? '';
    const modelName = vehicle.model?.model ?? '';
    const year = vehicle.year ?? '';

    return `${brandName} ${modelName} (${year})`.trim();
  };

  formatNumberToTenantCurrency = (
    amount: number | null | undefined,
    currency: string = 'USD',
  ): string => {
    if (amount == null) return '';

    try {
      const options: Intl.NumberFormatOptions = {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      };

      return new Intl.NumberFormat(undefined, options).format(amount);
    } catch (error) {
      this.logger.error(error, 'Invalid currency code:', { currency });
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    }
  };

  async formatToTitleCase(str: string): Promise<string> {
    const smallWords = [
      'and',
      'or',
      'of',
      'the',
      'a',
      'an',
      'in',
      'on',
      'at',
      'for',
    ];

    return str
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (index === 0 || !smallWords.includes(word)) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        } else {
          return word;
        }
      })
      .join(' ');
  }

  async formatToUpperCase(str: string): Promise<string> {
    return str.toUpperCase();
  }
}
