import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { MAX_RATING, MIN_RATING } from '../reviews.constants';

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: MIN_RATING, maximum: MAX_RATING })
  @IsInt({ message: i18nValidationMessage('validation.is_int') })
  @Min(MIN_RATING, { message: i18nValidationMessage('validation.min') })
  @Max(MAX_RATING, { message: i18nValidationMessage('validation.max') })
  rating: number;

  @ApiPropertyOptional({ example: 'Rất đáng tiền' })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.is_string') })
  comment?: string;
}
