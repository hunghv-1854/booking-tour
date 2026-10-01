import { SelectQueryBuilder } from 'typeorm';
import { Booking } from './booking.entity';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';

export function applyBookingsFilter(
  qb: SelectQueryBuilder<Booking>,
  { status, keyword }: ListBookingsQueryDto,
  keywordColumns: string[] = ['tour.name'],
): SelectQueryBuilder<Booking> {
  if (status) {
    qb.andWhere('booking.status = :status', { status });
  }
  if (keyword) {
    qb.andWhere(
      `(${keywordColumns.map((column) => `${column} ILIKE :keyword`).join(' OR ')})`,
      { keyword: `%${keyword}%` },
    );
  }
  return qb;
}
