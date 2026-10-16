import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { createI18nMock } from '../common/testing/i18n.mock';
import { createUpdateQueryBuilderMock } from '../common/testing/query-builder.mock';
import { Tour } from '../tours/tour.entity';
import { BookingTransitionService } from './booking-transition.service';
import { Booking } from './booking.entity';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

describe('BookingsService.create', () => {
  let service: BookingsService;
  const toursRepository = { findOne: jest.fn() };
  const bookingsRepository = { findOne: jest.fn() };
  const manager = {
    createQueryBuilder: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn((_entity: unknown, data: object) => data),
    save: jest.fn((data: object) => Promise.resolve({ id: 42, ...data })),
  };
  const tour = {
    id: 3,
    price: 1_000_000,
    duration: 3,
    startDate: '2026-11-01',
    endDate: '2026-11-10',
  };
  const dto: CreateBookingDto = {
    tourId: 3,
    startDate: '2026-11-02',
    numberOfAdults: 2,
    numberOfChildren: 1,
  };

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T00:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: bookingsRepository },
        { provide: getRepositoryToken(Tour), useValue: toursRepository },
        {
          provide: getDataSourceToken(),
          useValue: {
            transaction: (work: (m: typeof manager) => unknown) =>
              work(manager),
          },
        },
        { provide: BookingTransitionService, useValue: {} },
        { provide: I18nService, useValue: createI18nMock() },
      ],
    }).compile();
    service = moduleRef.get(BookingsService);
    toursRepository.findOne.mockResolvedValue(tour);
    bookingsRepository.findOne.mockResolvedValue({ id: 42 });
  });

  it('rejects an unknown tour on the tourId field', async () => {
    toursRepository.findOne.mockResolvedValue(null);

    await expect(service.create(7, dto)).rejects.toMatchObject({
      response: { errors: { tourId: ['bookings.tour_not_found'] } },
    });
  });

  it.each([
    ['before the tour window', '2026-10-31'],
    ['too late to fit the duration', '2026-11-09'],
  ])('rejects a start date %s', async (_case, startDate) => {
    await expect(
      service.create(7, { ...dto, startDate }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(manager.createQueryBuilder).not.toHaveBeenCalled();
  });

  it('rejects a start date in the past even if inside the tour window', async () => {
    toursRepository.findOne.mockResolvedValue({
      ...tour,
      startDate: '2026-10-01',
    });

    await expect(
      service.create(7, { ...dto, startDate: '2026-10-13' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('throws Conflict with the remaining slots when the tour is full', async () => {
    manager.createQueryBuilder.mockReturnValue(createUpdateQueryBuilderMock(0));
    manager.findOneOrFail.mockResolvedValue({ id: 3, availableSlot: 2 });

    await expect(service.create(7, dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('reserves adults + children slots and saves the computed total price', async () => {
    const qb = createUpdateQueryBuilderMock(1);
    manager.createQueryBuilder.mockReturnValue(qb);

    await service.create(7, dto);

    expect(qb.setParameters).toHaveBeenCalledWith({ slots: 3 });
    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, totalPrice: 2_500_000 }),
    );
    expect(bookingsRepository.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42, userId: 7 } }),
    );
  });
});
