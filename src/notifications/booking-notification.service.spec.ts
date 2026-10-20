import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { BookingStatus } from '../bookings/booking-status.enum';
import { BookingNotificationService } from './booking-notification.service';
import { NotificationTemplate } from './notification-template.enum';
import {
  BOOKING_NOTIFICATION_JOB,
  BOOKING_NOTIFICATION_QUEUE,
} from './notifications.constants';

describe('BookingNotificationService', () => {
  let service: BookingNotificationService;
  const queue = { add: jest.fn(), addBulk: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingNotificationService,
        { provide: getQueueToken(BOOKING_NOTIFICATION_QUEUE), useValue: queue },
      ],
    }).compile();
    service = moduleRef.get(BookingNotificationService);
  });

  it('maps an approved booking to the approved template', async () => {
    await service.notifyStatusChanged(3, BookingStatus.APPROVED);

    expect(queue.add).toHaveBeenCalledWith(
      BOOKING_NOTIFICATION_JOB,
      expect.objectContaining({
        bookingId: 3,
        template: NotificationTemplate.BOOKING_APPROVED,
      }),
      expect.any(Object),
    );
  });

  it('sends nothing for statuses without a template', async () => {
    await service.notifyStatusChanged(3, BookingStatus.CANCELLED);

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('queues one job per booking with a deterministic jobId to avoid duplicates', async () => {
    await service.notifyMany([1, 2], NotificationTemplate.BOOKING_REMINDER);

    const [jobs] = queue.addBulk.mock.calls[0] as [
      { data: object; opts: { jobId: string } }[],
    ];
    expect(jobs.map((job) => job.opts.jobId)).toEqual([
      'booking_reminder-1',
      'booking_reminder-2',
    ]);
    expect(jobs[0].data).toEqual({
      bookingId: 1,
      template: NotificationTemplate.BOOKING_REMINDER,
      lang: 'vi',
    });
  });

  it('skips the queue when there is nothing to notify', async () => {
    await service.notifyMany([], NotificationTemplate.REVIEW_INVITATION);

    expect(queue.addBulk).not.toHaveBeenCalled();
  });
});
