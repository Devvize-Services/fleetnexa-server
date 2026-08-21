import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ActivityAction, ActivityModule } from '../../generated/prisma/enums';

export class ActivityDto {
  @IsString()
  userId: string;

  @IsString()
  tenantId: string;

  @IsEnum(ActivityAction)
  action: ActivityAction;

  @IsEnum(ActivityModule)
  module: ActivityModule;

  @IsString()
  @IsOptional()
  entityType: string;

  @IsString()
  @IsOptional()
  entityId: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsOptional()
  oldValues?: Record<string, any>;

  @IsOptional()
  newValues?: Record<string, any>;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
