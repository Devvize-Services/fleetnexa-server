import { PartialType } from '@nestjs/swagger';
import { CreatePermissionDto } from './create-permission.dto.js';
import { IsUUID } from 'class-validator';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @IsUUID()
  id: string;
}
