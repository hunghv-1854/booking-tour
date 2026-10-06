import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Paginated } from '../common/pagination/pagination.interface';
import { User } from '../users/user.entity';
import { BookingStatusChange } from './booking-status-change.interface';
import { Booking } from './booking.entity';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';

@ApiTags('bookings')
@ApiSecurity('token')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiOperation({ summary: 'Book a tour' })
  @Post()
  createBooking(
    @CurrentUser() user: User,
    @Body() dto: CreateBookingDto,
  ): Promise<Booking> {
    return this.bookingsService.create(user.id, dto);
  }

  @ApiOperation({ summary: 'List my bookings' })
  @Get('me')
  getMyBookings(
    @CurrentUser() user: User,
    @Query() query: ListBookingsQueryDto,
  ): Promise<Paginated<Booking>> {
    return this.bookingsService.findOwn(user.id, query);
  }

  @ApiOperation({ summary: 'Get one of my bookings' })
  @Get(':id')
  getMyBooking(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Booking> {
    return this.bookingsService.findOwnOrThrow(user.id, id);
  }

  @ApiOperation({ summary: 'Cancel my booking while it is still pending' })
  @Patch(':id/cancel')
  cancelBooking(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BookingStatusChange> {
    return this.bookingsService.cancel(user.id, id);
  }
}
