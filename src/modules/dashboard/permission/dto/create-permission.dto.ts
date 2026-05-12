import { IsString, IsUUID } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsUUID()
  categoryId: string;
}
