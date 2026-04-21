import { IsEmail, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { OtpType, UserType } from '../../../generated/prisma/enums.js';

export class VerifyOTPDto {
  @IsString()
  @Length(6, 6, {
    message: 'Verification code must be exactly 6 characters long',
  })
  verificationCode: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsEnum(OtpType)
  @IsNotEmpty()
  type: OtpType;

  @IsEnum(UserType)
  @IsNotEmpty()
  userType: UserType;
}
