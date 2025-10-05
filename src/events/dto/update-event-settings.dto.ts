import { IsNotEmpty, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class UpdateEventSettingsDto {
  @IsOptional()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @MinLength(5, { message: 'Join code must be exactly 5 characters long' })
  @MaxLength(5, { message: 'Join code must be exactly 5 characters long' })
  @Matches(/^[A-Z0-9]+$/, { message: 'Join code must contain only uppercase letters (A-Z) and numbers (0-9)' })
  joinCode?: string;

  @IsOptional()
  description?: string;
}
