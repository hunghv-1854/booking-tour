import { SelectQueryBuilder } from 'typeorm';
import { ToursFilterQueryDto } from './dto/tours-filter-query.dto';
import { Tour } from './tour.entity';

export function applyToursFilter(
  qb: SelectQueryBuilder<Tour>,
  { keyword, categoryId }: ToursFilterQueryDto,
): SelectQueryBuilder<Tour> {
  if (keyword) {
    qb.andWhere('tour.name ILIKE :keyword', { keyword: `%${keyword}%` });
  }
  if (categoryId) {
    qb.andWhere('tour.categoryId = :categoryId', { categoryId });
  }
  return qb;
}
