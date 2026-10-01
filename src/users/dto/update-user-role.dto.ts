import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { UserRole } from '../user-role.enum';
import { UserStatus } from '../user-status.enum';

export class UpdateUserRoleDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.is_enum') })
  role?: UserRole;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus, { message: i18nValidationMessage('validation.is_enum') })
  status?: UserStatus;
}
