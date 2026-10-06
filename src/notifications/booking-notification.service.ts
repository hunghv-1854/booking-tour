import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { I18nContext } from 'nestjs-i18n';
import { BookingStatus } from '../bookings/booking-status.enum';
import {
  BOOKING_NOTIFICATION_JOB_OPTIONS,
  BOOKING_NOTIFICATION_QUEUE,
  BOOKING_STATUS_CHANGED_JOB,
  DEFAULT_MAIL_LANG,
} from './notifications.constants';
import { BookingStatusChangedJob } from './notifications.interface';

@Injectable()
export class BookingNotificationService {
  constructor(
    @InjectQueue(BOOKING_NOTIFICATION_QUEUE)
    private readonly queue: Queue<BookingStatusChangedJob>,
  ) {}

  async notifyStatusChanged(
    bookingId: number,
    status: BookingStatus,
  ): Promise<void> {
    await this.queue.add(
      BOOKING_STATUS_CHANGED_JOB,
      {
        bookingId,
        status,
        lang: I18nContext.current()?.lang ?? DEFAULT_MAIL_LANG,
      },
      BOOKING_NOTIFICATION_JOB_OPTIONS,
    );
  }
}
