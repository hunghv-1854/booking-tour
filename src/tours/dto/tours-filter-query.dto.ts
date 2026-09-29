import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class ToursFilterQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: String, description: 'Search by name' })
  declare keyword?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  categoryId?: number;
}
