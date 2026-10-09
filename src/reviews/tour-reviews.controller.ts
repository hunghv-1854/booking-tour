import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationQueryDto } from '../common/pagination/pagination-query.dto';
import { Paginated } from '../common/pagination/pagination.interface';
import { User } from '../users/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreatedReview, TourReviewItem } from './reviews.interface';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('tours/:tourId/reviews')
export class TourReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'List reviews of a tour' })
  @Get()
  getTourReviews(
    @Param('tourId', ParseIntPipe) tourId: number,
    @Query() query: PaginationQueryDto,
  ): Promise<Paginated<TourReviewItem>> {
    return this.reviewsService.findByTour(tourId, query);
  }

  @ApiOperation({ summary: 'Review a tour after completing a booking' })
  @ApiSecurity('token')
  @UseGuards(JwtAuthGuard)
  @Post()
  createReview(
    @CurrentUser() user: User,
    @Param('tourId', ParseIntPipe) tourId: number,
    @Body() dto: CreateReviewDto,
  ): Promise<CreatedReview> {
    return this.reviewsService.create(user.id, tourId, dto);
  }
}
