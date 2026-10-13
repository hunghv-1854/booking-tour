import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { paginate } from '../common/pagination/paginate.util';
import { Paginated } from '../common/pagination/pagination.interface';
import { AdminListReviewsQueryDto } from './dto/admin-list-reviews-query.dto';
import { Review } from './review.entity';
import { ADMIN_REVIEW_LIST_COLUMNS } from './reviews.constants';

@Injectable()
export class AdminReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    private readonly i18n: I18nService,
  ) {}

  findAll(query: AdminListReviewsQueryDto): Promise<Paginated<Review>> {
    const qb = this.reviewsRepository
      .createQueryBuilder('review')
      .innerJoin('review.tour', 'tour')
      .innerJoin('review.user', 'user')
      .select(ADMIN_REVIEW_LIST_COLUMNS)
      .withDeleted();

    if (query.tourId) {
      qb.andWhere('review.tourId = :tourId', { tourId: query.tourId });
    }
    if (query.rating) {
      qb.andWhere('review.rating = :rating', { rating: query.rating });
    }
    if (query.keyword) {
      qb.andWhere('review.comment ILIKE :keyword', {
        keyword: `%${query.keyword}%`,
      });
    }
    return paginate(qb.orderBy('review.id', 'DESC'), query);
  }

  async remove(id: number): Promise<void> {
    const result = await this.reviewsRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(this.i18n.t('reviews.not_found'));
    }
  }
}
