import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Attachment } from '../attachments/attachment.entity';
import { BookingStatus } from '../bookings/booking-status.enum';
import { Booking } from '../bookings/booking.entity';
import { UNIQUE_VIOLATION } from '../common/postgres-error.constants';
import { createI18nMock } from '../common/testing/i18n.mock';
import { createSelectQueryBuilderMock } from '../common/testing/query-builder.mock';
import { Tour } from '../tours/tour.entity';
import { Review } from './review.entity';
import { ReviewsService } from './reviews.service';

describe('ReviewsService.create', () => {
  let service: ReviewsService;
  const reviewsRepository = {
    create: jest.fn((data: object) => data),
    save: jest.fn(),
  };
  const bookingsRepository = { createQueryBuilder: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: reviewsRepository },
        { provide: getRepositoryToken(Booking), useValue: bookingsRepository },
        { provide: getRepositoryToken(Tour), useValue: {} },
        { provide: getRepositoryToken(Attachment), useValue: {} },
        { provide: I18nService, useValue: createI18nMock() },
      ],
    }).compile();
    service = moduleRef.get(ReviewsService);
  });

  it('looks up a completed, not-yet-reviewed booking in a single query', async () => {
    const qb = createSelectQueryBuilderMock({ id: 11 });
    bookingsRepository.createQueryBuilder.mockReturnValue(qb);
    reviewsRepository.save.mockResolvedValue({
      id: 1,
      rating: 5,
      comment: 'ok',
      createdAt: new Date(),
    });

    await service.create(7, 3, { rating: 5, comment: 'ok' });

    expect(qb.getOne).toHaveBeenCalledTimes(1);
    expect(qb.andWhere).toHaveBeenCalledWith('booking.status = :status', {
      status: BookingStatus.COMPLETED,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('review.id IS NULL');
    expect(reviewsRepository.create).toHaveBeenCalledWith({
      rating: 5,
      comment: 'ok',
      userId: 7,
      tourId: 3,
      bookingId: 11,
    });
  });

  it('forbids reviewing without an eligible booking', async () => {
    bookingsRepository.createQueryBuilder.mockReturnValue(
      createSelectQueryBuilderMock(null),
    );

    await expect(service.create(7, 3, { rating: 5 })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(reviewsRepository.save).not.toHaveBeenCalled();
  });

  it('maps a concurrent duplicate review (unique violation) to Conflict', async () => {
    bookingsRepository.createQueryBuilder.mockReturnValue(
      createSelectQueryBuilderMock({ id: 11 }),
    );
    reviewsRepository.save.mockRejectedValue(
      Object.assign(new Error('duplicate'), { code: UNIQUE_VIOLATION }),
    );

    await expect(service.create(7, 3, { rating: 5 })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
