import { Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DataSource, Repository } from 'typeorm';
import { createI18nMock } from '../common/testing/i18n.mock';
import { BookingNotificationService } from '../notifications/booking-notification.service';
import { NotificationTemplate } from '../notifications/notification-template.enum';
import { BookingCompletionTask } from './booking-completion.task';
import { BookingExpirationTask } from './booking-expiration.task';
import { BookingReminderTask } from './booking-reminder.task';
import { BookingStatus } from './booking-status.enum';
import { Booking } from './booking.entity';

describe('Booking scheduled tasks', () => {
  const manager = { query: jest.fn() };
  const dataSource = {
    query: manager.query,
    transaction: jest.fn((work: (m: typeof manager) => Promise<unknown>) =>
      work(manager),
    ),
  };
  const bookingsRepository = { find: jest.fn() };
  const notifications = { notifyMany: jest.fn() };

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-20T20:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  let loggerError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  it('completes finished bookings and invites their users to review', async () => {
    dataSource.query.mockResolvedValue([[{ id: 4 }, { id: 9 }], 2]);
    const task = new BookingCompletionTask(
      dataSource as unknown as DataSource,
      notifications as unknown as BookingNotificationService,
    );

    await expect(task.completeFinishedBookings()).resolves.toEqual([4, 9]);
    expect(notifications.notifyMany).toHaveBeenCalledWith(
      [4, 9],
      NotificationTemplate.REVIEW_INVITATION,
    );
  });

  it('rejects pending bookings that reached their departure date and notifies users', async () => {
    dataSource.query.mockResolvedValue([{ id: 7 }]);
    const task = new BookingExpirationTask(
      dataSource as unknown as DataSource,
      notifications as unknown as BookingNotificationService,
      createI18nMock() as unknown as I18nService,
    );

    await expect(task.rejectExpiredPendingBookings()).resolves.toEqual([7]);
    const [sql, params] = dataSource.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('available_slot = tour.available_slot + freed.slots');
    expect(params).toEqual([
      BookingStatus.REJECTED,
      'bookings.auto_reject_reason',
      BookingStatus.PENDING,
      'Asia/Ho_Chi_Minh',
    ]);
    expect(notifications.notifyMany).toHaveBeenCalledWith(
      [7],
      NotificationTemplate.BOOKING_REJECTED,
    );
  });

  it('reminds approved bookings departing tomorrow in Vietnam time', async () => {
    bookingsRepository.find.mockResolvedValue([{ id: 11 }]);
    const task = new BookingReminderTask(
      bookingsRepository as unknown as Repository<Booking>,
      notifications as unknown as BookingNotificationService,
    );

    await task.remindUpcomingDepartures();

    expect(bookingsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: BookingStatus.APPROVED, startDate: '2026-10-22' },
      }),
    );
    expect(notifications.notifyMany).toHaveBeenCalledWith(
      [11],
      NotificationTemplate.BOOKING_REMINDER,
    );
  });

  it('rolls back the completion when notifications cannot be queued', async () => {
    dataSource.query.mockResolvedValue([[{ id: 4 }], 1]);
    notifications.notifyMany.mockRejectedValueOnce(new Error('redis down'));
    const task = new BookingCompletionTask(
      dataSource as unknown as DataSource,
      notifications as unknown as BookingNotificationService,
    );

    await expect(task.completeFinishedBookings()).resolves.toEqual([]);
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(loggerError).toHaveBeenCalledWith(
      'Booking completion failed, will retry on next run',
      expect.stringContaining('redis down'),
    );
  });

  it('logs and swallows reminder failures so the scheduler keeps running', async () => {
    bookingsRepository.find.mockRejectedValueOnce(new Error('db down'));
    const task = new BookingReminderTask(
      bookingsRepository as unknown as Repository<Booking>,
      notifications as unknown as BookingNotificationService,
    );

    await expect(task.remindUpcomingDepartures()).resolves.toEqual([]);
    expect(notifications.notifyMany).not.toHaveBeenCalled();
    expect(loggerError).toHaveBeenCalledWith(
      'Departure reminder failed, will retry on next run',
      expect.stringContaining('db down'),
    );
  });
});
