import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from '../attachments/attachment.entity';
import { Booking } from '../bookings/booking.entity';
import { Category } from '../categories/category.entity';
import { Review } from '../reviews/review.entity';
import { AdminToursController } from './admin-tours.controller';
import { AdminToursService } from './admin-tours.service';
import { TourItinerary } from './tour-itinerary.entity';
import { Tour } from './tour.entity';
import { ToursController } from './tours.controller';
import { ToursService } from './tours.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tour,
      TourItinerary,
      Category,
      Review,
      Booking,
      Attachment,
    ]),
  ],
  controllers: [ToursController, AdminToursController],
  providers: [ToursService, AdminToursService],
  exports: [ToursService],
})
export class ToursModule {}
