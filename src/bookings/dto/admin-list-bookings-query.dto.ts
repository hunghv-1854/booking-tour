import { ApiPropertyOptional } from '@nestjs/swagger';
import { ListBookingsQueryDto } from './list-bookings-query.dto';

export class AdminListBookingsQueryDto extends ListBookingsQueryDto {
  @ApiPropertyOptional({
    type: String,
    description: 'Search by tour name or user email',
  })
  declare keyword?: string;
}
