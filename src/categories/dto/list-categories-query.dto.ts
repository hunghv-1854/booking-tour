import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { CATEGORIES_MAX_LIMIT } from '../categories.constants';

export class ListCategoriesQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  page = 1;

  @ApiPropertyOptional({
    type: Number,
    default: 10,
    maximum: CATEGORIES_MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  @Max(CATEGORIES_MAX_LIMIT, {
    message: i18nValidationMessage('validation.max'),
  })
  limit = 10;

  @ApiPropertyOptional({ type: String, description: 'Search by name' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  keyword?: string;
}
