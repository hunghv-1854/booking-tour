import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { TourSortBy } from '../tour-sort-by.enum';
import { ToursFilterQueryDto } from './tours-filter-query.dto';

export class ListToursQueryDto extends ToursFilterQueryDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  location?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: i18nValidationMessage('validation.is_number') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  minPrice?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: i18nValidationMessage('validation.is_number') })
  @Min(0, { message: i18nValidationMessage('validation.min') })
  maxPrice?: number;

  @ApiPropertyOptional({
    type: String,
    enum: TourSortBy,
    default: TourSortBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(TourSortBy, { message: i18nValidationMessage('validation.is_enum') })
  sortBy: TourSortBy = TourSortBy.NEWEST;
}
