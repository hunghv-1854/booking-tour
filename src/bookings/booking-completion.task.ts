import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { APP_TIMEZONE } from '../common/time/time.constants';
import { BookingStatus } from './booking-status.enum';

@Injectable()
export class BookingCompletionTask {
  private readonly logger = new Logger(BookingCompletionTask.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM, { timeZone: APP_TIMEZONE })
  async completeFinishedBookings(): Promise<number> {
    const [, affected] = await this.dataSource.query<[unknown, number]>(
      `UPDATE bookings AS booking
       SET status = $1, updated_at = now()
       FROM tours AS tour
       WHERE tour.id = booking.tour_id
         AND booking.status = $2
         AND booking.start_date + tour.duration - 1 < (now() AT TIME ZONE $3)::date`,
      [BookingStatus.COMPLETED, BookingStatus.APPROVED, APP_TIMEZONE],
    );
    this.logger.log(`Marked ${affected} bookings as completed`);
    return affected;
  }
}
