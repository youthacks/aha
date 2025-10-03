import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateStationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  price: number;
}

export class PurchaseDto {
  @IsString()
  @IsNotEmpty()
  stationId: string;
}

