import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { I18nService } from 'nestjs-i18n';
import { BookingStatus } from '../bookings/booking-status.enum';
import { Booking } from '../bookings/booking.entity';
import { createI18nMock } from '../common/testing/i18n.mock';
import { MailService } from '../mail/mail.service';
import { BookingNotificationProcessor } from './booking-notification.processor';
import { BookingStatusChangedJob } from './notifications.interface';

jest.mock('@nestjs/bullmq', () => ({
  Processor: () => () => undefined,
  WorkerHost: class {},
}));

describe('BookingNotificationProcessor', () => {
  let processor: BookingNotificationProcessor;
  const bookingsRepository = { findOne: jest.fn() };
  const mailService = { send: jest.fn() };
  const i18n = createI18nMock();
  const jobOf = (data: BookingStatusChangedJob) =>
    ({ data }) as Job<BookingStatusChangedJob>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingNotificationProcessor,
        { provide: getRepositoryToken(Booking), useValue: bookingsRepository },
        { provide: MailService, useValue: mailService },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();
    processor = moduleRef.get(BookingNotificationProcessor);
  });

  it('skips sending when the booking no longer exists', async () => {
    bookingsRepository.findOne.mockResolvedValue(null);

    await processor.process(
      jobOf({ bookingId: 1, status: BookingStatus.APPROVED, lang: 'vi' }),
    );

    expect(mailService.send).not.toHaveBeenCalled();
  });

  it('sends the email in the job language with the booking details', async () => {
    bookingsRepository.findOne.mockResolvedValue({
      id: 8,
      startDate: '2026-11-05',
      rejectReason: 'Fully booked',
      user: { id: 7, email: 'an@example.com', fullName: 'An' },
      tour: { id: 3, name: 'Tour Huế' },
    });

    await processor.process(
      jobOf({ bookingId: 8, status: BookingStatus.REJECTED, lang: 'en' }),
    );

    expect(i18n.t).toHaveBeenCalledWith('mail.booking_rejected_subject', {
      lang: 'en',
      args: expect.objectContaining({
        bookingId: 8,
        tourName: 'Tour Huế',
        reason: 'Fully booked',
      }) as object,
    });
    expect(mailService.send).toHaveBeenCalledWith({
      to: 'an@example.com',
      subject: 'mail.booking_rejected_subject',
      text: 'mail.booking_rejected_body',
    });
  });
});
