import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { StorefrontUserDto } from './storefront-user.dto.js';
import { ChangePasswordDto } from '../dto/change-password.dto.js';
import bcrypt from 'bcrypt';
import { DeleteUserDto } from '../dto/delete-user.dto.js';

@Injectable()
export class StorefrontUserService {
  private readonly logger = new Logger(StorefrontUserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCurrentUser(userId: string) {
    try {
      const user = await this.prisma.storefrontUser.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          email: true,
          profilePicture: true,
          driverLicenseNumber: true,
          licenseExpiry: true,
          licenseIssued: true,
          license: true,
          country: true,
          countryId: true,
          street: true,
          village: true,
          villageId: true,
          state: true,
          stateId: true,
          phone: true,
          dateOfBirth: true,
        },
      });

      if (!user) {
        this.logger.warn(`Storefront user with ID ${userId} not found`);
        throw new NotFoundException('Storefront user not found');
      }

      const userData = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        initials: `${user.firstName[0]}${user.lastName[0]}`,
        fullName: `${user.firstName} ${user.lastName}`,
        createdAt: user.createdAt,
        email: user.email,
        profilePicture: user.profilePicture || null,
        driverLicenseNumber: user.driverLicenseNumber,
        licenseExpiry: user.licenseExpiry,
        licenseIssued: user.licenseIssued,
        license: user.license,
        country: user.country?.country,
        countryId: user.countryId,
        street: user.street,
        village: user.village?.village,
        villageId: user.villageId,
        state: user.state?.state,
        stateId: user.stateId,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
      };

      return userData;
    } catch (error) {
      this.logger.error(error, 'Error fetching current storefront user', {
        userId,
      });
      throw error;
    }
  }

  async updateUser(data: StorefrontUserDto, userId: string) {
    try {
      const existingUser = await this.prisma.storefrontUser.findUnique({
        where: { id: data.id },
      });

      if (!existingUser) {
        this.logger.warn(`Storefront user with ID ${data.id} not found`);
        throw new NotFoundException('Storefront user not found');
      }

      if (existingUser.id !== userId) {
        this.logger.warn(
          `Unauthorized update attempt by user ${userId} on user ${data.id}`,
        );
        throw new UnauthorizedException('Unauthorized to update this user');
      }

      const updatedUser = await this.prisma.storefrontUser.update({
        where: { id: data.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          street: data.street || null,
          countryId: data.countryId || null,
          stateId: data.stateId || null,
          villageId: data.villageId || null,
          driverLicenseNumber: data.licenseNumber,
          licenseExpiry: data.licenseExpiry,
          licenseIssued: data.licenseIssued,
          license: data.license,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          email: true,
          profilePicture: true,
          driverLicenseNumber: true,
          dateOfBirth: true,
          licenseExpiry: true,
          licenseIssued: true,
          country: true,
          countryId: true,
          street: true,
          village: true,
          villageId: true,
          state: true,
          stateId: true,
          phone: true,
        },
      });

      const userData = {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        initials: `${updatedUser.firstName[0]}${updatedUser.lastName[0]}`,
        fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
        createdAt: updatedUser.createdAt,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture || null,
        driverLicenseNumber: updatedUser.driverLicenseNumber,
        licenseExpiry: updatedUser.licenseExpiry,
        licenseIssued: updatedUser.licenseIssued,
        country: updatedUser.country?.country,
        countryId: updatedUser.countryId,
        street: updatedUser.street,
        village: updatedUser.village?.village,
        villageId: updatedUser.villageId,
        state: updatedUser.state?.state,
        stateId: updatedUser.stateId,
        phone: updatedUser.phone,
        dateOfBirth: updatedUser.dateOfBirth,
      };

      return {
        message: 'User updated successfully',
        user: userData,
      };
    } catch (error) {
      this.logger.error(error, 'Error during authorization check', {
        userId,
        dataId: data.id,
      });
      throw error;
    }
  }

  async updatePassword(data: ChangePasswordDto, userId: string) {
    try {
      const existingUser = await this.prisma.storefrontUser.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        this.logger.warn(`Storefront user with ID ${userId} not found`);
        throw new NotFoundException('Storefront user not found');
      }

      const isMatch = await bcrypt.compare(
        data.currentPassword,
        existingUser.password,
      );

      if (!isMatch) {
        this.logger.warn(
          `Unauthorized password update attempt by user ${userId}`,
        );
        throw new UnauthorizedException('Current password is incorrect');
      }

      const samePassword = await bcrypt.compare(
        data.newPassword,
        existingUser.password,
      );

      if (samePassword) {
        this.logger.warn(
          `User ${userId} attempted to change to the same password`,
        );
        throw new ConflictException(
          'New password must be different from the current password',
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.newPassword, salt);

      await this.prisma.storefrontUser.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
        },
      });

      return { message: 'Password updated successfully' };
    } catch (error) {
      this.logger.error(error, 'Error updating storefront user password', {
        userId,
      });
      throw error;
    }
  }

  async deleteUser(data: DeleteUserDto, userId: string) {
    try {
      const existingUser = await this.prisma.storefrontUser.findUnique({
        where: { id: data.id },
      });

      if (!existingUser) {
        this.logger.warn(`Storefront user with ID ${userId} not found`);
        throw new NotFoundException('Storefront user not found');
      }

      if (existingUser.id !== userId) {
        this.logger.warn(
          `Unauthorized delete attempt by user ${userId} on user ${data.id}`,
        );
        throw new UnauthorizedException('Unauthorized to delete this user');
      }

      const isMatch = await bcrypt.compare(
        data.password,
        existingUser.password,
      );

      if (!isMatch) {
        this.logger.warn(`Incorrect password attempt by user ${userId}`);
        throw new UnauthorizedException('Incorrect credentials');
      }

      await this.prisma.storefrontUser.delete({
        where: { id: data.id },
      });

      return { message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(error, 'Error deleting storefront user', {
        userId,
        dataId: data.id,
      });
      throw error;
    }
  }
}
