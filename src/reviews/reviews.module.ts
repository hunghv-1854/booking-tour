import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from '../attachments/attachment.entity';
import { Booking } from '../bookings/booking.entity';
import { Tour } from '../tours/tour.entity';
import { AdminReviewsController } from './admin-reviews.controller';
import { AdminReviewsService } from './admin-reviews.service';
import { Review } from './review.entity';
import { ReviewsService } from './reviews.service';
import { TourReviewsController } from './tour-reviews.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Booking, Tour, Attachment])],
  controllers: [TourReviewsController, AdminReviewsController],
  providers: [ReviewsService, AdminReviewsService],
})
export class ReviewsModule {}
