import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LoginDto {
  @ApiProperty({ example: 'an@example.com' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.is_not_empty') })
  @IsEmail({}, { message: i18nValidationMessage('validation.is_email') })
  email: string;

  @ApiProperty({ example: 'Aa@123456' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.is_not_empty') })
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  password: string;
}
