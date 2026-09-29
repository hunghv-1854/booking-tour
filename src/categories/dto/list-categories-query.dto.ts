import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

export class ListCategoriesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ type: String, description: 'Search by name' })
  declare keyword?: string;
}
