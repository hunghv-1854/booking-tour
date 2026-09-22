import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { UserRole } from '../user.entity';

export class ListUsersQueryDto {
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

  @ApiPropertyOptional({
    type: String,
    description: 'Search theo email hoặc fullName',
  })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  keyword?: string;

  @ApiPropertyOptional({ type: String, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.is_string') })
  role?: UserRole;
}
