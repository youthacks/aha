import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateOAuthDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  youthacksId?: string;
}
