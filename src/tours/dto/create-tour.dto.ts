import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TourItineraryDto } from './tour-itinerary.dto';

export class CreateTourDto {
  @ApiProperty({ example: 2 })
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  categoryId: number;

  @ApiProperty({ example: 'Tour Phú Quốc 4N3Đ' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.is_not_empty') })
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  name: string;

  @ApiProperty({ example: 'tour-phu-quoc-4n3d' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.is_not_empty') })
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  slug: string;

  @ApiProperty({ example: 'Khám phá đảo ngọc Phú Quốc...' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.is_not_empty') })
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  description: string;

  @ApiProperty({ example: 4500000 })
  @IsNumber({}, { message: i18nValidationMessage('validation.is_number') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  price: number;

  @ApiProperty({ example: 4, description: 'Number of days' })
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  duration: number;

  @ApiProperty({ example: 'Phú Quốc' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.is_not_empty') })
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  location: string;

  @ApiProperty({ example: '2026-11-01' })
  @IsDateString(
    { strict: true },
    { message: i18nValidationMessage('validation.is_date') },
  )
  startDate: string;

  @ApiProperty({ example: '2026-11-04' })
  @IsDateString(
    { strict: true },
    { message: i18nValidationMessage('validation.is_date') },
  )
  endDate: string;

  @ApiProperty({ example: 15 })
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  maxSlot: number;

  @ApiPropertyOptional({ type: [TourItineraryDto] })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('validation.is_array') })
  @ValidateNested({ each: true })
  @Type(() => TourItineraryDto)
  itineraries?: TourItineraryDto[];
}
