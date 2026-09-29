import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Biển đảo' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.is_not_empty') })
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  name: string;

  @ApiProperty({ example: 'bien-dao' })
  @IsNotEmpty({ message: i18nValidationMessage('validation.is_not_empty') })
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  slug: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  description?: string;
}
