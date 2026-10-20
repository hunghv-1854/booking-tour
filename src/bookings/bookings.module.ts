import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { Tour } from '../tours/tour.entity';
import { AdminBookingsController } from './admin-bookings.controller';
import { AdminBookingsService } from './admin-bookings.service';
import { BookingCompletionTask } from './booking-completion.task';
import { BookingExpirationTask } from './booking-expiration.task';
import { BookingReminderTask } from './booking-reminder.task';
import { BookingTransitionService } from './booking-transition.service';
import { Booking } from './booking.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Tour]), NotificationsModule],
  controllers: [BookingsController, AdminBookingsController],
  providers: [
    BookingsService,
    AdminBookingsService,
    BookingTransitionService,
    BookingCompletionTask,
    BookingExpirationTask,
    BookingReminderTask,
  ],
})
export class BookingsModule {}
