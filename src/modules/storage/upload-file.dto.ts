import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MediaType } from '../../generated/prisma/client';

export class UploadFileDto {
  @IsString()
  @IsOptional()
  fileName?: string;

  @IsEnum(MediaType)
  type: MediaType;

  @IsString()
  @IsOptional()
  altText?: string;

  @IsString()
  @IsOptional()
  caption?: string;
}
