import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateBookingDto {
  @ApiProperty({ example: 12 })
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  tourId: number;

  @ApiProperty({ example: '2026-11-01' })
  @IsDateString(
    { strict: true },
    { message: i18nValidationMessage('validation.is_date') },
  )
  startDate: string;

  @ApiProperty({ example: 2 })
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  numberOfAdults: number;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  numberOfChildren: number = 0;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  note?: string;
}
