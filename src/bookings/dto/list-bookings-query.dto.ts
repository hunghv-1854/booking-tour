import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { BookingStatus } from '../booking-status.enum';

export class ListBookingsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: String, description: 'Search by tour name' })
  declare keyword?: string;

  @ApiPropertyOptional({ type: String, enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus, {
    message: i18nValidationMessage('validation.is_enum'),
  })
  status?: BookingStatus;
}
