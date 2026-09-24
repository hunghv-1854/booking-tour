import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn An' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  fullName?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  phone?: string;
}
