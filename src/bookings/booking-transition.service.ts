import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { DataSource } from 'typeorm';
import { Tour } from '../tours/tour.entity';
import { BookingStatus } from './booking-status.enum';
import {
  BookingStatusChange,
  BookingTransitionOptions,
} from './booking-status-change.interface';
import { Booking } from './booking.entity';
import {
  BOOKING_TRANSITION_SELECT,
  SLOT_RELEASING_STATUSES,
} from './bookings.constants';

@Injectable()
export class BookingTransitionService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  fromPending(
    id: number,
    status: BookingStatus,
    { ownerId, rejectReason }: BookingTransitionOptions = {},
  ): Promise<BookingStatusChange> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(Booking, {
        where: ownerId ? { id, userId: ownerId } : { id },
        select: BOOKING_TRANSITION_SELECT,
        lock: { mode: 'pessimistic_write' },
      });
      if (!booking) {
        throw new NotFoundException(this.i18n.t('bookings.not_found'));
      }
      if (booking.status !== BookingStatus.PENDING) {
        throw new ConflictException(
          this.i18n.t('bookings.not_pending', {
            args: { action: this.i18n.t(`bookings.action_${status}`) },
          }),
        );
      }

      await manager.update(Booking, id, {
        status,
        ...(rejectReason !== undefined && { rejectReason }),
      });
      if (SLOT_RELEASING_STATUSES.includes(status)) {
        await manager.increment(
          Tour,
          { id: booking.tourId },
          'availableSlot',
          booking.numberOfAdults + booking.numberOfChildren,
        );
      }
      return { id, status };
    });
  }
}
