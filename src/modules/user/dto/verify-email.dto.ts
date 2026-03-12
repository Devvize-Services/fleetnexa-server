import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @Length(6, 6, {
    message: 'Verification code must be exactly 6 characters long',
  })
  verificationCode: string;

  @IsString()
  @IsEmail()
  email: string;
}
