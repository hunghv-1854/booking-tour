import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { ToursFilterQueryDto } from './tours-filter-query.dto';

export class SearchToursQueryDto extends ToursFilterQueryDto {
  @ApiProperty({ type: String, example: '2026-11-01' })
  @IsDateString(
    { strict: true },
    { message: i18nValidationMessage('validation.is_date') },
  )
  startDate: string;

  @ApiProperty({ type: String, example: '2026-11-30' })
  @IsDateString(
    { strict: true },
    { message: i18nValidationMessage('validation.is_date') },
  )
  endDate: string;
}
