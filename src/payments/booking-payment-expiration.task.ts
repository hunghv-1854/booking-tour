import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BookingPaymentStatus } from '../bookings/booking-payment-status.enum';
import { BookingStatus } from '../bookings/booking-status.enum';
import { runScheduledTask } from '../common/scheduling/scheduled-task.util';
import { APP_TIMEZONE } from '../common/time/time.constants';
import { BookingNotificationService } from '../notifications/booking-notification.service';
import { NotificationTemplate } from '../notifications/notification-template.enum';
import { PaymentStatus } from './payment-status.enum';
import { BOOKING_PAYMENT_EXPIRATION_CRON } from './payments.constants';

@Injectable()
export class BookingPaymentExpirationTask {
  private readonly logger = new Logger(BookingPaymentExpirationTask.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly bookingNotificationService: BookingNotificationService,
  ) {}

  @Cron(BOOKING_PAYMENT_EXPIRATION_CRON, { timeZone: APP_TIMEZONE })
  cancelUnpaidBookings(): Promise<number[]> {
    return runScheduledTask(this.logger, 'Booking payment expiration', () =>
      this.dataSource.transaction(async (manager) => {
        const rows = await manager.query<{ id: number }[]>(
          `WITH expired AS (
             UPDATE bookings AS booking
             SET status = $1, updated_at = now()
             WHERE booking.status = $2
               AND booking.payment_status = $3
               AND booking.payment_due_at < now()
               AND NOT EXISTS (
                 SELECT 1 FROM payments AS payment
                 WHERE payment.booking_id = booking.id AND payment.status = $4
               )
             RETURNING booking.id, booking.tour_id,
               booking.number_of_adults + booking.number_of_children AS slots
           ), released AS (
             UPDATE tours AS tour
             SET available_slot = tour.available_slot + freed.slots
             FROM (SELECT tour_id, SUM(slots) AS slots FROM expired GROUP BY tour_id) AS freed
             WHERE tour.id = freed.tour_id
           )
           SELECT id FROM expired`,
          [
            BookingStatus.CANCELLED,
            BookingStatus.APPROVED,
            BookingPaymentStatus.UNPAID,
            PaymentStatus.PENDING,
          ],
        );
        const ids = rows.map((row) => row.id);
        await this.bookingNotificationService.notifyMany(
          ids,
          NotificationTemplate.BOOKING_PAYMENT_EXPIRED,
        );
        this.logger.log(`Cancelled ${ids.length} unpaid bookings`);
        return ids;
      }),
    );
  }
}
