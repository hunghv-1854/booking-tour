import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { UserRole } from '../user-role.enum';

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Search by email or fullName',
  })
  declare keyword?: string;

  @ApiPropertyOptional({ type: String, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.is_enum') })
  role?: UserRole;
}
