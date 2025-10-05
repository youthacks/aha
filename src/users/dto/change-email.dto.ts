import { IsEmail, IsNotEmpty } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;
}

export class VerifyEmailChangeDto {
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;

  @IsNotEmpty()
  token: string;
}

