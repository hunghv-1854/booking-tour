import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { Attachment } from '../attachments/attachment.entity';
import { AttachableType } from '../attachments/attachable-type.enum';
import { paginate } from '../common/pagination/paginate.util';
import { selectColumns } from '../common/query/select-columns.util';
import { Paginated } from '../common/pagination/pagination.interface';
import { Review } from '../reviews/review.entity';
import { ListToursQueryDto } from './dto/list-tours-query.dto';
import { SearchToursQueryDto } from './dto/search-tours-query.dto';
import { Tour } from './tour.entity';
import {
  EMPTY_RATING,
  RATING_DECIMAL_PLACES,
  TOUR_DETAIL_SELECT,
  TOUR_LIST_SELECT,
  TOUR_SEARCH_SELECT,
  TOUR_SORT_ORDER,
} from './tours.constants';
import {
  TourDetail,
  TourListItem,
  TourRating,
  TourSearchItem,
} from './tours.interface';
import { toTourDetail, toTourListItem } from './tours.mapper';
import { applyToursFilter } from './tours-query.util';
import { assertDateRange, assertPriceRange } from './tours-validation.util';

@Injectable()
export class ToursService {
  constructor(
    @InjectRepository(Tour)
    private readonly toursRepository: Repository<Tour>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,
    private readonly i18n: I18nService,
  ) {}

  async findAll(query: ListToursQueryDto): Promise<Paginated<TourListItem>> {
    assertPriceRange(this.i18n, query.minPrice, query.maxPrice);

    const qb = applyToursFilter(
      this.toursRepository
        .createQueryBuilder('tour')
        .select(selectColumns('tour', TOUR_LIST_SELECT)),
      query,
    );
    if (query.location) {
      qb.andWhere('tour.location ILIKE :location', {
        location: `%${query.location}%`,
      });
    }
    if (query.minPrice !== undefined) {
      qb.andWhere('tour.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      qb.andWhere('tour.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    const { column, direction } = TOUR_SORT_ORDER[query.sortBy];
    const page = await paginate(
      qb.orderBy(column, direction).addOrderBy('tour.id', 'ASC'),
      query,
    );
    return this.withListExtras(page, (tour, thumbnail, rating) =>
      toTourListItem(tour, thumbnail, rating),
    );
  }

  async search(query: SearchToursQueryDto): Promise<Paginated<TourSearchItem>> {
    assertDateRange(this.i18n, query.startDate, query.endDate);

    const qb = applyToursFilter(
      this.toursRepository
        .createQueryBuilder('tour')
        .select(selectColumns('tour', TOUR_SEARCH_SELECT))
        .where('tour.startDate >= :startDate', { startDate: query.startDate })
        .andWhere('tour.endDate <= :endDate', { endDate: query.endDate }),
      query,
    );

    const page = await paginate(
      qb.orderBy('tour.startDate', 'ASC').addOrderBy('tour.id', 'ASC'),
      query,
    );
    return this.withListExtras(page, (tour, thumbnail, rating) => ({
      ...toTourListItem(tour, thumbnail, rating),
      startDate: tour.startDate,
      endDate: tour.endDate,
    }));
  }

  async findDetail(id: number): Promise<TourDetail> {
    const tour = await this.toursRepository.findOne({
      where: { id },
      relations: { category: true, itineraries: true },
      select: TOUR_DETAIL_SELECT,
      order: { itineraries: { dayNumber: 'ASC' } },
    });
    if (!tour) {
      throw new NotFoundException(this.i18n.t('tours.not_found'));
    }

    const [images, ratings] = await Promise.all([
      this.findImageUrls(id),
      this.findRatings([id]),
    ]);
    return toTourDetail(tour, images, ratings.get(id) ?? EMPTY_RATING);
  }

  private async withListExtras<T>(
    page: Paginated<Tour>,
    toItem: (tour: Tour, thumbnail: string | null, rating: TourRating) => T,
  ): Promise<Paginated<T>> {
    const ids = page.data.map((tour) => tour.id);
    const [thumbnails, ratings] = await Promise.all([
      this.findThumbnails(ids),
      this.findRatings(ids),
    ]);

    return {
      data: page.data.map((tour) =>
        toItem(
          tour,
          thumbnails.get(tour.id) ?? null,
          ratings.get(tour.id) ?? EMPTY_RATING,
        ),
      ),
      meta: page.meta,
    };
  }

  private async findRatings(ids: number[]): Promise<Map<number, TourRating>> {
    if (!ids.length) return new Map();

    const rows = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('review.tourId', 'tourId')
      .addSelect('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(*)', 'reviewCount')
      .where('review.tourId IN (:...ids)', { ids })
      .groupBy('review.tourId')
      .getRawMany<{ tourId: number; avgRating: string; reviewCount: string }>();

    return new Map(
      rows.map((row) => [
        row.tourId,
        {
          avgRating: Number(
            Number(row.avgRating).toFixed(RATING_DECIMAL_PLACES),
          ),
          reviewCount: Number(row.reviewCount),
        },
      ]),
    );
  }

  private async findThumbnails(ids: number[]): Promise<Map<number, string>> {
    if (!ids.length) return new Map();

    const rows = await this.attachmentsRepository
      .createQueryBuilder('attachment')
      .select('attachment.attachableId', 'tourId')
      .addSelect('attachment.url', 'url')
      .distinctOn(['attachment.attachable_id'])
      .where('attachment.attachableType = :type', {
        type: AttachableType.TOUR_IMAGE,
      })
      .andWhere('attachment.attachableId IN (:...ids)', { ids })
      .orderBy('attachment.attachable_id')
      .addOrderBy('attachment.createdAt', 'ASC')
      .getRawMany<{ tourId: number; url: string }>();

    return new Map(rows.map((row) => [row.tourId, row.url]));
  }

  private async findImageUrls(id: number): Promise<string[]> {
    const images = await this.attachmentsRepository.find({
      where: { attachableType: AttachableType.TOUR_IMAGE, attachableId: id },
      select: { url: true },
      order: { createdAt: 'ASC' },
    });
    return images.map((image) => image.url);
  }
}
