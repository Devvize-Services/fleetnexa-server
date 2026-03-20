import { PartialType } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreatePermissionCategoryDto {
  @IsString()
  category: string;

  @IsString()
  description: string;
}

export class UpdatePermissionCategoryDto extends PartialType(
  CreatePermissionCategoryDto,
) {
  @IsUUID()
  id: string;
}
