import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { paginate } from '../common/pagination/paginate.util';
import { Paginated } from '../common/pagination/pagination.interface';
import { BookingNotificationService } from '../notifications/booking-notification.service';
import { BookingStatus } from './booking-status.enum';
import { BookingStatusChange } from './booking-status-change.interface';
import { BookingTransitionService } from './booking-transition.service';
import { Booking } from './booking.entity';
import {
  ADMIN_BOOKING_KEYWORD_COLUMNS,
  ADMIN_BOOKING_LIST_COLUMNS,
  ADMIN_BOOKING_SELECT,
} from './bookings.constants';
import { applyBookingsFilter } from './bookings-query.util';
import { AdminListBookingsQueryDto } from './dto/admin-list-bookings-query.dto';
import { RejectBookingDto } from './dto/reject-booking.dto';

@Injectable()
export class AdminBookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly bookingTransitionService: BookingTransitionService,
    private readonly bookingNotificationService: BookingNotificationService,
    private readonly i18n: I18nService,
  ) {}

  findAll(query: AdminListBookingsQueryDto): Promise<Paginated<Booking>> {
    const qb = applyBookingsFilter(
      this.bookingsRepository
        .createQueryBuilder('booking')
        .innerJoin('booking.tour', 'tour')
        .innerJoin('booking.user', 'user')
        .select(ADMIN_BOOKING_LIST_COLUMNS)
        .withDeleted(),
      query,
      ADMIN_BOOKING_KEYWORD_COLUMNS,
    );
    return paginate(qb.orderBy('booking.id', 'DESC'), query);
  }

  async findByIdOrThrow(id: number): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: { tour: true, user: true },
      select: ADMIN_BOOKING_SELECT,
      withDeleted: true,
    });
    if (!booking) {
      throw new NotFoundException(this.i18n.t('bookings.not_found'));
    }
    return booking;
  }

  async approve(id: number): Promise<BookingStatusChange> {
    const change = await this.bookingTransitionService.fromPending(
      id,
      BookingStatus.APPROVED,
    );
    await this.bookingNotificationService.notifyStatusChanged(
      id,
      change.status,
    );
    return change;
  }

  async reject(
    id: number,
    dto: RejectBookingDto,
  ): Promise<BookingStatusChange> {
    const change = await this.bookingTransitionService.fromPending(
      id,
      BookingStatus.REJECTED,
      { rejectReason: dto.reason },
    );
    await this.bookingNotificationService.notifyStatusChanged(
      id,
      change.status,
    );
    return change;
  }
}
