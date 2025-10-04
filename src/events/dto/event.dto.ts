import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
  @IsNotEmpty()
  slug: string;
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
