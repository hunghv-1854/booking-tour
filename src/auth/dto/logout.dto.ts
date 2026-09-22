import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Refresh token to revoke as well (optional)',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  refreshToken?: string;
}
