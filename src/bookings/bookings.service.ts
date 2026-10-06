import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { DataSource, Repository } from 'typeorm';
import { paginate } from '../common/pagination/paginate.util';
import { Paginated } from '../common/pagination/pagination.interface';
import { fieldError } from '../common/validation/field-error.util';
import { Tour } from '../tours/tour.entity';
import { BookingStatus } from './booking-status.enum';
import { BookingStatusChange } from './booking-status-change.interface';
import { BookingTransitionService } from './booking-transition.service';
import { Booking } from './booking.entity';
import { addDays, calculateTotalPrice, today } from './booking.util';
import {
  BOOKING_LIST_COLUMNS,
  BOOKING_SELECT,
  BOOKING_TOUR_CHECK_SELECT,
  BOOKING_TOUR_SLOT_SELECT,
} from './bookings.constants';
import { applyBookingsFilter } from './bookings-query.util';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(Tour)
    private readonly toursRepository: Repository<Tour>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly bookingTransitionService: BookingTransitionService,
    private readonly i18n: I18nService,
  ) {}

  async create(userId: number, dto: CreateBookingDto): Promise<Booking> {
    const tour = await this.toursRepository.findOne({
      where: { id: dto.tourId },
      select: BOOKING_TOUR_CHECK_SELECT,
    });
    if (!tour) {
      throw fieldError('tourId', this.i18n.t('bookings.tour_not_found'));
    }
    this.assertStartDateFits(tour, dto.startDate);

    const slots = dto.numberOfAdults + dto.numberOfChildren;
    const id = await this.dataSource.transaction(async (manager) => {
      const reserved = await manager
        .createQueryBuilder()
        .update(Tour)
        .set({ availableSlot: () => 'available_slot - :slots' })
        .where('id = :id', { id: tour.id })
        .andWhere('available_slot >= :slots')
        .setParameters({ slots })
        .execute();
      if (!reserved.affected) {
        const { availableSlot } = await manager.findOneOrFail(Tour, {
          where: { id: tour.id },
          select: BOOKING_TOUR_SLOT_SELECT,
        });
        throw new ConflictException(
          this.i18n.t('bookings.not_enough_slots', {
            args: { available: availableSlot },
          }),
        );
      }

      const booking = await manager.save(
        manager.create(Booking, {
          ...dto,
          userId,
          totalPrice: calculateTotalPrice(
            tour.price,
            dto.numberOfAdults,
            dto.numberOfChildren,
          ),
        }),
      );
      return booking.id;
    });
    return this.findOwnOrThrow(userId, id);
  }

  findOwn(
    userId: number,
    query: ListBookingsQueryDto,
  ): Promise<Paginated<Booking>> {
    const qb = applyBookingsFilter(
      this.bookingsRepository
        .createQueryBuilder('booking')
        .innerJoin('booking.tour', 'tour')
        .select(BOOKING_LIST_COLUMNS)
        .withDeleted()
        .where('booking.userId = :userId', { userId }),
      query,
    );
    return paginate(qb.orderBy('booking.id', 'DESC'), query);
  }

  async findOwnOrThrow(userId: number, id: number): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id, userId },
      relations: { tour: true },
      select: BOOKING_SELECT,
      withDeleted: true,
    });
    if (!booking) {
      throw new NotFoundException(this.i18n.t('bookings.not_found'));
    }
    return booking;
  }

  cancel(userId: number, id: number): Promise<BookingStatusChange> {
    return this.bookingTransitionService.fromPending(
      id,
      BookingStatus.CANCELLED,
      { ownerId: userId },
    );
  }

  private assertStartDateFits(
    tour: Pick<Tour, 'startDate' | 'endDate' | 'duration'>,
    startDate: string,
  ): void {
    const from = tour.startDate > today() ? tour.startDate : today();
    const to = addDays(tour.endDate, 1 - tour.duration);
    if (startDate < from || startDate > to) {
      throw fieldError(
        'startDate',
        this.i18n.t('bookings.start_date_out_of_range', {
          args: { from, to },
        }),
      );
    }
  }
}
