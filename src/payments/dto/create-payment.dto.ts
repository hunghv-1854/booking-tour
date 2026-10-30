import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreatePaymentDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  bookingId: number;
}
