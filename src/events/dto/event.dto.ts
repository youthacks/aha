import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class JoinEventDto {
  @IsString()
  @MinLength(5)
  @MaxLength(5)
  code: string;
}

export class UpdateTokensDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  amount: number;
}

export class PromoteMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}

