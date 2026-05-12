import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SwapVehicleDto } from '../dto/swap-vehicle.dto.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { VehicleEventService } from '../../../modules/vehicle/modules/vehicle-event/vehicle-event.service.js';
import {
  Tenant,
  User,
  VehicleEventType,
} from '../../../generated/prisma/client.js';
import { VehicleStatusService } from './vehicle-status.service.js';
import { BookingRepository } from '../../../modules/booking/booking.repository.js';
import { VehicleEventDto } from '../dto/vehicle-event.dto.js';

@Injectable()
export class VehicleBookingService {
  private readonly logger = new Logger(VehicleBookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicleEvent: VehicleEventService,
    private readonly bookingRepo: BookingRepository,
    private readonly vehicleStatus: VehicleStatusService,
  ) {}

  async swapBookingVehicle(data: SwapVehicleDto, tenant: Tenant, user: User) {
    try {
      const existingBooking = await this.prisma.rental.findUnique({
        where: { id: data.bookingId },
        include: { vehicle: true },
      });

      if (!existingBooking) {
        this.logger.warn(
          `Booking with id ${data.bookingId} not found for swap`,
        );
        throw new NotFoundException('Booking not found');
      }

      if (existingBooking.vehicleId !== data.oldVehicleId) {
        this.logger.warn(
          `Old vehicle id ${data.oldVehicleId} does not match booking's current vehicle id ${existingBooking.vehicleId}`,
        );
        throw new BadRequestException(
          "Old vehicle does not match the booking's current vehicle",
        );
      }

      const newVehicle = await this.prisma.vehicle.findUnique({
        where: { id: data.newVehicleId, tenantId: tenant.id },
      });

      if (!newVehicle) {
        this.logger.warn(
          `New vehicle with id ${data.newVehicleId} not found for swap`,
        );
        throw new NotFoundException('New vehicle not found');
      }

      await this.prisma.rental.update({
        where: { id: data.bookingId },
        data: {
          vehicleId: data.newVehicleId,
          updatedAt: new Date(),
        },
      });

      await this.vehicleStatus.updateVehicleStatus(
        {
          vehicleId: data.oldVehicleId,
          status: 'AVAILABLE',
        },
        tenant,
        user,
      );

      await this.vehicleStatus.updateVehicleStatus(
        {
          vehicleId: data.newVehicleId,
          status: 'RENTED',
        },
        tenant,
        user,
      );

      await this.prisma.bookingVehicleHistory.create({
        data: {
          bookingId: data.bookingId,
          fromVehicleId: data.oldVehicleId,
          toVehicleId: data.newVehicleId,
          reason: data.reason || '',
          swappedAt: new Date(),
          swappedBy: user.username,
        },
      });

      const vehicleOutEvent: VehicleEventDto = {
        vehicleId: data.oldVehicleId,
        event: `Vehicle swapped out from booking #${existingBooking!.rentalNumber}`,
        type: VehicleEventType.SWAPPED_OUT,
        date: new Date().toISOString(),
        notes: `Vehicle Swapped Out for #${existingBooking!.rentalNumber}  by ${user.username}`,
      };

      const vehicleInEvent: VehicleEventDto = {
        vehicleId: data.newVehicleId,
        event: `Vehicle swapped in for booking #${existingBooking!.rentalNumber}`,
        type: VehicleEventType.SWAPPED_IN,
        date: new Date().toISOString(),
        notes: `Vehicle Swapped In for #${existingBooking!.rentalNumber} by ${user.username}`,
      };

      await this.vehicleEvent.createEvent(vehicleOutEvent);
      await this.vehicleEvent.createEvent(vehicleInEvent);

      const bookings = await this.bookingRepo.getBookings(tenant.id);

      return {
        message: 'Vehicle swapped successfully',
        bookings,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to swap booking vehicle', {
        tenantId: tenant.id,
        tenantCode: tenant.tenantCode,
        data,
      });
      throw error;
    }
  }
}
