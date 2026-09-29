import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from './pagination.constants';

export class PaginationQueryDto {
  @ApiPropertyOptional({ type: Number, default: DEFAULT_PAGE, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  page: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    type: Number,
    default: DEFAULT_LIMIT,
    minimum: 1,
    maximum: MAX_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  @Min(1, { message: i18nValidationMessage('validation.min') })
  @Max(MAX_LIMIT, { message: i18nValidationMessage('validation.max') })
  limit: number = DEFAULT_LIMIT;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  keyword?: string;
}
