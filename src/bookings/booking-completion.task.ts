import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { APP_TIMEZONE } from '../common/time/time.constants';
import { BookingNotificationService } from '../notifications/booking-notification.service';
import { NotificationTemplate } from '../notifications/notification-template.enum';
import { BookingStatus } from './booking-status.enum';
import { BOOKING_COMPLETION_CRON } from './bookings.constants';

@Injectable()
export class BookingCompletionTask {
  private readonly logger = new Logger(BookingCompletionTask.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly bookingNotificationService: BookingNotificationService,
  ) {}

  @Cron(BOOKING_COMPLETION_CRON, { timeZone: APP_TIMEZONE })
  async completeFinishedBookings(): Promise<number[]> {
    const [rows] = await this.dataSource.query<[{ id: number }[], number]>(
      `UPDATE bookings AS booking
       SET status = $1, updated_at = now()
       FROM tours AS tour
       WHERE tour.id = booking.tour_id
         AND booking.status = $2
         AND booking.start_date + tour.duration - 1 < (now() AT TIME ZONE $3)::date
       RETURNING booking.id`,
      [BookingStatus.COMPLETED, BookingStatus.APPROVED, APP_TIMEZONE],
    );
    const ids = rows.map((row) => row.id);
    await this.bookingNotificationService.notifyMany(
      ids,
      NotificationTemplate.REVIEW_INVITATION,
    );
    this.logger.log(`Marked ${ids.length} bookings as completed`);
    return ids;
  }
}
