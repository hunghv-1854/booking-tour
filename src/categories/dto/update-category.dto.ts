import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  name?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  slug?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  description?: string;
}
