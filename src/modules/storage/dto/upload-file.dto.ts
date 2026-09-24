import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @IsString()
  @IsOptional()
  fileName?: string;

  @IsString()
  folderPath: string;
}
