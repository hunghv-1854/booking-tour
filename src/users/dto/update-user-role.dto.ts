import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { UserRole, UserStatus } from '../user.entity';

export class UpdateUserRoleDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.is_string') })
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus, {
    message: i18nValidationMessage('validation.is_string'),
  })
  status?: UserStatus;
}
