import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Paginated } from '../common/pagination/pagination.interface';
import { UserRole } from '../users/user-role.enum';
import { AdminBookingsService } from './admin-bookings.service';
import { BookingStatusChange } from './booking-status-change.interface';
import { Booking } from './booking.entity';
import { AdminListBookingsQueryDto } from './dto/admin-list-bookings-query.dto';
import { RejectBookingDto } from './dto/reject-booking.dto';

@ApiTags('admin/bookings')
@ApiSecurity('token')
@Controller('admin/bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminBookingsController {
  constructor(private readonly adminBookingsService: AdminBookingsService) {}

  @ApiOperation({ summary: '[Admin] List booking requests' })
  @Get()
  getBookings(
    @Query() query: AdminListBookingsQueryDto,
  ): Promise<Paginated<Booking>> {
    return this.adminBookingsService.findAll(query);
  }

  @ApiOperation({ summary: '[Admin] Get a booking by id' })
  @Get(':id')
  getBooking(@Param('id', ParseIntPipe) id: number): Promise<Booking> {
    return this.adminBookingsService.findByIdOrThrow(id);
  }

  @ApiOperation({ summary: '[Admin] Approve a pending booking' })
  @Patch(':id/approve')
  approveBooking(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BookingStatusChange> {
    return this.adminBookingsService.approve(id);
  }

  @ApiOperation({ summary: '[Admin] Reject a pending booking' })
  @Patch(':id/reject')
  rejectBooking(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectBookingDto,
  ): Promise<BookingStatusChange> {
    return this.adminBookingsService.reject(id, dto);
  }
}
