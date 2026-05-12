import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
} from 'class-validator';

export class VehicleFeatureDto {
  @IsUUID()
  id: string;

  @IsString()
  feature: string;
}

export class VehicleDiscountDto {
  @IsUUID()
  id: string;

  @IsNumber()
  period: number;

  @IsString()
  periodPolicy: string;

  @IsNumber()
  amount: number;

  @IsString()
  discountPolicy: string;
}

export class VehicleDto {
  @IsUUID()
  id: string;

  @IsString()
  color: string;

  @IsNumber()
  engineVolume: number;

  @IsString()
  featuredImage: string;

  @IsArray()
  features: VehicleFeatureDto[];

  @IsNumber()
  fuelLevel: number;

  @IsArray()
  images: string[];

  @IsString()
  licensePlate: string;

  @IsUUID()
  brandId: string;

  @IsUUID()
  modelId: string;

  @IsNumber()
  numberOfSeats: number;

  @IsNumber()
  numberOfDoors: number;

  @IsNumber()
  odometer: number;

  @IsString()
  steering: string;

  @IsString()
  @IsOptional()
  vin?: string;

  @IsNumber()
  year: number;

  @IsUUID()
  transmissionId: string;

  @IsUUID()
  vehicleStatusId: string;

  @IsUUID()
  wheelDriveId: string;

  @IsUUID()
  fuelTypeId: string;

  @IsUUID()
  fuelPolicyId: string;

  @IsUUID()
  locationId: string;

  @IsNumber()
  dayPrice: number;

  @IsNumber()
  weekPrice: number;

  @IsNumber()
  monthPrice: number;

  @IsNumber()
  timeBetweenRentals: number;

  @IsNumber()
  minimumAge: number;

  @IsNumber()
  minimumRental: number;

  @IsNumber()
  drivingExperience: number;

  @IsArray()
  @IsOptional()
  discounts?: VehicleDiscountDto[];
}
