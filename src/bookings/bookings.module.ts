import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tour } from '../tours/tour.entity';
import { AdminBookingsController } from './admin-bookings.controller';
import { AdminBookingsService } from './admin-bookings.service';
import { BookingTransitionService } from './booking-transition.service';
import { Booking } from './booking.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Tour])],
  controllers: [BookingsController, AdminBookingsController],
  providers: [BookingsService, AdminBookingsService, BookingTransitionService],
})
export class BookingsModule {}
