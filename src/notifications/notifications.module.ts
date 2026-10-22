import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { MailModule } from '../mail/mail.module';
import { User } from '../users/user.entity';
import { AccountNotificationProcessor } from './account-notification.processor';
import { AccountNotificationService } from './account-notification.service';
import { BookingNotificationProcessor } from './booking-notification.processor';
import { BookingNotificationService } from './booking-notification.service';
import {
  ACCOUNT_NOTIFICATION_QUEUE,
  BOOKING_NOTIFICATION_QUEUE,
} from './notifications.constants';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: BOOKING_NOTIFICATION_QUEUE },
      { name: ACCOUNT_NOTIFICATION_QUEUE },
    ),
    TypeOrmModule.forFeature([Booking, User]),
    MailModule,
  ],
  providers: [
    BookingNotificationService,
    BookingNotificationProcessor,
    AccountNotificationService,
    AccountNotificationProcessor,
  ],
  exports: [BookingNotificationService, AccountNotificationService],
})
export class NotificationsModule {}
