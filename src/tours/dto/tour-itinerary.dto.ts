import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class TourItineraryDto {
  @ApiProperty({ example: 1 })
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  dayNumber: number;

  @ApiProperty({ example: 'Khởi hành từ TP.HCM' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.is_not_empty') })
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  title: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  description?: string;
}
