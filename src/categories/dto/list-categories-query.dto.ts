import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ListCategoriesQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.is_string') })
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ type: Number, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.is_string') })
  @Min(1)
  limit = 10;

  @ApiPropertyOptional({ type: String, description: 'Search theo name' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  keyword?: string;
}
