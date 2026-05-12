import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class SubscriptionPlanFeatureDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsString()
  feature: string;
}

export class SubscriptionPlanCategoryDto {
  @IsUUID()
  id: string;
}

export class SubscriptionPlanDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsString()
  planId: string;

  @IsString()
  planCode: string;

  @IsNumber()
  price: number;

  @IsNumber()
  users: number;

  @IsNumber()
  vehicles: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  categories: SubscriptionPlanCategoryDto[];

  @IsArray()
  features: SubscriptionPlanFeatureDto[];
}
