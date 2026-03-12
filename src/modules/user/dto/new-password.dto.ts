import { IsEmail, IsString, Max, Min } from 'class-validator';

export class NewPasswordDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
