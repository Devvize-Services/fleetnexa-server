import { IsNotEmpty, IsNumber, IsString, IsUUID } from 'class-validator';

export class VehicleDiscountDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsNumber()
  @IsNotEmpty()
  period: number;

  @IsString()
  @IsNotEmpty()
  periodPolicy: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  discountPolicy: string;
}
