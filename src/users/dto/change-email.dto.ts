import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ChangeEmailDto {
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;
}
export class VerifyEmailChangeDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

