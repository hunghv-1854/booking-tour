import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { In, Repository } from 'typeorm';
import { Attachment } from '../attachments/attachment.entity';
import { AttachableType } from '../attachments/attachable-type.enum';
import { BookingStatus } from '../bookings/booking-status.enum';
import { Booking } from '../bookings/booking.entity';
import { paginate } from '../common/pagination/paginate.util';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { Paginated } from '../common/pagination/pagination.interface';
import { isUniqueViolation } from '../common/postgres-error.util';
import { Tour } from '../tours/tour.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './review.entity';
import {
  REVIEW_AVATAR_SELECT,
  TOUR_REVIEW_LIST_COLUMNS,
} from './reviews.constants';
import { CreatedReview, TourReviewItem } from './reviews.interface';
import { toCreatedReview, toTourReviewItem } from './reviews.mapper';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(Tour)
    private readonly toursRepository: Repository<Tour>,
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,
    private readonly i18n: I18nService,
  ) {}

  async findByTour(
    tourId: number,
    query: PaginationQueryDto,
  ): Promise<Paginated<TourReviewItem>> {
    const tourExists = await this.toursRepository.exists({
      where: { id: tourId },
    });
    if (!tourExists) {
      throw new NotFoundException(this.i18n.t('reviews.tour_not_found'));
    }

    const page = await paginate(
      this.reviewsRepository
        .createQueryBuilder('review')
        .innerJoin('review.user', 'user')
        .select(TOUR_REVIEW_LIST_COLUMNS)
        .where('review.tourId = :tourId', { tourId })
        .orderBy('review.id', 'DESC'),
      query,
    );
    const avatars = await this.findAvatars(
      page.data.map((review) => review.user.id),
    );

    return {
      data: page.data.map((review) =>
        toTourReviewItem(review, avatars.get(review.user.id) ?? null),
      ),
      meta: page.meta,
    };
  }

  async create(
    userId: number,
    tourId: number,
    dto: CreateReviewDto,
  ): Promise<CreatedReview> {
    const booking = await this.bookingsRepository
      .createQueryBuilder('booking')
      .select('booking.id')
      .leftJoin(Review, 'review', 'review.bookingId = booking.id')
      .where('booking.userId = :userId', { userId })
      .andWhere('booking.tourId = :tourId', { tourId })
      .andWhere('booking.status = :status', {
        status: BookingStatus.COMPLETED,
      })
      .andWhere('review.id IS NULL')
      .orderBy('booking.id', 'ASC')
      .getOne();
    if (!booking) {
      throw new ForbiddenException(this.i18n.t('reviews.not_eligible'));
    }

    try {
      const review = await this.reviewsRepository.save(
        this.reviewsRepository.create({
          ...dto,
          userId,
          tourId,
          bookingId: booking.id,
        }),
      );
      return toCreatedReview(review);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(this.i18n.t('reviews.already_reviewed'));
      }
      throw error;
    }
  }

  private async findAvatars(userIds: number[]): Promise<Map<number, string>> {
    if (!userIds.length) return new Map();

    const avatars = await this.attachmentsRepository.find({
      where: {
        attachableType: AttachableType.USER_AVATAR,
        attachableId: In(userIds),
      },
      select: REVIEW_AVATAR_SELECT,
    });
    return new Map(avatars.map((avatar) => [avatar.attachableId, avatar.url]));
  }
}
