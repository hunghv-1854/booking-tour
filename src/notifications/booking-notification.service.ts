import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { I18nContext } from 'nestjs-i18n';
import { BookingStatus } from '../bookings/booking-status.enum';
import { NotificationTemplate } from './notification-template.enum';
import {
  BOOKING_NOTIFICATION_JOB,
  BOOKING_NOTIFICATION_JOB_OPTIONS,
  BOOKING_NOTIFICATION_QUEUE,
  DEFAULT_MAIL_LANG,
  SCHEDULED_NOTIFICATION_RETENTION_SECONDS,
  STATUS_NOTIFICATION_TEMPLATES,
} from './notifications.constants';
import { BookingNotificationJob } from './notifications.interface';

@Injectable()
export class BookingNotificationService {
  constructor(
    @InjectQueue(BOOKING_NOTIFICATION_QUEUE)
    private readonly queue: Queue<BookingNotificationJob>,
  ) {}

  async notifyStatusChanged(
    bookingId: number,
    status: BookingStatus,
  ): Promise<void> {
    const template = STATUS_NOTIFICATION_TEMPLATES[status];
    if (!template) return;

    await this.queue.add(
      BOOKING_NOTIFICATION_JOB,
      {
        bookingId,
        template,
        lang: I18nContext.current()?.lang ?? DEFAULT_MAIL_LANG,
      },
      BOOKING_NOTIFICATION_JOB_OPTIONS,
    );
  }

  async notifyMany(
    bookingIds: number[],
    template: NotificationTemplate,
  ): Promise<void> {
    if (!bookingIds.length) return;

    await this.queue.addBulk(
      bookingIds.map((bookingId) => ({
        name: BOOKING_NOTIFICATION_JOB,
        data: { bookingId, template, lang: DEFAULT_MAIL_LANG },
        opts: {
          ...BOOKING_NOTIFICATION_JOB_OPTIONS,
          jobId: `${template}-${bookingId}`,
          removeOnComplete: { age: SCHEDULED_NOTIFICATION_RETENTION_SECONDS },
        },
      })),
    );
  }
}
