import { IsNotEmpty, MinLength } from 'class-validator';

export class RequestPasswordChangeDto {
  @IsNotEmpty()
  currentPassword: string;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  token: string;

  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}

