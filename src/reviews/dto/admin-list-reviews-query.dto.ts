import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { MAX_RATING, MIN_RATING } from '../reviews.constants';

export class AdminListReviewsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: String, description: 'Search by comment' })
  declare keyword?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  tourId?: number;

  @ApiPropertyOptional({
    type: Number,
    minimum: MIN_RATING,
    maximum: MAX_RATING,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  @Min(MIN_RATING, { message: i18nValidationMessage('validation.min') })
  @Max(MAX_RATING, { message: i18nValidationMessage('validation.max') })
  rating?: number;
}
