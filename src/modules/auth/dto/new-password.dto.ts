import { IsEmail, IsEnum, IsString, Max, Min } from 'class-validator';
import { UserType } from '../../../generated/prisma/enums.js';

export class NewPasswordDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserType)
  userType: UserType;
}
