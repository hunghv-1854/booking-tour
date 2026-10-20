import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { DataSource } from 'typeorm';
import { APP_TIMEZONE } from '../common/time/time.constants';
import { BookingNotificationService } from '../notifications/booking-notification.service';
import { NotificationTemplate } from '../notifications/notification-template.enum';
import { DEFAULT_MAIL_LANG } from '../notifications/notifications.constants';
import { BookingStatus } from './booking-status.enum';
import { BOOKING_EXPIRATION_CRON } from './bookings.constants';

@Injectable()
export class BookingExpirationTask {
  private readonly logger = new Logger(BookingExpirationTask.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly bookingNotificationService: BookingNotificationService,
    private readonly i18n: I18nService,
  ) {}

  @Cron(BOOKING_EXPIRATION_CRON, { timeZone: APP_TIMEZONE })
  async rejectExpiredPendingBookings(): Promise<number[]> {
    const rows = await this.dataSource.query<{ id: number }[]>(
      `WITH expired AS (
         UPDATE bookings
         SET status = $1, reject_reason = $2, updated_at = now()
         WHERE status = $3 AND start_date <= (now() AT TIME ZONE $4)::date
         RETURNING id, tour_id, number_of_adults + number_of_children AS slots
       ), released AS (
         UPDATE tours AS tour
         SET available_slot = tour.available_slot + freed.slots
         FROM (SELECT tour_id, SUM(slots) AS slots FROM expired GROUP BY tour_id) AS freed
         WHERE tour.id = freed.tour_id
       )
       SELECT id FROM expired`,
      [
        BookingStatus.REJECTED,
        this.i18n.t('bookings.auto_reject_reason', { lang: DEFAULT_MAIL_LANG }),
        BookingStatus.PENDING,
        APP_TIMEZONE,
      ],
    );
    const ids = rows.map((row) => row.id);
    await this.bookingNotificationService.notifyMany(
      ids,
      NotificationTemplate.BOOKING_REJECTED,
    );
    this.logger.log(`Rejected ${ids.length} expired pending bookings`);
    return ids;
  }
}
