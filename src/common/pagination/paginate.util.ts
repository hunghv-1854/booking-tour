import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationQueryDto } from './pagination-query.dto';
import { Paginated } from './pagination.interface';

/** Applies page/limit to an already filtered and ordered query builder, fetching rows and total in one call. */
export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  { page, limit }: PaginationQueryDto,
): Promise<Paginated<T>> {
  const [data, total] = await qb
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return { data, meta: { page, limit, total } };
}
