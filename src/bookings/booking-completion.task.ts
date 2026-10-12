import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BookingStatus } from './booking-status.enum';

@Injectable()
export class BookingCompletionTask {
  private readonly logger = new Logger(BookingCompletionTask.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async completeFinishedBookings(): Promise<number> {
    const [, affected] = await this.dataSource.query<[unknown, number]>(
      `UPDATE bookings AS booking
       SET status = $1, updated_at = now()
       FROM tours AS tour
       WHERE tour.id = booking.tour_id
         AND booking.status = $2
         AND booking.start_date + tour.duration - 1 < CURRENT_DATE`,
      [BookingStatus.COMPLETED, BookingStatus.APPROVED],
    );
    this.logger.log(`Marked ${affected} bookings as completed`);
    return affected;
  }
}
