import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { runScheduledTask } from '../common/scheduling/scheduled-task.util';
import { APP_TIMEZONE } from '../common/time/time.constants';
import { BookingNotificationService } from '../notifications/booking-notification.service';
import { NotificationTemplate } from '../notifications/notification-template.enum';
import { BookingPaymentStatus } from './booking-payment-status.enum';
import { BookingStatus } from './booking-status.enum';
import { Booking } from './booking.entity';
import { addDays, today } from './booking.util';
import {
  BOOKING_REMINDER_CRON,
  BOOKING_REMINDER_DAYS_BEFORE,
  BOOKING_REMINDER_SELECT,
} from './bookings.constants';

@Injectable()
export class BookingReminderTask {
  private readonly logger = new Logger(BookingReminderTask.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly bookingNotificationService: BookingNotificationService,
  ) {}

  @Cron(BOOKING_REMINDER_CRON, { timeZone: APP_TIMEZONE })
  remindUpcomingDepartures(): Promise<number[]> {
    return runScheduledTask(this.logger, 'Departure reminder', async () => {
      const bookings = await this.bookingsRepository.find({
        where: {
          status: BookingStatus.APPROVED,
          paymentStatus: BookingPaymentStatus.PAID,
          startDate: addDays(today(), BOOKING_REMINDER_DAYS_BEFORE),
        },
        select: BOOKING_REMINDER_SELECT,
      });
      const ids = bookings.map((booking) => booking.id);
      await this.bookingNotificationService.notifyMany(
        ids,
        NotificationTemplate.BOOKING_REMINDER,
      );
      this.logger.log(`Queued ${ids.length} departure reminders`);
      return ids;
    });
  }
}
