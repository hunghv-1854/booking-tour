import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from '../bookings/booking.entity';
import { MailModule } from '../mail/mail.module';
import { BookingNotificationProcessor } from './booking-notification.processor';
import { BookingNotificationService } from './booking-notification.service';
import { BOOKING_NOTIFICATION_QUEUE } from './notifications.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: BOOKING_NOTIFICATION_QUEUE }),
    TypeOrmModule.forFeature([Booking]),
    MailModule,
  ],
  providers: [BookingNotificationService, BookingNotificationProcessor],
  exports: [BookingNotificationService],
})
export class NotificationsModule {}
