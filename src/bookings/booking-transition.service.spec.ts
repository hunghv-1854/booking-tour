import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { createI18nMock } from '../common/testing/i18n.mock';
import { Tour } from '../tours/tour.entity';
import { BookingStatus } from './booking-status.enum';
import { BookingTransitionService } from './booking-transition.service';
import { Booking } from './booking.entity';

describe('BookingTransitionService', () => {
  let service: BookingTransitionService;
  const manager = {
    findOne: jest.fn(),
    update: jest.fn(),
    increment: jest.fn(),
  };
  const pendingBooking = {
    id: 1,
    userId: 7,
    tourId: 3,
    status: BookingStatus.PENDING,
    startDate: '2099-01-10',
    numberOfAdults: 2,
    numberOfChildren: 1,
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingTransitionService,
        {
          provide: getDataSourceToken(),
          useValue: {
            transaction: (work: (m: typeof manager) => unknown) =>
              work(manager),
          },
        },
        { provide: I18nService, useValue: createI18nMock() },
      ],
    }).compile();
    service = moduleRef.get(BookingTransitionService);
  });

  it('locks the booking scoped to its owner when ownerId is given', async () => {
    manager.findOne.mockResolvedValue(pendingBooking);

    await service.fromPending(1, BookingStatus.CANCELLED, { ownerId: 7 });

    expect(manager.findOne).toHaveBeenCalledWith(
      Booking,
      expect.objectContaining({
        where: { id: 1, userId: 7 },
        lock: { mode: 'pessimistic_write' },
      }),
    );
  });

  it('throws NotFound when the booking does not exist or is not owned', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(
      service.fromPending(1, BookingStatus.CANCELLED, { ownerId: 99 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(manager.update).not.toHaveBeenCalled();
  });

  it('throws Conflict when the booking is no longer pending', async () => {
    manager.findOne.mockResolvedValue({
      ...pendingBooking,
      status: BookingStatus.APPROVED,
    });

    await expect(
      service.fromPending(1, BookingStatus.REJECTED),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(manager.update).not.toHaveBeenCalled();
  });

  it('approves with a payment deadline and without releasing slots', async () => {
    manager.findOne.mockResolvedValue(pendingBooking);

    const result = await service.fromPending(1, BookingStatus.APPROVED);

    expect(result).toEqual({ id: 1, status: BookingStatus.APPROVED });
    expect(manager.update).toHaveBeenCalledWith(Booking, 1, {
      status: BookingStatus.APPROVED,
      paymentDueAt: expect.any(Date) as Date,
    });
    expect(manager.increment).not.toHaveBeenCalled();
  });

  it('refuses to approve once the departure day has come', async () => {
    manager.findOne.mockResolvedValue({
      ...pendingBooking,
      startDate: '2000-01-01',
    });

    await expect(
      service.fromPending(1, BookingStatus.APPROVED),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(manager.update).not.toHaveBeenCalled();
  });

  it.each([BookingStatus.CANCELLED, BookingStatus.REJECTED])(
    'releases adults + children slots when %s',
    async (status) => {
      manager.findOne.mockResolvedValue(pendingBooking);

      await service.fromPending(1, status);

      expect(manager.increment).toHaveBeenCalledWith(
        Tour,
        { id: 3 },
        'availableSlot',
        3,
      );
    },
  );

  it('stores the reject reason', async () => {
    manager.findOne.mockResolvedValue(pendingBooking);

    await service.fromPending(1, BookingStatus.REJECTED, {
      rejectReason: 'Fully booked',
    });

    expect(manager.update).toHaveBeenCalledWith(Booking, 1, {
      status: BookingStatus.REJECTED,
      rejectReason: 'Fully booked',
    });
  });
});
