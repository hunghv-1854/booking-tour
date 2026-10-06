import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/booking.entity';
import { MailService } from '../mail/mail.service';
import {
  BOOKING_NOTIFICATION_QUEUE,
  BOOKING_NOTIFICATION_SELECT,
} from './notifications.constants';
import { BookingStatusChangedJob } from './notifications.interface';

@Processor(BOOKING_NOTIFICATION_QUEUE)
export class BookingNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(BookingNotificationProcessor.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly mailService: MailService,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async process({ data }: Job<BookingStatusChangedJob>): Promise<void> {
    const booking = await this.bookingsRepository.findOne({
      where: { id: data.bookingId },
      relations: { user: true, tour: true },
      select: BOOKING_NOTIFICATION_SELECT,
      withDeleted: true,
    });
    if (!booking) {
      this.logger.warn(`Booking #${data.bookingId} not found, skip email`);
      return;
    }

    const args = {
      bookingId: booking.id,
      fullName: booking.user.fullName,
      tourName: booking.tour.name,
      startDate: booking.startDate,
      reason: booking.rejectReason,
    };
    const t = (key: string) =>
      this.i18n.t(`mail.booking_${data.status}_${key}`, {
        lang: data.lang,
        args,
      });

    await this.mailService.send({
      to: booking.user.email,
      subject: t('subject'),
      text: t('body'),
    });
    this.logger.log(
      `Sent ${data.status} email for booking #${booking.id} to ${booking.user.email}`,
    );
  }
}
